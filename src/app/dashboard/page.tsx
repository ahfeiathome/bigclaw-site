import { fetchPatrolReport, fetchProjects, fetchAllIssues, fetchAllReleases, fetchRecentClosedIssues, fetchHealth } from '@/lib/github';
import type { GitHubIssue, GitHubRelease } from '@/lib/github';
import { MetricCard, HealthRow, SignalPill, SectionCard, StatusDot, QuickActionsBar, AgentStatusPanel, TaskFlowWidget, EventStreamWidget, SecurityPostureBadge } from '@/components/dashboard';
import { CollapsibleSection } from '@/components/collapsible-section';
import Link from 'next/link';

interface TableRow {
  cells: string[];
}

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

function extractMeta(content: string): Record<string, string> {
  const rows = parseMarkdownTable(extractSection(content, 'Meta'));
  const meta: Record<string, string> = {};
  for (const row of rows) {
    if (row.cells.length >= 2) meta[row.cells[0]] = row.cells[1];
  }
  return meta;
}

function getStatusTone(value: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const isGood = value.includes('OK') || value.includes('HEALTHY') || value.includes('active') || value.includes('green') || value.includes('LIVE') || value.includes('UP');
  const isWarn = value.includes('STALE') || value.includes('Blocked') || value.includes('QUEUE') || value.includes('WARN');
  const isBad = value.includes('DOWN') || value.includes('FAIL') || value.includes('CRITICAL');
  if (isBad) return 'error';
  if (isWarn) return 'warning';
  if (isGood) return 'success';
  return 'neutral';
}

function getHealthStatus(value: string): 'good' | 'warn' | 'bad' {
  if (value.includes('DOWN') || value.includes('FAIL') || value.includes('CRITICAL')) return 'bad';
  if (value.includes('STALE') || value.includes('WARN') || value.includes('Blocked')) return 'warn';
  return 'good';
}

const PDLC_STAGES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];
const PDLC_LABELS: Record<string, string> = {
  S1: 'DISCOVER', S2: 'DEFINE', S3: 'DECIDE', S4: 'BUILD',
  S5: 'HARDEN', S6: 'PILOT', S7: 'LAUNCH', S8: 'GROW',
};

function parsePdlcStage(raw: string): { current: string; label: string } {
  const match = raw.match(/S(\d)/);
  if (!match) return { current: 'S1', label: raw };
  const stage = `S${match[1]}`;
  return { current: stage, label: PDLC_LABELS[stage] || raw };
}

interface PdlcProject {
  codename: string;
  publicName: string;
  pdlcStage: string;
  status: string;
  revenue: string;
  notes: string;
}

function parsePdlcProjects(content: string): PdlcProject[] {
  const projects: PdlcProject[] = [];
  const seen = new Set<string>();
  const sections = ['Active', 'FOUNDRY \u2014 App Factory', 'Autonomous', 'Pipeline'];
  for (const section of sections) {
    const regex = new RegExp(`## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n`, 'm');
    const match = content.search(regex);
    if (match === -1) continue;
    const rest = content.slice(match);
    const lines = rest.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^## /) || line.match(/^---\s*$/)) break;
      if (!line.startsWith('|') || line.includes('Codename') || line.match(/^\|[\s-|]+\|$/)) continue;
      if (line.startsWith('| \u2014') || line.startsWith('|---')) continue;
      const cols = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length < 6) continue;
      const codename = cols[0].replace(/\*\*/g, '');
      const pdlcRaw = cols[3] || '';
      if (pdlcRaw.includes('ARCHIVED') || pdlcRaw === '\u2014') continue;
      if (seen.has(codename)) continue;
      seen.add(codename);
      const isPipeline = section === 'Pipeline';
      const statusIdx = isPipeline ? 5 : 4;
      const revenueIdx = isPipeline ? 7 : 6;
      const notesIdx = isPipeline ? 8 : 7;
      projects.push({
        codename,
        publicName: cols[1],
        pdlcStage: pdlcRaw,
        status: cols[statusIdx] || '',
        revenue: cols[revenueIdx] || '',
        notes: cols[notesIdx] || '',
      });
    }
  }
  return projects;
}

function PdlcCard({ project }: { project: PdlcProject }) {
  const { current } = parsePdlcStage(project.pdlcStage);
  const currentIdx = PDLC_STAGES.indexOf(current);

  const stageColors = (stage: string, idx: number) => {
    if (idx < currentIdx) return 'bg-green-500';
    if (idx === currentIdx) return 'bg-blue-500 ring-2 ring-blue-500/30';
    return 'bg-muted';
  };

  const statusTone =
    project.status.includes('PRIORITY') || project.status.includes('Active') || project.status.includes('active')
      ? 'info' as const
      : project.status.includes('live') || project.status.includes('LIVE') || project.status.includes('Live')
      ? 'success' as const
      : project.status.includes('Paper') || project.status.includes('paper')
      ? 'warning' as const
      : 'neutral' as const;

  return (
    <div className="animate-fade-in border border-border rounded-2xl p-4 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex items-center gap-2 mb-2">
        <SignalPill label={project.status.replace(/\*\*/g, '').slice(0, 20)} tone={statusTone} />
        <span className="text-sm font-semibold text-foreground">{project.codename}</span>
        <span className="text-xs text-muted-foreground ml-auto font-mono">{project.publicName}</span>
      </div>
      <div className="flex gap-0.5 mb-2">
        {PDLC_STAGES.map((stage, idx) => (
          <div key={stage} className="flex-1 flex flex-col items-center" title={`${stage}: ${PDLC_LABELS[stage]}`}>
            <div className={`w-full h-2 rounded-full ${stageColors(stage, idx)}`} />
            <span className={`text-[9px] mt-0.5 leading-tight text-center ${idx === currentIdx ? 'text-blue-600 font-bold' : idx < currentIdx ? 'text-green-600/70' : 'text-muted-foreground/50'}`}>
              {PDLC_LABELS[stage] || stage}
            </span>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground truncate font-mono">{PDLC_LABELS[current] || current} -- {project.status.replace(/\*\*/g, '').slice(0, 60)}</div>
      {project.revenue && project.revenue !== '\u2014' && project.revenue !== 'Internal' && (
        <div className="text-xs text-green-600 mt-0.5 font-mono">{project.revenue}</div>
      )}
    </div>
  );
}

function buildExecSummary(
  meta: Record<string, string>,
  alerts: TableRow[],
  velocity: TableRow[],
  blocked: TableRow[],
  pdlcProjects: PdlcProject[],
): string[] {
  const lines: string[] = [];
  const status = meta['Status'] || 'UNKNOWN';
  if (status === 'HEALTHY') {
    lines.push('All systems operational. No critical issues detected this patrol cycle.');
  } else if (status.includes('WARN')) {
    lines.push(`System health degraded -- ${status}. Review alerts below.`);
  } else if (status.includes('CRITICAL')) {
    lines.push(`Critical issues detected -- ${status}. Immediate attention required.`);
  }
  if (pdlcProjects.length > 0) {
    const liveCount = pdlcProjects.filter(p => p.pdlcStage.includes('S7') || p.pdlcStage.includes('S8')).length;
    const buildCount = pdlcProjects.filter(p => p.pdlcStage.includes('S4') || p.pdlcStage.includes('S5')).length;
    const parts = [];
    if (liveCount > 0) parts.push(`${liveCount} live`);
    if (buildCount > 0) parts.push(`${buildCount} in build/harden`);
    lines.push(`${pdlcProjects.length} projects: ${parts.join(', ')}.`);
  }
  const commitsRow = velocity.find(r => r.cells[0]?.toLowerCase().includes('commit'));
  if (commitsRow) lines.push(`Git velocity: ${commitsRow.cells[1]} commits in the last 24h.`);
  const hasAlerts = alerts.length > 0 && !(alerts.length === 1 && alerts[0].cells[0] === '\u2014');
  if (hasAlerts) lines.push(`${alerts.length} alert(s) flagged.`);
  else if (blocked.length > 0) lines.push(`${blocked.length} item(s) blocked on sponsor.`);
  else lines.push('No alerts or blockers. Clear runway.');
  return lines;
}

export default async function DashboardOverview() {
  const [content, projectsMd, allIssues, allReleases, closedIssues, healthMd] = await Promise.all([
    fetchPatrolReport(),
    fetchProjects(),
    fetchAllIssues(),
    fetchAllReleases(),
    fetchRecentClosedIssues(7),
    fetchHealth(),
  ]);
  const pdlcProjects = projectsMd ? parsePdlcProjects(projectsMd) : [];

  if (!content) {
    return (
      <div className="text-center py-20 text-muted-foreground animate-fade-in">
        <div className="text-3xl font-mono mb-2">--</div>
        <div>No patrol report yet.</div>
        <div className="text-xs mt-1">Felix will generate one on next heartbeat.</div>
      </div>
    );
  }

  const meta = extractMeta(content);
  const financial = parseMarkdownTable(extractSection(content, 'Financial'));
  const infra = parseMarkdownTable(extractSection(content, 'Infrastructure'));
  const tooling = parseMarkdownTable(extractSection(content, 'Tooling'));
  const velocity = parseMarkdownTable(extractSection(content, 'Velocity'));
  const alerts = parseMarkdownTable(extractSection(content, 'Alerts'));
  const actions = parseMarkdownTable(extractSection(content, 'Actions'));
  const blocked = parseMarkdownTable(extractSection(content, 'Blocked on Sponsor'));

  // Filter out personal finance alerts that shouldn't appear on company dashboard
  const personalKeywords = ['margin call', 'personal', 'j.p. morgan', 'chase', 'schwab'];
  const filteredAlerts = alerts.filter(row => {
    const text = row.cells.join(' ').toLowerCase();
    return !personalKeywords.some(kw => text.includes(kw));
  });

  const execLines = buildExecSummary(meta, filteredAlerts, velocity, blocked, pdlcProjects);

  const hasAlerts = filteredAlerts.length > 0 && !(filteredAlerts.length === 1 && filteredAlerts[0].cells[0] === '\u2014');

  const burnRow = financial.find(r => r.cells[0]?.toLowerCase().includes('burn') || r.cells[0]?.toLowerCase().includes('cost'));
  const freeRow = financial.find(r => r.cells[0]?.toLowerCase().includes('free'));

  function parseBarPercent(value: string): number | undefined {
    const match = value.match(/([\d.]+)\s*%/);
    if (match) return parseFloat(match[1]);
    return undefined;
  }

  // Filter tab counts
  const liveCount = pdlcProjects.filter(p => p.pdlcStage.includes('S7') || p.pdlcStage.includes('S8')).length;
  const buildCount = pdlcProjects.filter(p => p.pdlcStage.includes('S4') || p.pdlcStage.includes('S5') || p.pdlcStage.includes('S6')).length;
  const earlyCount = pdlcProjects.filter(p => p.pdlcStage.includes('S1') || p.pdlcStage.includes('S2') || p.pdlcStage.includes('S3')).length;

  // Extract RADAR metrics from patrol report Financial section
  const radarEquityRow = financial.find(r => r.cells[0]?.toLowerCase().includes('radar equity'));
  const radarPnlRow = financial.find(r => r.cells[0]?.toLowerCase().includes('radar') && r.cells[0]?.toLowerCase().includes('p/l'));
  const openRouterRow = financial.find(r => r.cells[0]?.toLowerCase().includes('openrouter'));

  // Extract infra metrics
  const macDisk = infra.find(r => r.cells[0]?.toLowerCase().includes('mac disk'));
  const pi5Uptime = infra.find(r => r.cells[0]?.toLowerCase().includes('pi5 uptime'));
  const gitSync = infra.find(r => r.cells[0]?.toLowerCase().includes('git sync'));

  // Issue counts
  const p0Count = allIssues.filter(i => i.labels.includes('P0')).length;
  const p1Count = allIssues.filter(i => i.labels.includes('P1')).length;
  const p2Count = allIssues.filter(i => i.labels.includes('P2')).length;

  // Stop-loss count from alerts
  const stopLossCount = filteredAlerts.filter(r => r.cells.join(' ').toLowerCase().includes('stop-loss')).length;

  // ── Task Flow: group issues into columns ──
  const inProgressLabels = ['in progress', 'in-progress', 'wip'];
  const backlogLabels = ['backlog', 'later', 'icebox'];

  const todoIssues = allIssues.filter(i =>
    !i.labels.some(l => inProgressLabels.includes(l.toLowerCase())) &&
    !i.labels.some(l => backlogLabels.includes(l.toLowerCase()))
  );
  const inProgressIssues = allIssues.filter(i =>
    i.labels.some(l => inProgressLabels.includes(l.toLowerCase()))
  );
  const backlogIssues = allIssues.filter(i =>
    i.labels.some(l => backlogLabels.includes(l.toLowerCase()))
  );

  const taskFlowColumns = [
    { label: 'Todo', count: todoIssues.length, items: todoIssues.map(i => ({ repo: i.repo, number: i.number, title: i.title, labels: i.labels, url: i.url })) },
    { label: 'In Progress', count: inProgressIssues.length, items: inProgressIssues.map(i => ({ repo: i.repo, number: i.number, title: i.title, labels: i.labels, url: i.url })) },
    { label: 'Done', count: closedIssues.length, items: closedIssues.map(i => ({ repo: i.repo, number: i.number, title: i.title, labels: i.labels, url: i.url })) },
    { label: 'Backlog', count: backlogIssues.length, items: backlogIssues.map(i => ({ repo: i.repo, number: i.number, title: i.title, labels: i.labels, url: i.url })) },
  ];

  // ── Event Stream: combine open + closed, sorted by time ──
  type EventAction = 'opened' | 'closed' | 'updated';
  const eventStream: { repo: string; number: number; title: string; action: EventAction; timestamp: string; url: string }[] = [];

  for (const issue of closedIssues) {
    eventStream.push({ repo: issue.repo, number: issue.number, title: issue.title, action: 'closed', timestamp: issue.updatedAt, url: issue.url });
  }
  for (const issue of allIssues) {
    const created = new Date(issue.createdAt).getTime();
    const updated = new Date(issue.updatedAt).getTime();
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (created > sevenDaysAgo) {
      eventStream.push({ repo: issue.repo, number: issue.number, title: issue.title, action: 'opened', timestamp: issue.createdAt, url: issue.url });
    } else if (updated > sevenDaysAgo) {
      eventStream.push({ repo: issue.repo, number: issue.number, title: issue.title, action: 'updated', timestamp: issue.updatedAt, url: issue.url });
    }
  }
  eventStream.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // ── Security Posture: parse HEALTH.md ──
  const securityMetrics: { label: string; value: string; status: 'good' | 'warn' | 'bad'; bar?: number }[] = [];
  let securityPosture: 'SECURE' | 'WARNING' | 'CRITICAL' = 'SECURE';

  if (healthMd) {
    const healthLines = healthMd.split('\n');
    let hasCritical = false;
    let hasWarn = false;

    for (const line of healthLines) {
      if (!line.startsWith('|') || line.match(/^\|[\s-|]+\|$/) || line.includes('Metric')) continue;
      const cols = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length < 2) continue;
      const label = cols[0];
      const value = cols[1];
      const isBad = /DOWN|FAIL|CRITICAL|ERROR/i.test(value);
      const isWarn = /STALE|WARN|HIGH|ALERT/i.test(value);
      const status = isBad ? 'bad' as const : isWarn ? 'warn' as const : 'good' as const;
      if (isBad) hasCritical = true;
      if (isWarn) hasWarn = true;

      const barMatch = value.match(/([\d.]+)\s*%/);
      const bar = barMatch ? parseFloat(barMatch[1]) : undefined;

      securityMetrics.push({ label, value, status, bar });
    }

    if (hasCritical) securityPosture = 'CRITICAL';
    else if (hasWarn) securityPosture = 'WARNING';
  }

  return (
    <div>
      {/* ── EXECUTIVE SUMMARY HUB ──────────────────────────────── */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">The Firm — Executive Summary</h2>
          <span className="text-[10px] text-muted-foreground font-mono">{meta['Timestamp'] || 'Last patrol'}</span>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
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
              <span className="text-muted-foreground">Equity:</span><span className="font-mono text-foreground text-right">{radarEquityRow?.cells[1]?.replace(' (PAPER)', '') || '$95,944'}</span>
              <span className="text-muted-foreground">Daily P/L:</span><span className={`font-mono text-right ${radarPnlRow?.cells[1]?.includes('-') ? 'text-red-400' : 'text-green-400'}`}>{radarPnlRow?.cells[1]?.replace(' (PAPER)', '') || '--'}</span>
              <span className="text-muted-foreground">Positions:</span><span className="font-mono text-foreground text-right">14</span>
              {stopLossCount > 0 && <><span className="text-muted-foreground">Alerts:</span><span className="font-mono text-red-400 text-right">🔴 {stopLossCount} stop-loss</span></>}
            </div>
          </Link>

          {/* Projects */}
          <Link href="/dashboard/projects" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all no-underline group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Projects</span>
              <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">→ detail</span>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-sm">
              <span className="text-muted-foreground">Total:</span><span className="font-mono text-foreground text-right">{pdlcProjects.length}</span>
              <span className="text-muted-foreground">Live:</span><span className="font-mono text-green-400 text-right">{liveCount}</span>
              <span className="text-muted-foreground">Building:</span><span className="font-mono text-blue-400 text-right">{buildCount}</span>
              <span className="text-muted-foreground">Early stage:</span><span className="font-mono text-muted-foreground text-right">{earlyCount}</span>
            </div>
          </Link>

          {/* Infra */}
          <Link href="/dashboard/infra" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all no-underline group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Infrastructure</span>
              <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">→ detail</span>
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-sm">
              <span className="text-muted-foreground">Mac:</span><span className="font-mono text-green-400 text-right">✅ {macDisk?.cells[1]?.split('—')[0]?.trim() || 'OK'}</span>
              <span className="text-muted-foreground">Pi5:</span><span className="font-mono text-green-400 text-right">✅ {pi5Uptime?.cells[1]?.split('—')[0]?.trim() || 'OK'}</span>
              <span className="text-muted-foreground">Git:</span><span className="font-mono text-green-400 text-right">✅ {gitSync?.cells[1]?.split('—')[0]?.trim() || 'Clean'}</span>
              <span className="text-muted-foreground">Agents:</span><span className="font-mono text-green-400 text-right">6/6 online</span>
            </div>
          </Link>
        </div>

        {/* Needs Michael + Open Issues — full width row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {blocked.length > 0 && (
            <div className="rounded-xl border-2 border-amber-500/20 bg-amber-500/5 p-4">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">Needs Michael</span>
              <div className="mt-2 space-y-1.5">
                {blocked.map((row, i) => (
                  <div key={i} className="text-sm text-foreground/80">• {row.cells[0]} <span className="text-muted-foreground text-xs">({row.cells[1]})</span></div>
                ))}
              </div>
            </div>
          )}
          <Link href="https://github.com/users/ahfeiathome/projects/1" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all no-underline group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Open Issues</span>
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
        </div>
      </div>

      {/* ── FELIX HEARTBEAT (existing content below) ───────────── */}

      {/* ── ZONE 1: Header + Alerts + Blocked (above the fold) ─────────── */}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <StatusDot
            status={meta['Status'] === 'HEALTHY' ? 'good' : meta['Status']?.includes('CRITICAL') ? 'bad' : 'warn'}
            size="lg"
          />
          <div>
            <div className="text-lg font-semibold text-foreground">Felix Heartbeat</div>
            <div className="text-xs text-muted-foreground font-mono">
              {meta['Timestamp'] || 'unknown'} | {meta['Type'] || `Market: ${meta['Market Phase'] || '?'} | Mode: ${meta['Mode'] || '?'}`} | Duration: {meta['Duration'] || '?'}
            </div>
          </div>
        </div>
        <SignalPill
          label={meta['Status'] || 'UNKNOWN'}
          tone={meta['Status'] === 'HEALTHY' ? 'success' : meta['Status']?.includes('WARN') ? 'warning' : meta['Status']?.includes('CRITICAL') ? 'error' : 'neutral'}
        />
      </div>

      {/* Brief exec summary — condensed inline, not a full card */}
      <div className="text-sm text-muted-foreground mb-4 animate-fade-in font-mono leading-relaxed">
        {execLines.join(' ')}
      </div>

      {/* Quick Actions */}
      <QuickActionsBar />

      {/* Alerts + Blocked on Sponsor — top of page, actionable */}
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
                  <div>
                    <span className="text-foreground/80">{row.cells[1]}</span>
                    {row.cells[2] && <span className="text-muted-foreground ml-2 text-xs">{row.cells[2]}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        <SectionCard title="Needs Sponsor">
          {blocked.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <StatusDot status="good" size="sm" />
              Nothing blocked
            </div>
          ) : (
            <div className="space-y-2.5">
              {blocked.map((row, i) => (
                <div key={i} className="border-l-2 border-amber-200 pl-3 py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground/80 font-medium">{row.cells[0]}</span>
                    <span className="text-muted-foreground text-xs ml-auto font-mono">{row.cells[1]}</span>
                  </div>
                  {row.cells[2] && <div className="text-muted-foreground text-xs mt-0.5">{row.cells[2]}</div>}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── ZONE 2: Metric strip + Health panels ──────────────────────── */}

      {/* Hero MetricCards — color-coded borders */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard label="Projects" value={pdlcProjects.length} subtitle={`${liveCount} live`} trend="up" />
        <MetricCard label="Status" value={meta['Status'] || '?'} trend={meta['Status'] === 'HEALTHY' ? 'up' : 'flat'} semantic={meta['Status'] === 'HEALTHY' ? 'success' : meta['Status']?.includes('CRITICAL') ? 'danger' : 'warning'} />
        {burnRow && <MetricCard label="Monthly Burn" value={burnRow.cells[1]?.replace('(free tiers)', '').trim() || burnRow.cells[1]} trend="flat" />}
        {freeRow && <MetricCard label={freeRow.cells[0]} value={freeRow.cells[1]} trend="up" semantic="success" />}
        <MetricCard label="Alerts" value={hasAlerts ? filteredAlerts.length : 0} subtitle={hasAlerts ? 'Review above' : 'All clear'} trend={hasAlerts ? 'down' : 'up'} semantic={hasAlerts ? 'warning' : 'success'} />
      </div>

      {/* Agent Status + Financial health panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <AgentStatusPanel />
        <SectionCard title="Financial">
          <div className="space-y-3">
            {financial.map((row, i) => {
              const label = row.cells[0] || '';
              const value = row.cells[1] || '';
              const isRadar = label.toLowerCase().includes('radar');
              const displayValue = isRadar && !value.includes('PAPER') ? `${value} (PAPER)` : value;
              return (
                <HealthRow
                  key={i}
                  label={label}
                  value={displayValue}
                  status={getHealthStatus(value)}
                />
              );
            })}
            {financial.length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
          </div>
        </SectionCard>
      </div>

      {/* Infrastructure + Tooling health panel */}
      {(infra.length > 0 || tooling.length > 0) && (
        <div className="mb-6">
          <SectionCard title="Infrastructure">
            <div className="space-y-3">
              {[...infra, ...tooling].map((row, i) => (
                <HealthRow
                  key={i}
                  label={row.cells[0]}
                  value={row.cells[1] || ''}
                  status={getHealthStatus(row.cells[1] || '')}
                  bar={parseBarPercent(row.cells[1] || '')}
                />
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Velocity + Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {velocity.length > 0 && (
          <SectionCard title="Velocity">
            <div className="space-y-3">
              {velocity.map((row, i) => (
                <HealthRow key={i} label={row.cells[0]} value={row.cells[1] || ''} status="good" />
              ))}
            </div>
          </SectionCard>
        )}
        {actions.length > 0 && (
          <SectionCard title="Actions Taken">
            <div className="space-y-2">
              {actions.map((row, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <span className="shrink-0 text-green-600 mt-0.5 font-mono text-xs">
                    {row.cells[1]?.includes('Done') || row.cells[1]?.includes('done') ? '\u2713' : '\u2022'}
                  </span>
                  <span className="text-muted-foreground">{row.cells[0]}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {/* ── Issues & Releases (cross-repo) ───────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 mt-4">
        <SectionCard title="Open Issues" action={<a href="https://github.com/users/ahfeiathome/projects/1" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline no-underline">Board &rarr;</a>}>
          {allIssues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open issues</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {allIssues.slice(0, 20).map((issue: GitHubIssue) => (
                <a key={`${issue.repo}-${issue.number}`} href={issue.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 rounded-lg p-2 hover:bg-muted transition-colors no-underline">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono text-muted-foreground">{issue.repo}</span>
                      <span className="text-xs text-muted-foreground">#{issue.number}</span>
                    </div>
                    <p className="text-sm text-foreground truncate">{issue.title}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {issue.labels.filter(l => ['P0','P1','P2'].includes(l)).map(l => (
                      <span key={l} className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${l === 'P0' ? 'bg-red-500/20 text-red-400' : l === 'P1' ? 'bg-amber-500/20 text-amber-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{l}</span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title={allReleases.length > 0 ? 'Recent Releases' : ''}>
          {allReleases.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No releases yet — will appear after first tagged release</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {allReleases.slice(0, 10).map((rel: GitHubRelease) => (
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
          )}
        </SectionCard>
      </div>

      {/* ── Task Flow + Event Stream + Security ────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 mt-6 mb-6">
        <TaskFlowWidget columns={taskFlowColumns} />
        <EventStreamWidget events={eventStream.slice(0, 30)} />
      </div>
      <div className="mb-6">
        <SecurityPostureBadge posture={securityPosture} metrics={securityMetrics.slice(0, 8)} />
      </div>

      {/* ── ZONE 3: PDLC Pipeline (collapsible) ──────────────────────── */}

      <div className="mb-4">
        <CollapsibleSection
          title="Projects -- PDLC Pipeline"
          defaultOpen={false}
          badge={
            <span className="text-[10px] text-muted-foreground font-mono ml-1">
              {pdlcProjects.length} projects
            </span>
          }
        >
          <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-green-500 inline-block" /> Completed</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-blue-500 ring-1 ring-blue-500/30 inline-block" /> Current</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-muted inline-block" /> Upcoming</span>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary text-white">All {pdlcProjects.length}</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">Live {liveCount}</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">Building {buildCount}</span>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">Early {earlyCount}</span>
          </div>

          {/* PDLC Phase Reference */}
          <div className="border border-border rounded-2xl p-4 mb-3 bg-card shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-medium shrink-0">PDLC Lifecycle:</span>
              <div className="flex items-center gap-0.5 flex-1 max-w-xl">
                {PDLC_STAGES.map((s) => (
                  <div key={s} className="flex-1 text-center">
                    <div className="h-1.5 rounded-full bg-muted" />
                    <span className="text-[10px] text-muted-foreground font-mono">{PDLC_LABELS[s]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stage distribution pills + categorized project cards */}
          {(() => {
            const stageCounts: Record<string, number> = {};
            pdlcProjects.forEach(p => {
              const { current } = parsePdlcStage(p.pdlcStage);
              const label = PDLC_LABELS[current] || current;
              stageCounts[label] = (stageCounts[label] || 0) + 1;
            });

            const foundryNames = new Set(['VERDE', 'VAULT', 'CORTEX', 'REHEARSAL', 'AXIOM', 'PHOENIX', 'CLAW', 'RADAR']);
            const collaborateNames = new Set(['LEARNIE']);
            const serviceNames = new Set(['WINGMAN']);

            const foundry = pdlcProjects.filter(p => foundryNames.has(p.codename));
            const collaborate = pdlcProjects.filter(p => collaborateNames.has(p.codename));
            const service = pdlcProjects.filter(p => serviceNames.has(p.codename));
            const categorized = new Set([...foundryNames, ...collaborateNames, ...serviceNames]);
            const other = pdlcProjects.filter(p => !categorized.has(p.codename));

            const CategorySection = ({ title, desc, color, items }: { title: string; desc: string; color: string; items: PdlcProject[] }) => {
              if (items.length === 0) return null;
              return (
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-sm font-semibold ${color} uppercase tracking-wide`}>{title}</span>
                    <span className="text-xs text-muted-foreground">-- {desc}</span>
                    <span className="text-xs text-muted-foreground ml-auto font-mono">{items.length} project{items.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {items.map((p) => <PdlcCard key={p.codename} project={p} />)}
                  </div>
                </div>
              );
            };

            return (
              <>
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs text-muted-foreground font-mono">{pdlcProjects.length} projects:</span>
                  {Object.entries(stageCounts).map(([label, count]) => (
                    <SignalPill key={label} label={`${label} (${count})`} tone="neutral" />
                  ))}
                </div>
                <CategorySection title="Foundry" desc="Apps & internal products" color="text-green-600" items={foundry} />
                <CategorySection title="Collaborate" desc="Co-founded ventures" color="text-blue-600" items={collaborate} />
                <CategorySection title="Service" desc="Client & partner projects" color="text-purple-600" items={service} />
                {other.length > 0 && <CategorySection title="Other" desc="Uncategorized" color="text-muted-foreground" items={other} />}
              </>
            );
          })()}
        </CollapsibleSection>
      </div>
    </div>
  );
}
