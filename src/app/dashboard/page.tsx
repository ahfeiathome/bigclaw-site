import { fetchPatrolReport, fetchProjects } from '@/lib/github';
import { MetricCard, HealthRow, SignalPill, SectionCard, StatusDot } from '@/components/dashboard';

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
  const [content, projectsMd] = await Promise.all([
    fetchPatrolReport(),
    fetchProjects(),
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

  const execLines = buildExecSummary(meta, alerts, velocity, blocked, pdlcProjects);

  const hasAlerts = alerts.length > 0 && !(alerts.length === 1 && alerts[0].cells[0] === '\u2014');

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
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

      {/* Exec Summary */}
      <SectionCard title="Executive Summary" className="mb-6">
        <div className="space-y-2">
          {execLines.map((line, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
          ))}
        </div>
      </SectionCard>

      {/* Hero MetricCards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard label="Projects" value={pdlcProjects.length} subtitle={`${liveCount} live`} trend="up" />
        <MetricCard label="Status" value={meta['Status'] || '?'} trend={meta['Status'] === 'HEALTHY' ? 'up' : 'flat'} />
        {burnRow && <MetricCard label={burnRow.cells[0]} value={burnRow.cells[1]} trend="flat" />}
        {freeRow && <MetricCard label={freeRow.cells[0]} value={freeRow.cells[1]} trend="up" />}
        <MetricCard label="Alerts" value={hasAlerts ? alerts.length : 0} subtitle={hasAlerts ? 'Review below' : 'All clear'} trend={hasAlerts ? 'down' : 'up'} />
      </div>

      {/* Alerts + Blocked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Alerts">
          {!hasAlerts ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <StatusDot status="good" size="sm" />
              No alerts
            </div>
          ) : (
            <div className="space-y-2.5">
              {alerts.map((row, i) => (
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

      {/* Infrastructure HealthRows with progress bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            {infra.length === 0 && tooling.length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
          </div>
        </SectionCard>
        <SectionCard title="Financial">
          <div className="space-y-3">
            {financial.map((row, i) => (
              <HealthRow
                key={i}
                label={row.cells[0]}
                value={row.cells[1] || ''}
                status={getHealthStatus(row.cells[1] || '')}
              />
            ))}
            {financial.length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
          </div>
        </SectionCard>
      </div>

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

      {/* Projects PDLC Pipeline */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects -- PDLC Pipeline</span>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-green-500 inline-block" /> Completed</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-blue-500 ring-1 ring-blue-500/30 inline-block" /> Current</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-muted inline-block" /> Upcoming</span>
          </div>
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
      </div>
    </div>
  );
}
