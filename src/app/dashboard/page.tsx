import { fetchPatrolReport, fetchProjects, fetchAllIssues, fetchAllReleases, fetchHealth, fetchMichaelTodo, fetchBandwidth, fetchRecentCommits, fetchRadarDashboard, FORGE_REPOS, AXIOM_REPOS } from '@/lib/github';
import type { GitHubRelease, GitHubCommit } from '@/lib/github';
import { MetricCard, SignalPill, SectionCard, StatusDot, QuickActionsBar } from '@/components/dashboard';
import { ViewSource } from '@/components/view-source';
import { PageActions } from '@/components/page-actions';
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

// ── Sponsor blockers from MICHAEL_TODO.md ───────────────────────────────────

interface SponsorItem { company: string; item: string; type: string; status: string }

function parseMichaelTodo(content: string | null): SponsorItem[] {
  if (!content) return [];
  const items: SponsorItem[] = [];
  for (const line of content.split('\n')) {
    if (!line.startsWith('|') || line.includes('Company') || line.match(/^\|[\s-|]+\|$/)) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 5 || cols[0] === '#') continue;
    const status = cols[4]?.toLowerCase() || '';
    if (status.includes('completed') || status.includes('done')) continue;
    items.push({ company: cols[1], item: cols[2], type: cols[3], status: cols[4] });
  }
  return items;
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardOverview() {
  const [content, projectsMd, allIssues, allReleases, healthMd, todoMd, bandwidthMd, recentCommits, radarMd] = await Promise.all([
    fetchPatrolReport(),
    fetchProjects(),
    fetchAllIssues(),
    fetchAllReleases(),
    fetchHealth(),
    fetchMichaelTodo(),
    fetchBandwidth(),
    fetchRecentCommits(24),
    fetchRadarDashboard(),
  ]);

  // Parse patrol report — section names match actual PATROL_REPORT.md format
  const financial = content ? parseMarkdownTable(extractSection(content, 'Financial Summary')) : [];
  const blocked = parseMichaelTodo(todoMd);

  // Derive patrol status from System Health table
  const healthRows = content ? parseMarkdownTable(extractSection(content, 'System Health')) : [];
  const hasCritical = healthRows.some(r => /CRITICAL|DOWN|FAIL/i.test(r.cells[1] || ''));
  const hasWarning = healthRows.some(r => /WARN|RECOVERING|DEGRADED/i.test(r.cells[1] || ''));

  // Alerts section (may not exist in current format — graceful fallback)
  const alertsRaw = content ? parseMarkdownTable(extractSection(content, 'Alerts')) : [];
  const personalKeywords = ['margin call', 'personal', 'j.p. morgan', 'chase', 'schwab'];
  const filteredAlerts = alertsRaw.filter(row => {
    const text = row.cells.join(' ').toLowerCase();
    return !personalKeywords.some(kw => text.includes(kw));
  });
  const hasAlerts = filteredAlerts.length > 0 && !(filteredAlerts.length === 1 && filteredAlerts[0].cells[0] === '\u2014');

  // Finance summary from patrol Financial Summary table
  const burnRow = financial.find(r => r.cells[0]?.toLowerCase().includes('burn'));

  // RADAR data from RADAR_DASHBOARD.md Performance Comparison table
  const radarPerf = radarMd ? parseMarkdownTable(extractSection(radarMd, 'Performance Comparison')) : [];
  const radarEquity = radarPerf.find(r => r.cells[0]?.toLowerCase().includes('current equity'));
  const radarPnl = radarPerf.find(r => r.cells[0]?.toLowerCase().includes('daily p/l'));
  const radarPositions = radarPerf.find(r => r.cells[0]?.toLowerCase().includes('positions'));

  // Infra summary — from System Health table (new format: Component | Status | Details)
  const macRow = healthRows.find(r => r.cells[0]?.toLowerCase().includes('mac'));
  const pi5Row = healthRows.find(r => r.cells[0]?.toLowerCase().includes('pi5') && !r.cells[0]?.toLowerCase().includes('disk') && !r.cells[0]?.toLowerCase().includes('cost'));
  const gitSyncRow = healthRows.find(r => r.cells[0]?.toLowerCase().includes('git sync'));

  // Issue counts — separated by company
  const forgeIssues = allIssues.filter(i => FORGE_REPOS.has(i.repo));
  const axiomIssues = allIssues.filter(i => AXIOM_REPOS.has(i.repo));
  const forgeP0 = forgeIssues.filter(i => i.labels.includes('P0')).length;
  const axiomP0 = axiomIssues.filter(i => i.labels.includes('P0')).length;
  const p0Count = allIssues.filter(i => i.labels.includes('P0')).length;
  const p1Count = allIssues.filter(i => i.labels.includes('P1')).length;
  const p2Count = allIssues.filter(i => i.labels.includes('P2')).length;

  // Stop-loss alerts
  const stopLossCount = filteredAlerts.filter(r => r.cells.join(' ').toLowerCase().includes('stop-loss')).length;

  // Patrol status — derived from System Health rows
  const patrolStatus = hasCritical ? 'CRITICAL' : hasWarning ? 'WARNING' : healthRows.length > 0 ? 'HEALTHY' : 'UNKNOWN';
  // Extract date from first heading: "# Patrol Report — 2026-04-04"
  const patrolDateMatch = content?.match(/# Patrol Report.*?(\d{4}-\d{2}-\d{2})/);
  const patrolTimestamp = patrolDateMatch ? patrolDateMatch[1] : null;
  const statusTone = patrolStatus === 'HEALTHY' ? 'success' as const
    : patrolStatus.includes('CRITICAL') ? 'error' as const
    : patrolStatus === 'UNKNOWN' ? 'neutral' as const
    : 'warning' as const;

  // Agent status from BANDWIDTH.md
  const agentTableRows = bandwidthMd ? parseMarkdownTable(extractSection(bandwidthMd, 'Current Agent Load')) : [];
  const activeAgents = agentTableRows.filter(r => r.cells[3]?.toLowerCase() === 'busy').length;
  const totalAgents = agentTableRows.length;
  const idleAgents = totalAgents - activeAgents;

  return (
    <div>
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">BigClaw AI</h1>
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

      {/* ── COMPANY CARDS (above the fold) ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Forge */}
        <div className="rounded-xl border border-green-500/30 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-green-500 uppercase tracking-wide">Forge</span>
            <SignalPill label="AGENTS" tone="success" />
            <span className="text-xs text-muted-foreground ml-auto font-mono">{forgeIssues.length} issues</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { name: 'GrovaKid', status: 'LIVE', url: 'https://learnie-ai-ten.vercel.app' },
              { name: 'BigClaw', status: 'LIVE', url: 'https://bigclaw-site.vercel.app' },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <StatusDot status={p.status === 'LIVE' ? 'good' : p.status === 'PAPER' ? 'warn' : 'neutral'} size="sm" />
                {p.url ? (
                  <a href={p.url} target={p.url.startsWith('/') ? undefined : '_blank'} rel={p.url.startsWith('/') ? undefined : 'noopener noreferrer'} className="text-foreground hover:text-primary no-underline">{p.name}</a>
                ) : (
                  <span className="text-foreground">{p.name}</span>
                )}
                <span className="text-muted-foreground font-mono text-[10px]">{p.status}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 text-[10px]">
            {forgeP0 > 0 && <span className="font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">P0: {forgeP0}</span>}
            {forgeIssues.filter(i => i.labels.includes('P1')).length > 0 && <span className="font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">P1: {forgeIssues.filter(i => i.labels.includes('P1')).length}</span>}
          </div>
        </div>

        {/* Axiom */}
        <div className="rounded-xl border border-blue-500/30 bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-blue-500 uppercase tracking-wide">Axiom</span>
            <SignalPill label="CODE_ONLY" tone="info" />
            <span className="text-xs text-muted-foreground ml-auto font-mono">{axiomIssues.length} issues</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { name: 'FairConnect', status: 'SETUP' },
              { name: 'KeepTrack', status: 'SETUP' },
              { name: 'SubCheck', status: 'SETUP' },
              { name: 'RADAR', status: 'PAPER', url: '/dashboard/radar' },
              { name: 'iris-studio', status: 'SPEC' },
              { name: 'fatfrogmodels', status: 'LIVE', url: 'https://fatfrogmodels.vercel.app' },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-2 text-xs">
                <StatusDot status="neutral" size="sm" />
                <span className="text-foreground">{p.name}</span>
                <span className="text-muted-foreground font-mono text-[10px]">{p.status}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 text-[10px]">
            {axiomP0 > 0 && <span className="font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">P0: {axiomP0}</span>}
            {axiomIssues.filter(i => i.labels.includes('P1')).length > 0 && <span className="font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">P1: {axiomIssues.filter(i => i.labels.includes('P1')).length}</span>}
          </div>
        </div>
      </div>

      {/* ── SUMMARY CARDS GRID ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {/* Finance */}
        <Link href="/dashboard/finance" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all no-underline group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Finance</span>
            <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">→ detail</span>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Burn:</span><span className="font-mono text-foreground text-right">{burnRow?.cells[1]?.replace('(free tiers)', '').trim() || '~$5/mo'}</span>
            <span className="text-muted-foreground">Budget:</span><span className="font-mono text-foreground text-right">96% free</span>
            <span className="text-muted-foreground">Free tiers:</span><span className="font-mono text-green-400 text-right">Safe</span>
            <span className="text-muted-foreground">Revenue:</span><span className="font-mono text-amber-400 text-right">$0</span>
          </div>
        </Link>

        {/* RADAR */}
        <Link href="/dashboard/radar" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all no-underline group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">RADAR</span>
            <div className="flex items-center gap-2">
              <SignalPill label="PAPER" tone="warning" />
              <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">→ detail</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Equity:</span><span className="font-mono text-foreground text-right">{radarEquity?.cells[1]?.trim() || '--'}</span>
            <span className="text-muted-foreground">Daily P/L:</span><span className={`font-mono text-right ${radarPnl?.cells[1]?.includes('-') ? 'text-red-400' : 'text-green-400'}`}>{radarPnl?.cells[1]?.trim() || '--'}</span>
            <span className="text-muted-foreground">Positions:</span><span className="font-mono text-foreground text-right">{radarPositions?.cells[1]?.trim() || '--'}</span>
          </div>
        </Link>

        {/* Infra */}
        <Link href="/dashboard/infra" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all no-underline group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Infrastructure</span>
            <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">→ detail</span>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Mac:</span><span className="font-mono text-green-400 text-right">{macRow?.cells[1]?.trim() || 'OK'}</span>
            <span className="text-muted-foreground">Pi5:</span><span className="font-mono text-green-400 text-right">{pi5Row?.cells[1]?.trim() || 'OK'}</span>
            <span className="text-muted-foreground">Git:</span><span className="font-mono text-green-400 text-right">{gitSyncRow?.cells[1]?.trim() || 'OK'}</span>
            <span className="text-muted-foreground">Agents:</span><span className="font-mono text-green-400 text-right">{totalAgents > 0 ? `${activeAgents}/${totalAgents} active` : '6/6 online'}</span>
          </div>
        </Link>

        {/* Open Issues / Blockers */}
        <Link href="https://github.com/users/ahfeiathome/projects/1" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all no-underline group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Blockers &amp; Issues</span>
            <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">Board →</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold font-mono text-foreground">{allIssues.length}</span>
            <span className="text-xs text-muted-foreground">across {new Set(allIssues.map(i => i.repo)).size} repos</span>
          </div>
          <div className="flex gap-2 mt-2">
            {p0Count > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">P0: {p0Count}</span>}
            {p1Count > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">P1: {p1Count}</span>}
            {p2Count > 0 && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">P2: {p2Count}</span>}
          </div>
        </Link>

        {/* Agent Status */}
        <Link href="/dashboard/departments/operations" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all no-underline group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Agent Status</span>
            <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">→ detail</span>
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl font-bold font-mono text-foreground">{totalAgents}</span>
            <span className="text-xs text-muted-foreground">agents</span>
          </div>
          <div className="grid grid-cols-2 gap-y-1.5 text-sm">
            <span className="text-muted-foreground">Active:</span><span className="font-mono text-green-400 text-right">{activeAgents}</span>
            <span className="text-muted-foreground">Idle:</span><span className="font-mono text-foreground text-right">{idleAgents}</span>
          </div>
          {agentTableRows.length > 0 && (
            <div className="mt-2 space-y-1">
              {agentTableRows.slice(0, 4).map((row, i) => (
                <div key={i} className="flex items-center gap-2 text-[10px]">
                  <StatusDot status={row.cells[3]?.toLowerCase() === 'busy' ? 'good' : 'neutral'} size="sm" />
                  <span className="text-foreground">{row.cells[0]}</span>
                  <span className="text-muted-foreground ml-auto">{row.cells[1]}</span>
                </div>
              ))}
            </div>
          )}
        </Link>

        {/* Recent Changes */}
        <Link href="/dashboard/forge" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all no-underline group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Changes (24h)</span>
            <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">→ detail</span>
          </div>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-2xl font-bold font-mono text-foreground">{recentCommits.length}</span>
            <span className="text-xs text-muted-foreground">commits</span>
          </div>
          {recentCommits.length > 0 ? (
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {recentCommits.slice(0, 5).map((c: GitHubCommit) => (
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
        </Link>
      </div>

      {/* ── ALERTS + NEEDS SPONSOR ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

        <SectionCard title="Needs Michael">
          {blocked.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <StatusDot status="good" size="sm" />
              Nothing blocked
            </div>
          ) : (
            <div className="space-y-2.5">
              {blocked.slice(0, 5).map((item, i) => (
                <div key={i} className="border-l-2 border-amber-200 pl-3 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground/80 font-medium">{item.item.slice(0, 60)}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono ml-auto">{item.type}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    <span>{item.company}</span>
                    <span>· {item.status}</span>
                  </div>
                </div>
              ))}
              {blocked.length > 5 && (
                <Link href="/dashboard/sponsor/todo" className="block text-xs text-primary no-underline hover:underline pt-1">
                  View all {blocked.length} items →
                </Link>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── FELIX PATROL STATUS LINE ────────────────────────────── */}
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

      {/* Quick Actions */}
      <QuickActionsBar />

      {/* ── RECENT RELEASES ─────────────────────────────────────── */}
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
