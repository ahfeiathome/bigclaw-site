export const dynamic = 'force-dynamic';

import { fetchAgentSystem, fetchRepoFile, fetchBandwidth, fetchDailyCosts } from '@/lib/github';
import { SectionCard } from '@/components/dashboard';
import { CronHealthLights } from '@/components/cron-health-lights';
import { CostTrendChart } from '@/components/cost-trend-chart';

function parseMarkdownTable(section: string): { cells: string[] }[] {
  const lines = section.split('\n').filter(
    l => l.includes('|') && !l.match(/^\|[\s-|]+\|$/)
  );
  if (lines.length <= 1) return [];
  return lines.slice(1).map(line => ({
    cells: line.split('|').map(c => c.trim()).filter(Boolean),
  }));
}

function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`^## ${heading}\\s*$`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^## /)) { end = i; break; }
  }
  return lines.slice(0, end).join('\n');
}

export default async function OpsPage() {
  const [agentMd, bandwidthMd, dailyCostsMd, activeSessionsMd, sanityCheckMd, overnightMd] = await Promise.all([
    fetchAgentSystem(),
    fetchBandwidth(),
    fetchDailyCosts(),
    fetchRepoFile('bigclaw-ai', 'ops/ACTIVE_SESSIONS.md'),
    fetchRepoFile('bigclaw-ai', 'ops/SANITY_CHECK.md'),
    fetchRepoFile('bigclaw-ai', 'ops/OVERNIGHT_REPORT.md'),
  ]);

  // Sessions
  const sessionLines = activeSessionsMd
    ? activeSessionsMd.split('\n').filter(l => l.trim() && !l.startsWith('#') && l.includes('|'))
    : [];

  // Agent loads
  const agentRows = bandwidthMd
    ? parseMarkdownTable(extractSection(bandwidthMd, 'Current Agent Load'))
    : [];
  const activeAgents = agentRows.filter(r => r.cells[3]?.toLowerCase() === 'busy').length;

  // Costs for chart
  const costData: { date: string; spend: number }[] = [];
  if (dailyCostsMd) {
    for (const line of dailyCostsMd.split('\n')) {
      if (!line.startsWith('|') || line.match(/^\|[\s-:|]+\|$/) || line.includes('Date')) continue;
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      const dateMatch = cells[0]?.match(/\d{4}-\d{2}-\d{2}/);
      const spendMatch = cells[2]?.match(/\$?([\d.]+)/);
      if (dateMatch && spendMatch) costData.push({ date: dateMatch[0], spend: parseFloat(spendMatch[1]) });
    }
  }
  // Last entry for summary
  const lastCost = costData.length > 0 ? costData[costData.length - 1] : null;

  // Sanity check
  let sanityStatus = '';
  let sanityDate = '';
  let sanityDetails: string[] = [];
  if (sanityCheckMd) {
    const dateMatch = sanityCheckMd.match(/Nightly Sanity Check — ([^\n]+)/);
    const resultMatch = sanityCheckMd.match(/\*\*Status:\*\*\s*([^\n|]+)/);
    sanityDate = dateMatch?.[1]?.trim() || '';
    sanityStatus = resultMatch?.[1]?.trim() || '';
    sanityDetails = sanityCheckMd.split('\n')
      .filter(l => l.startsWith('- ') || l.startsWith('✅') || l.startsWith('❌'))
      .slice(0, 8);
  }

  const now = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles'
  });

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Ops</h1>
      <p className="text-xs text-muted-foreground mb-6">
        System monitoring — crons, agents, sessions, nightly reports
        <span className="ml-2 opacity-50 font-mono">· {now} PT</span>
      </p>

      {/* ── Active Sessions ─────────────────────────────── */}
      <SectionCard title="Active Sessions" className="mb-4">
        {sessionLines.length === 0 ? (
          <p className="text-xs text-muted-foreground">No active sessions</p>
        ) : (
          <div className="space-y-1">
            {sessionLines.map((line, i) => {
              const parts = line.split('|').map(s => s.trim()).filter(Boolean);
              return (
                <div key={i} className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                  <span className="text-foreground">{parts[1] || parts[0]}</span>
                  <span className="text-muted-foreground">{parts[2]}</span>
                  <span className="text-muted-foreground ml-auto">{parts[3]}</span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      {/* ── Cron Jobs ───────────────────────────────────── */}
      <SectionCard title="Cron Jobs" className="mb-4">
        <CronHealthLights agentMd={agentMd} />
        {!agentMd && (
          <p className="text-xs text-muted-foreground">
            Agent system file not found at <code>the-firm/docs/operations/PI5_AGENT_SYSTEM.md</code>
          </p>
        )}
      </SectionCard>

      {/* ── Agent Load ──────────────────────────────────── */}
      {agentRows.length > 0 && (
        <SectionCard title={`Agent Load (${activeAgents} active)`} className="mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left py-1.5 pr-3">Agent</th>
                  <th className="text-left py-1.5 px-2">Task</th>
                  <th className="text-right py-1.5 pl-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {agentRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/30">
                    <td className="py-1 pr-3 font-mono text-foreground">{row.cells[0]}</td>
                    <td className="py-1 px-2 text-muted-foreground">{row.cells[2]}</td>
                    <td className="py-1 pl-2 text-right">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        row.cells[3]?.toLowerCase() === 'busy'
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>{row.cells[3]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── Daily Spend ─────────────────────────────────── */}
      <SectionCard title="Daily Spend" className="mb-4">
        {lastCost && (
          <div className="flex items-center gap-3 mb-3 text-xs text-muted-foreground">
            <span className="font-mono text-foreground text-sm font-semibold">${lastCost.spend.toFixed(2)}</span>
            <span>last entry</span>
            <span className="font-mono">{lastCost.date}</span>
          </div>
        )}
        {costData.length > 0
          ? <CostTrendChart data={costData} />
          : <p className="text-xs text-muted-foreground">No cost data — DAILY_COSTS.md may not be committed to remote</p>
        }
      </SectionCard>

      {/* ── Nightly Sanity Check ────────────────────────── */}
      <SectionCard title="Nightly Sanity Check" className="mb-4">
        {!sanityCheckMd ? (
          <p className="text-xs text-muted-foreground">Not yet available</p>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-3">
              <span className={`text-sm font-semibold ${sanityStatus.toLowerCase().includes('pass') ? 'text-green-400' : 'text-red-400'}`}>
                {sanityStatus}
              </span>
              {sanityDate && <span className="text-xs text-muted-foreground font-mono">{sanityDate}</span>}
            </div>
            {sanityDetails.length > 0 && (
              <div className="space-y-0.5">
                {sanityDetails.map((line, i) => (
                  <div key={i} className="text-xs font-mono text-muted-foreground">{line}</div>
                ))}
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* ── Overnight Report ────────────────────────────── */}
      {overnightMd && (
        <SectionCard title="Last Overnight Report" className="mb-4">
          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
            {overnightMd.slice(0, 2000)}{overnightMd.length > 2000 ? '\n… (truncated)' : ''}
          </pre>
        </SectionCard>
      )}
    </div>
  );
}
