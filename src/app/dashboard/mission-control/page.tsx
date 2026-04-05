import { fetchPatrolReport, fetchAllIssues, fetchAllReleases, fetchHealth, fetchMichaelTodo, fetchBandwidth, fetchRecentCommits, fetchRadarDashboard, FORGE_REPOS, AXIOM_REPOS } from '@/lib/github';
import type { GitHubRelease, GitHubCommit } from '@/lib/github';
import { SignalPill, SectionCard, StatusDot } from '@/components/dashboard';
import { ViewSource } from '@/components/view-source';
import { PageActions } from '@/components/page-actions';
import { KpiCard } from '@/components/kpi-card';
import { MissionCommandCenter } from '@/components/mission-command-center';
import { ActionItems } from '@/components/action-items';
import Link from 'next/link';

// ── Shared helpers ──────────────────────────────────────────────────────────

interface TableRow { cells: string[] }

function parseMarkdownTable(section: string): TableRow[] {
  const lines = section.split('\n').filter(
    (l) => l.includes('|') && !l.match(/^\|[\s-|]+\|$/)
  );
  if (lines.length <= 1) return [];
  return lines.slice(1).map((line) => ({
    cells: line.split('|').map((c) => c.trim()).filter(Boolean),
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

// ── Page ────────────────────────────────────────────────────────────────────

export default async function MissionControlPage() {
  const [content, allIssues, allReleases, healthMd, todoMd, bandwidthMd, recentCommits, radarMd] = await Promise.all([
    fetchPatrolReport(),
    fetchAllIssues(),
    fetchAllReleases(),
    fetchHealth(),
    fetchMichaelTodo(),
    fetchBandwidth(),
    fetchRecentCommits(24),
    fetchRadarDashboard(),
  ]);

  // Parse patrol report
  const financial = content ? parseMarkdownTable(extractSection(content, 'Financial Summary')) : [];
  const healthRows = content ? parseMarkdownTable(extractSection(content, 'System Health')) : [];
  const hasCritical = healthRows.some(r => /CRITICAL|DOWN|FAIL/i.test(r.cells[1] || ''));
  const hasWarning = healthRows.some(r => /WARN|RECOVERING|DEGRADED/i.test(r.cells[1] || ''));

  // Alerts
  const alertsRaw = content ? parseMarkdownTable(extractSection(content, 'Alerts')) : [];
  const personalKeywords = ['margin call', 'personal', 'j.p. morgan', 'chase', 'schwab'];
  const filteredAlerts = alertsRaw.filter(row => {
    const text = row.cells.join(' ').toLowerCase();
    return !personalKeywords.some(kw => text.includes(kw));
  });
  const hasAlerts = filteredAlerts.length > 0 && !(filteredAlerts.length === 1 && filteredAlerts[0].cells[0] === '\u2014');

  // Finance
  const burnRow = financial.find(r => r.cells[0]?.toLowerCase().includes('burn'));
  const burnVal = burnRow?.cells[1]?.replace('(free tiers)', '').trim() || '~$5/mo';

  // RADAR data
  const radarSummary = radarMd ? parseMarkdownTable(extractSection(radarMd, 'Portfolio Summary')) : [];
  const radarMeta: Record<string, string> = {};
  for (const row of radarSummary) {
    if (row.cells.length >= 2) radarMeta[row.cells[0]] = row.cells[1];
  }
  const radarEquityVal = radarMeta['Equity'] || '--';
  const radarPnlVal = radarMeta['Daily P/L'] || '--';
  const radarReserveStr = radarMeta['Reserve'] || '';
  const radarReserve = radarReserveStr ? parseFloat(radarReserveStr.replace('%', '')) : undefined;

  // Parse equity history for sparkline
  const equitySection = radarMd ? extractSection(radarMd, 'Equity History') : '';
  const equityRows = parseMarkdownTable(equitySection);
  const equitySparkData = equityRows.slice(-7).map(r => parseFloat(r.cells[1]?.replace(/[$,]/g, '') || '0')).filter(v => v > 0);

  // Issue counts
  const forgeIssues = allIssues.filter(i => FORGE_REPOS.has(i.repo));
  const axiomIssues = allIssues.filter(i => AXIOM_REPOS.has(i.repo));
  const forgeP0 = forgeIssues.filter(i => i.labels.includes('P0')).length;
  const axiomP0 = axiomIssues.filter(i => i.labels.includes('P0')).length;
  const p0Count = allIssues.filter(i => i.labels.includes('P0')).length;
  const stopLossCount = filteredAlerts.filter(r => r.cells.join(' ').toLowerCase().includes('stop-loss')).length;

  // Patrol status
  const patrolStatus = hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : healthRows.length > 0 ? 'HEALTHY' : 'UNKNOWN';
  const patrolDateMatch = content?.match(/# Patrol Report.*?(\d{4}-\d{2}-\d{2})/);
  const patrolTimestamp = patrolDateMatch ? patrolDateMatch[1] : null;
  const statusTone = patrolStatus === 'HEALTHY' ? 'success' as const
    : patrolStatus.includes('CRITICAL') ? 'error' as const
    : patrolStatus === 'UNKNOWN' ? 'neutral' as const
    : 'warning' as const;

  // Health score (0-100)
  const totalHealth = healthRows.length;
  const okHealth = healthRows.filter(r => /OK|RUNNING|ONLINE/i.test(r.cells[1] || '')).length;
  const healthScore = totalHealth > 0 ? Math.round((okHealth / totalHealth) * 100) : 0;
  const healthSemantic = healthScore >= 80 ? 'success' as const : healthScore >= 60 ? 'warning' as const : 'danger' as const;

  // Agent status
  const agentTableRows = bandwidthMd ? parseMarkdownTable(extractSection(bandwidthMd, 'Current Agent Load')) : [];
  const activeAgents = agentTableRows.filter(r => r.cells[3]?.toLowerCase() === 'busy').length;
  const totalAgents = agentTableRows.length || 6;
  const agentSemantic = activeAgents === 0 ? 'danger' as const : activeAgents < totalAgents ? 'warning' as const : 'success' as const;

  // P0 semantic
  const p0Semantic = p0Count === 0 ? 'success' as const : p0Count <= 3 ? 'warning' as const : 'danger' as const;

  // Burn semantic
  const burnFloat = parseFloat(burnVal.replace(/[^0-9.]/g, '')) || 0;
  const burnSemantic = burnFloat < 5 ? 'success' as const : burnFloat < 15 ? 'warning' as const : 'danger' as const;

  // RADAR live status
  const hasLive = radarMeta['Phase']?.includes('Live') || false;
  const radarSemantic = radarPnlVal.includes('-') ? 'danger' as const : 'success' as const;

  return (
    <div>
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="mb-4 animate-fade-in">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Mission Control</h1>
            <span className="text-[10px] text-muted-foreground font-mono">
              {patrolTimestamp || new Date().toISOString().slice(0, 10)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <PageActions sourcePath="PATROL_REPORT.md" />
            <ViewSource repo="the-firm" path="PATROL_REPORT.md" />
            <SignalPill label={patrolStatus} tone={statusTone} />
          </div>
        </div>
        {/* Alert bar — only when active */}
        {(forgeP0 > 0 || axiomP0 > 0 || stopLossCount > 0) && (
          <div className="flex items-center gap-3 text-xs font-mono">
            {forgeP0 > 0 && <span className="text-red-400 font-bold">Forge P0: {forgeP0}</span>}
            {axiomP0 > 0 && <span className="text-red-400 font-bold">Axiom P0: {axiomP0}</span>}
            {stopLossCount > 0 && <span className="text-red-400 font-bold">RADAR: {stopLossCount} alert{stopLossCount > 1 ? 's' : ''}</span>}
          </div>
        )}
      </div>

      {/* ── ROW 1: KPI Cards (6 compact, Moomoo-style) ──────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <KpiCard
          label="Company Health"
          value={`${healthScore}`}
          semantic={healthSemantic}
          delta={healthScore >= 80 ? '▲ Healthy' : healthScore >= 60 ? '— Warning' : '▼ Critical'}
          sparkData={[70, 75, 80, healthScore, healthScore, healthScore, healthScore]}
          subtitle="/100"
        />
        <KpiCard
          label="RADAR Equity"
          value={radarEquityVal}
          semantic={radarSemantic}
          delta={`P/L: ${radarPnlVal}`}
          sparkData={equitySparkData.length >= 2 ? equitySparkData : undefined}
        />
        <KpiCard
          label="Open P0s"
          value={String(p0Count)}
          semantic={p0Semantic}
          delta={p0Count === 0 ? '▲ Clear' : `${p0Count} blocking`}
        />
        <KpiCard
          label="Monthly Burn"
          value={burnVal}
          semantic={burnSemantic}
          delta={burnFloat < 5 ? '▲ Under budget' : undefined}
        />
        <KpiCard
          label="Revenue"
          value="$0"
          semantic="warning"
          delta="Pre-revenue"
          subtitle="Phase 0"
        />
        <KpiCard
          label="Agents"
          value={`${activeAgents}/${totalAgents}`}
          semantic={agentSemantic}
          delta={`${activeAgents} active`}
        />
      </div>

      {/* ── ROW 2: Action Items (info first — ABOVE controls) ────── */}
      <ActionItems todoMd={todoMd} />

      {/* ── ROW 3: Company Overview (compact) ───────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <Link href="/dashboard/forge" className="rounded-lg border border-green-500/20 bg-card p-3 no-underline hover:border-green-500/40 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-green-500 uppercase">Forge</span>
            <span className="text-[10px] text-muted-foreground font-mono ml-auto">{forgeIssues.length} issues</span>
          </div>
          <div className="flex gap-2 text-[10px]">
            {forgeP0 > 0 && <span className="font-bold px-1 py-0.5 rounded bg-red-500/20 text-red-400">P0: {forgeP0}</span>}
            {forgeIssues.filter(i => i.labels.includes('P1')).length > 0 && <span className="font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-400">P1: {forgeIssues.filter(i => i.labels.includes('P1')).length}</span>}
            {forgeP0 === 0 && <span className="text-green-400">No blockers</span>}
          </div>
        </Link>
        <Link href="/dashboard/axiom" className="rounded-lg border border-blue-500/20 bg-card p-3 no-underline hover:border-blue-500/40 transition-all">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-500 uppercase">Axiom</span>
            <span className="text-[10px] text-muted-foreground font-mono ml-auto">{axiomIssues.length} issues</span>
          </div>
          <div className="flex gap-2 text-[10px]">
            {axiomP0 > 0 && <span className="font-bold px-1 py-0.5 rounded bg-red-500/20 text-red-400">P0: {axiomP0}</span>}
            {axiomIssues.filter(i => i.labels.includes('P1')).length > 0 && <span className="font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-400">P1: {axiomIssues.filter(i => i.labels.includes('P1')).length}</span>}
            {axiomP0 === 0 && <span className="text-green-400">No blockers</span>}
          </div>
        </Link>
      </div>

      {/* ── ROW 4: Activity Feed (compact) ──────────────────────── */}
      {/* Alerts banner — only when active */}
      {hasAlerts && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 mb-3">
          <div className="flex items-center gap-2 mb-1">
            <StatusDot status="bad" size="sm" />
            <span className="text-xs font-semibold text-red-400 uppercase">Alerts</span>
          </div>
          <div className="space-y-1">
            {filteredAlerts.slice(0, 3).map((row, i) => (
              <div key={i} className="text-xs text-foreground/80 font-mono">{row.cells[1] || row.cells[0]}</div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Recent commits — compact */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Commits (24h): {recentCommits.length}</div>
          {recentCommits.length > 0 ? (
            <div className="space-y-1 max-h-28 overflow-y-auto">
              {recentCommits.slice(0, 6).map((c: GitHubCommit) => (
                <div key={c.sha} className="text-[10px] font-mono truncate">
                  <span className="text-primary">{c.sha}</span>
                  <span className="text-muted-foreground ml-1">{c.repo}</span>
                  <span className="text-foreground/70 ml-1">{c.message.slice(0, 50)}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground">No commits</span>
          )}
        </div>

        {/* Felix Patrol + Releases */}
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Patrol & Releases</div>
          {content && (
            <div className="flex items-center gap-2 text-[10px] mb-2">
              <StatusDot status={patrolStatus === 'HEALTHY' ? 'good' : patrolStatus.includes('CRITICAL') ? 'bad' : 'warn'} size="sm" />
              <span className="font-mono text-foreground">Felix: {patrolTimestamp || 'unknown'}</span>
            </div>
          )}
          {allReleases.length > 0 && (
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {allReleases.slice(0, 3).map((rel: GitHubRelease) => (
                <a key={`${rel.repo}-${rel.tag}`} href={rel.url} target="_blank" rel="noopener noreferrer" className="block text-[10px] font-mono truncate no-underline hover:text-primary text-muted-foreground">
                  {rel.repo} {rel.tag}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 5: Command Center (COLLAPSED by default) ────────── */}
      <MissionCommandCenter radarReserve={radarReserve} hasLive={hasLive} defaultCollapsed={true} />
    </div>
  );
}
