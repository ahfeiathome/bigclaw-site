import { fetchPatrolReport, fetchAllIssues, fetchAllReleases, fetchHealth, fetchMichaelTodo, fetchBandwidth, fetchRecentCommits, fetchRadarDashboard, FORGE_REPOS, AXIOM_REPOS } from '@/lib/github';
import type { GitHubRelease, GitHubCommit } from '@/lib/github';
import { MetricCard, SignalPill, SectionCard, StatusDot, QuickActionsBar } from '@/components/dashboard';
import { ViewSource } from '@/components/view-source';
import { PageActions } from '@/components/page-actions';
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

  // Derive patrol status from System Health table
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

  // Agent status
  const agentTableRows = bandwidthMd ? parseMarkdownTable(extractSection(bandwidthMd, 'Current Agent Load')) : [];
  const activeAgents = agentTableRows.filter(r => r.cells[3]?.toLowerCase() === 'busy').length;
  const totalAgents = agentTableRows.length;

  // RADAR live status
  const hasLive = radarMeta['Phase']?.includes('Live') || false;

  return (
    <div>
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Mission Control</h1>
            <span className="text-xs text-muted-foreground font-mono mt-1">
              {patrolTimestamp ? `Last patrol: ${patrolTimestamp}` : `${new Date().toISOString().slice(0, 10)}`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <PageActions sourcePath="PATROL_REPORT.md" />
            <ViewSource repo="the-firm" path="PATROL_REPORT.md" />
            <SignalPill
              label={patrolStatus === 'HEALTHY' ? 'HEALTHY' : patrolStatus}
              tone={statusTone}
            />
          </div>
        </div>

        {/* Alert bar */}
        <div className="flex items-center gap-4 mb-4">
          {(forgeP0 > 0 || axiomP0 > 0) && (
            <span className="text-sm font-mono text-muted-foreground">
              {forgeP0 > 0 && <span className="text-red-400 font-bold mr-3">Forge P0: {forgeP0}</span>}
              {axiomP0 > 0 && <span className="text-red-400 font-bold mr-3">Axiom P0: {axiomP0}</span>}
            </span>
          )}
          {stopLossCount > 0 && <span className="text-sm font-bold text-red-400 font-mono">RADAR: {stopLossCount} alert{stopLossCount > 1 ? 's' : ''}</span>}
          {p0Count === 0 && stopLossCount === 0 && <span className="text-sm font-semibold text-green-400 font-mono">No blockers</span>}
        </div>
      </div>

      {/* ── ROW 1: KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <MetricCard
          label="Company Health"
          value={patrolStatus}
          semantic={patrolStatus === 'HEALTHY' ? 'success' : patrolStatus === 'CRITICAL' ? 'danger' : 'warning'}
        />
        <MetricCard
          label="RADAR Equity"
          value={radarEquityVal}
          subtitle={`P/L: ${radarPnlVal}`}
          semantic={radarPnlVal.includes('-') ? 'danger' : 'success'}
        />
        <MetricCard
          label="Open P0"
          value={String(p0Count)}
          semantic={p0Count > 0 ? 'danger' : 'success'}
        />
        <MetricCard
          label="Monthly Burn"
          value={burnRow?.cells[1]?.replace('(free tiers)', '').trim() || '~$5/mo'}
        />
        <MetricCard
          label="Agent Status"
          value={`${activeAgents}/${totalAgents || 6}`}
          subtitle={totalAgents > 0 ? `${activeAgents} active` : 'online'}
        />
      </div>

      {/* ── ROW 2: Command Center (ALL controls) ────────────────── */}
      <MissionCommandCenter radarReserve={radarReserve} hasLive={hasLive} />

      {/* ── ROW 3: Action Items ─────────────────────────────────── */}
      <ActionItems todoMd={todoMd} />

      {/* ── ROW 4: Company Overview ─────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Forge */}
        <Link href="/dashboard/forge" className="rounded-xl border border-green-500/30 bg-card p-5 no-underline hover:border-green-500/50 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-green-500 uppercase tracking-wide">Forge</span>
            <SignalPill label="AGENTS" tone="success" />
            <span className="text-xs text-muted-foreground ml-auto font-mono">{forgeIssues.length} issues</span>
          </div>
          <div className="flex gap-2 text-[10px]">
            {forgeP0 > 0 && <span className="font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">P0: {forgeP0}</span>}
            {forgeIssues.filter(i => i.labels.includes('P1')).length > 0 && <span className="font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">P1: {forgeIssues.filter(i => i.labels.includes('P1')).length}</span>}
          </div>
        </Link>

        {/* Axiom */}
        <Link href="/dashboard/axiom" className="rounded-xl border border-blue-500/30 bg-card p-5 no-underline hover:border-blue-500/50 transition-all">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-blue-500 uppercase tracking-wide">Axiom</span>
            <SignalPill label="CODE_ONLY" tone="info" />
            <span className="text-xs text-muted-foreground ml-auto font-mono">{axiomIssues.length} issues</span>
          </div>
          <div className="flex gap-2 text-[10px]">
            {axiomP0 > 0 && <span className="font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">P0: {axiomP0}</span>}
            {axiomIssues.filter(i => i.labels.includes('P1')).length > 0 && <span className="font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">P1: {axiomIssues.filter(i => i.labels.includes('P1')).length}</span>}
          </div>
        </Link>
      </div>

      {/* ── ROW 5: Activity Feed ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Recent Changes */}
        <SectionCard title={`Recent Changes (${recentCommits.length} in 24h)`}>
          {recentCommits.length > 0 ? (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {recentCommits.slice(0, 8).map((c: GitHubCommit) => (
                <div key={c.sha} className="text-[10px] border-l-2 border-border pl-2">
                  <span className="font-mono text-primary">{c.sha}</span>
                  <span className="text-muted-foreground ml-1">{c.repo}</span>
                  <p className="text-foreground/80 truncate">{c.message.slice(0, 60)}</p>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">No commits in the last 24h</span>
          )}
        </SectionCard>

        {/* Alerts */}
        <SectionCard title="Alerts">
          {!hasAlerts ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <StatusDot status="good" size="sm" />
              No alerts
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAlerts.map((row, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm border-l-2 border-red-200 pl-3 py-1">
                  <span className="text-foreground/80">{row.cells[1] || row.cells[0]}</span>
                  {row.cells[2] && <span className="text-muted-foreground text-xs">{row.cells[2]}</span>}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Felix Patrol status */}
      {content && (
        <div className="flex items-center gap-3 mb-4 animate-fade-in px-1">
          <StatusDot
            status={patrolStatus === 'HEALTHY' ? 'good' : patrolStatus.includes('CRITICAL') ? 'bad' : 'warn'}
            size="sm"
          />
          <span className="text-sm font-semibold text-foreground">Felix Patrol</span>
          <span className="text-xs text-muted-foreground font-mono">
            {patrolTimestamp || 'unknown'} · M3 · Daily Patrol
          </span>
        </div>
      )}

      {/* Recent Releases */}
      {allReleases.length > 0 && (
        <SectionCard title="Recent Releases" className="mb-6">
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {allReleases.slice(0, 5).map((rel: GitHubRelease) => (
              <a key={`${rel.repo}-${rel.tag}`} href={rel.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 rounded-lg p-2 hover:bg-muted transition-colors no-underline">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono text-muted-foreground">{rel.repo}</span>
                    <span className="text-xs font-mono font-bold text-primary">{rel.tag}</span>
                  </div>
                  <p className="text-sm text-foreground truncate">{rel.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(rel.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </a>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
