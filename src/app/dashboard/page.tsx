import {
  fetchRepoFile,
  fetchFinanceData,
  fetchBandwidth,
  fetchHealth,
  fetchProjects,
  fetchLearnieHealth,
  fetchCompanyCheckpoint,
  extractMichaelBlockers,
  fetchTooling,
  fetchRadarStatus,
} from '@/lib/github';

function parseAgentStatuses(bandwidth: string | null): {
  agents: { name: string; status: string; color: string }[];
  lastLoop: string;
  loopStale: boolean;
} {
  if (!bandwidth)
    return { agents: [], lastLoop: 'unknown', loopStale: true };

  const agents: { name: string; status: string; color: string }[] = [];
  const lines = bandwidth.split('\n');

  for (const line of lines) {
    if (!line.includes('|') || line.includes('Agent')) continue;
    const cols = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cols.length >= 3) {
      const name = cols[1]?.toLowerCase() || '';
      const statusRaw = cols[2] || '';
      if (['mika', 'koda', 'rex', 'sage', 'lumina', 'byte'].includes(name)) {
        const isOnline =
          statusRaw.includes('🟢') || statusRaw.includes('loop');
        const isBusy = statusRaw.includes('🟡') || statusRaw.includes('busy');
        const isOffline = statusRaw.includes('⚪') || statusRaw.includes('offline');
        agents.push({
          name,
          status: isOffline ? 'off' : isBusy ? 'busy' : 'on',
          color: isOffline
            ? 'bg-zinc-600'
            : isBusy
              ? 'bg-amber-400'
              : 'bg-green-400',
        });
      }
    }
  }

  const loopMatch = bandwidth.match(/Last loop:\s*(\S+)/);
  const lastLoop = loopMatch?.[1] || 'unknown';
  let loopStale = true;
  if (lastLoop !== 'unknown') {
    const loopTime = new Date(lastLoop).getTime();
    loopStale = Date.now() - loopTime > 15 * 60 * 1000;
  }

  return { agents, lastLoop, loopStale };
}

function parseTodoTasks(content: string | null): string[] {
  if (!content) return [];
  return content
    .split('\n')
    .filter((l) => l.includes('⏳ TODO') && (l.includes('TASK-') || l.includes('CP-')))
    .map((l) => {
      const cols = l
        .split('|')
        .map((c) => c.trim())
        .filter(Boolean);
      if (cols.length >= 5) {
        return `${cols[0]} · ${cols[3]} · ${cols[4]}`;
      }
      if (cols.length >= 3) {
        return `${cols[0]} · ${cols[cols.length - 1]}`;
      }
      return l.replace(/\|/g, '').trim();
    })
    .slice(0, 5);
}

function parseRadarStatus(content: string | null): {
  tradeCount: number;
  lastTrade: string;
} {
  if (!content) return { tradeCount: 0, lastTrade: 'none' };
  const lines = content.split('\n').filter(
    (l) => l.startsWith('|') && !l.includes('---') && !l.includes('Date'),
  );
  return {
    tradeCount: lines.length,
    lastTrade: lines.length > 0 ? lines[lines.length - 1].trim() : 'none',
  };
}

function parseToolingStatus(content: string | null): {
  connectors: number;
  skills: number;
} {
  if (!content) return { connectors: 0, skills: 0 };
  const sections = content.split(/^##\s/m);
  let connectors = 0;
  let skills = 0;
  for (const section of sections) {
    if (section.toLowerCase().includes('mapping') || section.toLowerCase().includes('connector')) {
      const rows = section.split('\n').filter(
        (l) => l.includes('|') && !l.includes('---') && (l.includes('Enabled') || l.includes('✅')),
      );
      connectors = rows.length;
    }
    if (section.toLowerCase().includes('skill') || section.toLowerCase().includes('inventory')) {
      const rows = section.split('\n').filter(
        (l) => l.includes('|') && !l.includes('---') && !l.toLowerCase().includes('skill'),
      );
      skills = rows.length;
    }
  }
  return { connectors, skills };
}

function parseFinanceMetrics(finance: string | null): {
  mrr: string;
  burn: string;
  budgetLeft: string;
  runway: string;
} {
  const defaults = {
    mrr: '$0',
    burn: '~$5/mo',
    budgetLeft: 'unknown',
    runway: '∞',
  };
  if (!finance) return defaults;

  const mrrMatch = finance.match(/MRR[:\s]*\$?([\d,.]+)/i);
  const burnMatch = finance.match(/(?:burn|spend)[:\s]*~?\$?([\d,.]+)/i);
  const budgetMatch = finance.match(
    /(?:budget|remaining|left)[:\s]*~?\$?([\d,.]+)/i,
  );
  const runwayMatch = finance.match(/runway[:\s]*([\w∞]+)/i);

  return {
    mrr: mrrMatch ? `$${mrrMatch[1]}` : defaults.mrr,
    burn: burnMatch ? `~$${burnMatch[1]}/mo` : defaults.burn,
    budgetLeft: budgetMatch ? `$${budgetMatch[1]}` : defaults.budgetLeft,
    runway: runwayMatch ? runwayMatch[1] : defaults.runway,
  };
}

function parseProjectStatuses(
  projects: string | null,
): { name: string; status: string; color: string }[] {
  if (!projects) return [];
  const results: { name: string; status: string; color: string }[] = [];
  for (const line of projects.split('\n')) {
    if (!line.includes('|') || line.includes('Project') || line.includes('---'))
      continue;
    const cols = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    if (cols.length >= 2) {
      const name = cols[0];
      const statusRaw = cols[1];
      const isActive =
        statusRaw.includes('✅') || statusRaw.includes('Active');
      const isHold =
        statusRaw.includes('⏸') || statusRaw.includes('Hold');
      const isArchived =
        statusRaw.includes('❌') || statusRaw.includes('Deprioritized') || statusRaw.includes('Passed');
      if (isArchived) continue;
      results.push({
        name,
        status: isActive ? 'LIVE' : isHold ? 'QUEUE' : 'QUEUE',
        color: isActive ? 'bg-green-400' : 'bg-zinc-500',
      });
    }
  }
  return results;
}

function parseHealthStatus(health: string | null): {
  lastScan: string;
  isStale: boolean;
  summary: string;
} {
  if (!health)
    return { lastScan: 'unknown', isStale: true, summary: 'No data' };

  const timeMatch = health.match(
    /(?:updated|scan|last)[:\s]*([\d-]+\s*[\d:]+\s*\w*)/i,
  );
  const lastScan = timeMatch?.[1] || 'unknown';

  let isStale = true;
  if (lastScan !== 'unknown') {
    const scanTime = new Date(lastScan).getTime();
    isStale = Date.now() - scanTime > 25 * 60 * 60 * 1000;
  }

  const hasIssues =
    health.includes('⚠️') ||
    health.includes('FAIL') ||
    health.includes('STALE');
  const summary = hasIssues ? 'Issues detected' : 'Clean';

  return { lastScan, isStale, summary };
}

export default async function DashboardOverview() {
  const [
    learnieAgents,
    companyCheckpoint,
    finance,
    bandwidth,
    health,
    projects,
    learnieHealth,
    tooling,
    radarLog,
  ] = await Promise.all([
    fetchRepoFile('learnie-ai', 'AGENTS.md'),
    fetchCompanyCheckpoint(),
    fetchFinanceData(),
    fetchBandwidth(),
    fetchHealth(),
    fetchProjects(),
    fetchLearnieHealth(),
    fetchTooling(),
    fetchRadarStatus(),
  ]);

  const blockers = extractMichaelBlockers(learnieAgents, companyCheckpoint);
  const todoTasks = parseTodoTasks(learnieAgents);
  const { agents, lastLoop, loopStale } = parseAgentStatuses(bandwidth);
  const financeMetrics = parseFinanceMetrics(finance);
  const projectStatuses = parseProjectStatuses(projects);
  const healthStatus = parseHealthStatus(health);
  const radarStatus = parseRadarStatus(radarLog);
  const toolingStatus = parseToolingStatus(tooling);

  const now = new Date().toISOString().slice(11, 16);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-xs text-muted">
          Data from GitHub · refreshes every 5 min · Last: {now} UTC
        </div>
      </div>

      {/* 3-col grid, 2 rows */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Row 1, Col 1 — Needs Michael */}
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-3">
            🔴 Needs Michael
          </div>
          {blockers.length === 0 ? (
            <div className="text-sm text-green-400">✅ Nothing pending</div>
          ) : (
            <div className="space-y-2">
              {blockers.slice(0, 5).map((b, i) => (
                <div key={i} className="text-xs text-foreground/80 leading-relaxed">
                  {b.slice(0, 80)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 1, Col 2 — Building Now */}
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs font-semibold text-accent uppercase tracking-wide mb-3">
            🏗 Building Now
          </div>
          {todoTasks.length === 0 ? (
            <div className="text-sm text-green-400">✅ Queue clear</div>
          ) : (
            <div className="space-y-2">
              {todoTasks.map((t, i) => (
                <div key={i} className="text-xs text-foreground/80 leading-relaxed truncate">
                  {t}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 1, Col 3 — Production Health */}
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-3">
            🌐 Production
          </div>

          {/* Projects */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${learnieHealth.ok ? 'bg-green-400' : 'bg-red-400'}`}
              />
              <span>Learnie AI</span>
              <span className="text-muted ml-auto">
                {learnieHealth.ok ? 'LIVE' : 'DOWN'}
              </span>
            </div>
            {projectStatuses.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${p.color}`} />
                <span>{p.name}</span>
                <span className="text-muted ml-auto">{p.status}</span>
              </div>
            ))}
          </div>

          {/* Infra */}
          <div className="border-t border-border pt-2 space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${healthStatus.isStale ? 'bg-amber-400' : 'bg-green-400'}`}
              />
              <span>Pi5 Infra</span>
              <span className="text-muted ml-auto">
                {healthStatus.isStale ? '⚠️ STALE' : healthStatus.summary}
              </span>
            </div>
          </div>
        </div>

        {/* Row 2, Col 1 — Money */}
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-3">
            💰 Money
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">MRR</span>
              <span className="font-mono">{financeMetrics.mrr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Burn</span>
              <span className="font-mono">{financeMetrics.burn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Budget left</span>
              <span className="font-mono">{financeMetrics.budgetLeft}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Runway</span>
              <span className="font-mono">{financeMetrics.runway}</span>
            </div>
          </div>
        </div>

        {/* Row 2, Col 2 — RADAR Trading */}
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-3">
            📈 RADAR Trading
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Phase</span>
              <span className="font-mono">Paper</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Capital</span>
              <span className="font-mono">$100K</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Trades</span>
              <span className="font-mono">{radarStatus.tradeCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Strategies</span>
              <span className="font-mono">3 scored</span>
            </div>
            <div className="text-[10px] text-muted mt-2">
              PEAD + Momentum + BTD · $0/mo data
            </div>
          </div>
        </div>

        {/* Row 2, Col 3 — Agents & Tooling */}
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-3">
            🤖 Agents & Tooling
          </div>
          {/* Agents */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span>felix</span>
            </div>
            {agents.map((a) => (
              <div key={a.name} className="flex items-center gap-1.5 text-xs">
                <span className={`w-2 h-2 rounded-full ${a.color}`} />
                <span>{a.name}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-2 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted">Connectors</span>
              <span className="font-mono">{toolingStatus.connectors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Skills</span>
              <span className="font-mono">{toolingStatus.skills}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Mode</span>
              <span className="font-mono">M2 Felix</span>
            </div>
          </div>
          <div className="text-[10px] text-muted mt-2">
            Last loop: {lastLoop.slice(11, 16) || lastLoop}
            {loopStale && <span className="text-amber-400 ml-1">⚠️ STALE</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
