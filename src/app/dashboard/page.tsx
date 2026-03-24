import { fetchPatrolReport, fetchProjects } from '@/lib/github';

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

function StatusBadge({ value }: { value: string }) {
  const isGood = value.includes('✅') || value === 'UP' || value === 'OK' || value.includes('HEALTHY') || value.includes('active') || value.includes('green') || value.includes('LIVE');
  const isWarn = value.includes('⚠️') || value.includes('STALE') || value.includes('Blocked') || value.includes('QUEUE');
  const isBad = value.includes('❌') || value === 'DOWN' || value.includes('FAIL');
  const color = isBad ? 'text-red-600' : isWarn ? 'text-amber-600' : isGood ? 'text-green-600' : 'text-foreground/80';
  return <span className={`font-mono ${color}`}>{value}</span>;
}

function KpiCard({ title, color, rows, showTrend }: { title: string; color: string; rows: TableRow[]; showTrend?: boolean }) {
  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-md hover:shadow-lg transition-shadow">
      <div className={`text-sm font-semibold ${color} uppercase tracking-wide mb-3`}>{title}</div>
      <div className="space-y-2.5">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between items-center text-sm gap-2">
            <span className="text-muted shrink-0">{row.cells[0]}</span>
            <StatusBadge value={row.cells[1] || ''} />
            {showTrend && row.cells[2] && (
              <span className="text-muted text-xs shrink-0 w-4 text-center">{row.cells[2]}</span>
            )}
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-muted">No data</div>}
      </div>
    </div>
  );
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
  const sections = ['Active', 'FOUNDRY — App Factory', 'Autonomous', 'Pipeline'];
  for (const section of sections) {
    const regex = new RegExp(`## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n`, 'm');
    const match = content.search(regex);
    if (match === -1) continue;
    const rest = content.slice(match);
    const lines = rest.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Stop at the next section heading or horizontal rule
      if (line.match(/^## /) || line.match(/^---\s*$/)) break;
      if (!line.startsWith('|') || line.includes('Codename') || line.match(/^\|[\s-|]+\|$/)) continue;
      if (line.startsWith('| —') || line.startsWith('|---')) continue;
      const cols = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length < 6) continue;
      const codename = cols[0].replace(/\*\*/g, '');
      // Skip archived and duplicates
      const pdlcRaw = cols[3] || '';
      if (pdlcRaw.includes('ARCHIVED') || pdlcRaw === '—') continue;
      if (seen.has(codename)) continue;
      seen.add(codename);
      // Pipeline table has an extra "Type" column at index 4, shifting Status to 5
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
    if (idx < currentIdx) return 'bg-green-500'; // completed
    if (idx === currentIdx) return 'bg-blue-500 ring-2 ring-blue-500/30'; // current
    return 'bg-slate-200'; // future
  };

  const statusDot =
    project.status.includes('PRIORITY') || project.status.includes('Active') || project.status.includes('active')
      ? 'bg-blue-400'
      : project.status.includes('live') || project.status.includes('LIVE') || project.status.includes('Live')
      ? 'bg-green-400'
      : project.status.includes('Paper') || project.status.includes('paper')
      ? 'bg-cyan-400'
      : project.status.includes('queued') || project.status.includes('Queued')
      ? 'bg-zinc-500'
      : 'bg-zinc-500';

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2.5 h-2.5 rounded-full ${statusDot}`} />
        <span className="text-sm font-semibold text-foreground">{project.codename}</span>
        <span className="text-xs text-muted ml-auto">{project.publicName}</span>
      </div>
      {/* PDLC Pipeline Track */}
      <div className="flex gap-0.5 mb-2">
        {PDLC_STAGES.map((stage, idx) => (
          <div key={stage} className="flex-1 flex flex-col items-center" title={`${stage}: ${PDLC_LABELS[stage]}`}>
            <div className={`w-full h-2 rounded-full ${stageColors(stage, idx)}`} />
            <span className={`text-[9px] mt-0.5 leading-tight text-center ${idx === currentIdx ? 'text-blue-600 font-bold' : idx < currentIdx ? 'text-green-600/70' : 'text-muted/50'}`}>
              {PDLC_LABELS[stage]?.slice(0, 5) || stage}
            </span>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted truncate">{PDLC_LABELS[current] || current} — {project.status.replace(/\*\*/g, '').slice(0, 60)}</div>
      {project.revenue && project.revenue !== '—' && project.revenue !== 'Internal' && (
        <div className="text-xs text-green-600 mt-0.5">{project.revenue}</div>
      )}
    </div>
  );
}

function ProjectCard({ row }: { row: TableRow }) {
  const [name, status, phase, blocker] = row.cells;
  const statusColor =
    status === 'LIVE' ? 'bg-green-400' :
    status === 'BUILD' ? 'bg-blue-400' :
    status === 'PAPER' ? 'bg-cyan-400' :
    status === 'DESIGN' ? 'bg-purple-400' :
    status === 'QUEUE' ? 'bg-zinc-500' :
    status === 'BLOCKED' ? 'bg-red-400' : 'bg-zinc-600';

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className="text-xs font-semibold text-foreground">{name}</span>
        <span className="text-[10px] font-mono text-muted ml-auto">{status}</span>
      </div>
      <div className="text-[11px] text-muted">{phase}</div>
      {blocker && blocker !== '—' && (
        <div className="text-[10px] text-amber-400 mt-1">{blocker}</div>
      )}
    </div>
  );
}

function AlertsCard({ rows }: { rows: TableRow[] }) {
  const hasAlerts = rows.length > 0 && !(rows.length === 1 && rows[0].cells[0] === '—');
  return (
    <div className={`rounded-xl p-5 shadow-md ${hasAlerts ? 'border border-red-300 bg-red-50' : 'border border-slate-200 bg-white'}`}>
      <div className="text-sm font-semibold text-red-500 uppercase tracking-wide mb-3">Alerts</div>
      {!hasAlerts ? (
        <div className="text-sm text-green-600">No alerts</div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                row.cells[0]?.includes('CRITICAL') ? 'bg-red-400' : row.cells[0]?.includes('WARN') ? 'bg-amber-400' : 'bg-blue-400'
              }`} />
              <div>
                <span className="text-foreground/90">{row.cells[1]}</span>
                {row.cells[2] && <span className="text-muted ml-2">{row.cells[2]}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionsCard({ rows }: { rows: TableRow[] }) {
  return (
    <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-md">
      <div className="text-sm font-semibold text-accent uppercase tracking-wide mb-3">Actions Taken</div>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-start gap-2 text-sm">
            <span className="shrink-0 text-green-600">{row.cells[1]?.includes('✅') ? '✓' : '·'}</span>
            <span className="text-foreground/80">{row.cells[0]}</span>
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-muted">No actions this patrol</div>}
      </div>
    </div>
  );
}

function BlockedCard({ rows }: { rows: TableRow[] }) {
  return (
    <div className="border border-amber-200 rounded-xl p-5 bg-amber-50/50 shadow-md">
      <div className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Needs Sponsor</div>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="text-sm">
            <div className="flex items-center gap-2">
              <span className="text-amber-500">●</span>
              <span className="text-foreground/90 font-medium">{row.cells[0]}</span>
              <span className="text-muted text-xs ml-auto">{row.cells[1]}</span>
            </div>
            {row.cells[2] && <div className="text-muted ml-4 mt-0.5">{row.cells[2]}</div>}
          </div>
        ))}
        {rows.length === 0 && <div className="text-sm text-green-600">Nothing blocked</div>}
      </div>
    </div>
  );
}

function buildExecSummary(
  meta: Record<string, string>,
  alerts: TableRow[],
  velocity: TableRow[],
  projects: TableRow[],
  blocked: TableRow[],
  actions: TableRow[],
  pdlcProjects: PdlcProject[],
  financial: TableRow[],
  infra: TableRow[],
): string[] {
  const lines: string[] = [];

  // Health narrative
  const status = meta['Status'] || 'UNKNOWN';
  if (status === 'HEALTHY') {
    lines.push('All systems operational. No critical issues detected this patrol cycle.');
  } else if (status.includes('WARN')) {
    lines.push(`System health degraded — ${status}. Review alerts below.`);
  } else if (status.includes('CRITICAL')) {
    lines.push(`Critical issues detected — ${status}. Immediate attention required.`);
  }

  // Project phase distribution
  if (pdlcProjects.length > 0) {
    const liveCount = pdlcProjects.filter(p => p.pdlcStage.includes('S7') || p.pdlcStage.includes('S8')).length;
    const buildCount = pdlcProjects.filter(p => p.pdlcStage.includes('S4') || p.pdlcStage.includes('S5')).length;
    const earlyCount = pdlcProjects.filter(p => p.pdlcStage.includes('S1') || p.pdlcStage.includes('S2') || p.pdlcStage.includes('S3')).length;
    const parts = [];
    if (liveCount > 0) parts.push(`${liveCount} live`);
    if (buildCount > 0) parts.push(`${buildCount} in build/harden`);
    if (earlyCount > 0) parts.push(`${earlyCount} in discovery/define`);
    lines.push(`${pdlcProjects.length} projects: ${parts.join(', ')}.`);
  }

  // Git velocity
  const commitsRow = velocity.find(r => r.cells[0]?.toLowerCase().includes('commit'));
  if (commitsRow) {
    lines.push(`Git velocity: ${commitsRow.cells[1]} commits in the last 24h.`);
  }

  // Finance health
  const burnRow = financial.find(r => r.cells[0]?.toLowerCase().includes('burn') || r.cells[0]?.toLowerCase().includes('cost'));
  const freeRow = financial.find(r => r.cells[0]?.toLowerCase().includes('free') || r.cells[0]?.toLowerCase().includes('tier'));
  if (burnRow) {
    lines.push(`Finance: ${burnRow.cells[0]} ${burnRow.cells[1]}.${freeRow ? ` Free tier: ${freeRow.cells[1]}.` : ''}`);
  }

  // Infra health
  const downItems = infra.filter(r => r.cells[1]?.includes('DOWN') || r.cells[1]?.includes('FAIL') || r.cells[1]?.includes('❌'));
  if (downItems.length > 0) {
    lines.push(`Infra: ${downItems.length} service(s) down — ${downItems.map(r => r.cells[0]).join(', ')}.`);
  } else if (infra.length > 0) {
    lines.push(`Infra: all ${infra.length} services healthy.`);
  }

  // Blockers and alerts
  const hasAlerts = alerts.length > 0 && !(alerts.length === 1 && alerts[0].cells[0] === '—');
  const hasBlocked = blocked.length > 0;
  if (hasAlerts && hasBlocked) {
    lines.push(`${alerts.length} alert(s) + ${blocked.length} item(s) blocked on sponsor.`);
  } else if (hasAlerts) {
    lines.push(`${alerts.length} alert(s) flagged.`);
  } else if (hasBlocked) {
    lines.push(`${blocked.length} item(s) blocked on sponsor decision.`);
  } else {
    lines.push('No alerts or blockers. Clear runway.');
  }

  return lines;
}

function ExecSummaryCard({ lines, title, accentColor }: { lines: string[]; title: string; accentColor: string }) {
  return (
    <div className="border border-slate-200 rounded-xl p-5 mb-6 bg-gradient-to-r from-slate-50 to-white shadow-md">
      <div className={`text-sm font-semibold ${accentColor} uppercase tracking-wide mb-3`}>{title}</div>
      <div className="space-y-2">
        {lines.map((line, i) => (
          <p key={i} className="text-sm text-foreground/80 leading-relaxed">{line}</p>
        ))}
        {lines.length === 0 && <p className="text-sm text-muted">No summary data available.</p>}
      </div>
    </div>
  );
}

export default async function DashboardOverview() {
  const [content, projectsMd] = await Promise.all([
    fetchPatrolReport(),
    fetchProjects(),
  ]);
  const pdlcProjects = projectsMd ? parsePdlcProjects(projectsMd) : [];

  if (!content) {
    return (
      <div className="text-center py-20 text-muted">
        <div className="text-2xl mb-2">📡</div>
        <div>No patrol report yet.</div>
        <div className="text-xs mt-1">Felix will generate one on next heartbeat.</div>
      </div>
    );
  }

  const meta = extractMeta(content);
  const financial = parseMarkdownTable(extractSection(content, 'Financial'));
  const projects = parseMarkdownTable(extractSection(content, 'Projects'));
  const infra = parseMarkdownTable(extractSection(content, 'Infrastructure'));
  const tooling = parseMarkdownTable(extractSection(content, 'Tooling'));
  const velocity = parseMarkdownTable(extractSection(content, 'Velocity'));
  const alerts = parseMarkdownTable(extractSection(content, 'Alerts'));
  const actions = parseMarkdownTable(extractSection(content, 'Actions'));
  const blocked = parseMarkdownTable(extractSection(content, 'Blocked on Sponsor'));

  const execLines = buildExecSummary(meta, alerts, velocity, projects, blocked, actions, pdlcProjects, financial, infra);

  const statusColor =
    meta['Status'] === 'HEALTHY' ? 'text-green-600' :
    meta['Status']?.includes('WARN') ? 'text-amber-600' :
    meta['Status']?.includes('CRITICAL') ? 'text-red-600' : 'text-foreground';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${meta['Status'] === 'HEALTHY' ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
          <div>
            <div className="text-base font-medium">Felix Heartbeat — {meta['Timestamp'] || 'unknown'}</div>
            <div className="text-xs text-muted">
              {meta['Type'] || `Market: ${meta['Market Phase'] || '?'} · Mode: ${meta['Mode'] || '?'}`} · Duration: {meta['Duration'] || '?'}
            </div>
          </div>
        </div>
        <div className={`text-sm font-mono font-semibold ${statusColor}`}>{meta['Status'] || 'UNKNOWN'}</div>
      </div>

      <ExecSummaryCard lines={execLines} title="Executive Summary" accentColor="text-accent" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <AlertsCard rows={alerts} />
        <BlockedCard rows={blocked} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <KpiCard title="Financial" color="text-amber-600" rows={financial} showTrend />
        <KpiCard title="Infrastructure" color="text-emerald-600" rows={[...infra, ...tooling, ...velocity]} />
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-accent uppercase tracking-wide">Projects — PDLC Pipeline</div>
          <div className="flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-green-500 inline-block" /> Completed</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-blue-500 ring-1 ring-blue-500/30 inline-block" /> Current</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-slate-200 inline-block" /> Upcoming</span>
          </div>
        </div>
        {/* PDLC Phase Reference */}
        <div className="border border-slate-200 rounded-xl p-4 mb-3 bg-slate-50 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted font-medium shrink-0">PDLC Lifecycle:</span>
            <div className="flex items-center gap-0.5 flex-1 max-w-xl">
              {PDLC_STAGES.map((s) => (
                <div key={s} className="flex-1 text-center">
                  <div className="h-1.5 rounded-full bg-slate-200" />
                  <span className="text-[10px] text-muted/70">{PDLC_LABELS[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {(() => {
          // Categorize projects
          const foundryNames = new Set(['VERDE', 'VAULT', 'CORTEX', 'REHEARSAL', 'AXIOM', 'PHOENIX', 'CLAW', 'RADAR']);
          const collaborateNames = new Set(['LEARNIE']);
          const serviceNames = new Set(['WINGMAN']);

          const foundry = pdlcProjects.filter(p => foundryNames.has(p.codename));
          const collaborate = pdlcProjects.filter(p => collaborateNames.has(p.codename));
          const service = pdlcProjects.filter(p => serviceNames.has(p.codename));
          const categorized = new Set([...foundryNames, ...collaborateNames, ...serviceNames]);
          const other = pdlcProjects.filter(p => !categorized.has(p.codename));

          const stageCounts: Record<string, number> = {};
          pdlcProjects.forEach(p => {
            const { current } = parsePdlcStage(p.pdlcStage);
            const label = PDLC_LABELS[current] || current;
            stageCounts[label] = (stageCounts[label] || 0) + 1;
          });

          const CategorySection = ({ title, desc, color, items }: { title: string; desc: string; color: string; items: PdlcProject[] }) => (
            items.length > 0 ? (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-semibold ${color} uppercase tracking-wide`}>{title}</span>
                  <span className="text-xs text-muted">— {desc}</span>
                  <span className="text-xs text-muted ml-auto">{items.length} project{items.length > 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((p) => <PdlcCard key={p.codename} project={p} />)}
                </div>
              </div>
            ) : null
          );

          return (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs text-muted">{pdlcProjects.length} projects:</span>
                {Object.entries(stageCounts).map(([label, count]) => (
                  <span key={label} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-foreground/70 shadow-sm">
                    {label} ({count})
                  </span>
                ))}
              </div>
              <CategorySection title="Foundry" desc="Apps & internal products" color="text-emerald-600" items={foundry} />
              <CategorySection title="Collaborate" desc="Co-founded ventures" color="text-blue-600" items={collaborate} />
              <CategorySection title="Service" desc="Client & partner projects" color="text-purple-600" items={service} />
              {other.length > 0 && <CategorySection title="Other" desc="Uncategorized" color="text-zinc-500" items={other} />}
            </>
          );
        })()}
      </div>
    </div>
  );
}
