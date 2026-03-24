import { fetchPatrolReport, fetchProjects } from '@/lib/github';
import { MetricCard, HealthRow, SignalPill, SectionCard } from '@/components/dashboard';

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
  const sections = ['Active', 'FOUNDRY — App Factory', 'Autonomous', 'Pipeline'];
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
      if (line.startsWith('| —') || line.startsWith('|---')) continue;
      const cols = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length < 6) continue;
      const codename = cols[0].replace(/\*\*/g, '');
      const pdlcRaw = cols[3] || '';
      if (pdlcRaw.includes('ARCHIVED') || pdlcRaw === '—') continue;
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
    return 'bg-slate-200';
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
    <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        <SignalPill label={project.status.replace(/\*\*/g, '').slice(0, 20)} tone={statusTone} />
        <span className="text-sm font-semibold text-slate-800">{project.codename}</span>
        <span className="text-xs text-slate-400 ml-auto">{project.publicName}</span>
      </div>
      <div className="flex gap-0.5 mb-2">
        {PDLC_STAGES.map((stage, idx) => (
          <div key={stage} className="flex-1 flex flex-col items-center" title={`${stage}: ${PDLC_LABELS[stage]}`}>
            <div className={`w-full h-2 rounded-full ${stageColors(stage, idx)}`} />
            <span className={`text-[9px] mt-0.5 leading-tight text-center ${idx === currentIdx ? 'text-blue-600 font-bold' : idx < currentIdx ? 'text-green-600/70' : 'text-slate-300'}`}>
              {PDLC_LABELS[stage]?.slice(0, 5) || stage}
            </span>
          </div>
        ))}
      </div>
      <div className="text-xs text-slate-500 truncate">{PDLC_LABELS[current] || current} -- {project.status.replace(/\*\*/g, '').slice(0, 60)}</div>
      {project.revenue && project.revenue !== '—' && project.revenue !== 'Internal' && (
        <div className="text-xs text-green-600 mt-0.5">{project.revenue}</div>
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
  financial: TableRow[],
  infra: TableRow[],
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
  const hasAlerts = alerts.length > 0 && !(alerts.length === 1 && alerts[0].cells[0] === '—');
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
      <div className="text-center py-20 text-slate-400">
        <div className="text-2xl mb-2">--</div>
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

  const execLines = buildExecSummary(meta, alerts, velocity, blocked, pdlcProjects, financial, infra);

  const statusColor =
    meta['Status'] === 'HEALTHY' ? 'text-green-600' :
    meta['Status']?.includes('WARN') ? 'text-amber-600' :
    meta['Status']?.includes('CRITICAL') ? 'text-red-600' : 'text-slate-800';

  const hasAlerts = alerts.length > 0 && !(alerts.length === 1 && alerts[0].cells[0] === '—');

  // Extract KPI values from financial rows
  const burnRow = financial.find(r => r.cells[0]?.toLowerCase().includes('burn') || r.cells[0]?.toLowerCase().includes('cost'));
  const freeRow = financial.find(r => r.cells[0]?.toLowerCase().includes('free'));
  const revenueRow = financial.find(r => r.cells[0]?.toLowerCase().includes('revenue'));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${meta['Status'] === 'HEALTHY' ? 'bg-green-400 animate-pulse' : 'bg-amber-400'}`} />
          <div>
            <div className="text-base font-medium text-slate-800">Felix Heartbeat -- {meta['Timestamp'] || 'unknown'}</div>
            <div className="text-xs text-slate-400">
              {meta['Type'] || `Market: ${meta['Market Phase'] || '?'} | Mode: ${meta['Mode'] || '?'}`} | Duration: {meta['Duration'] || '?'}
            </div>
          </div>
        </div>
        <SignalPill
          label={meta['Status'] || 'UNKNOWN'}
          tone={meta['Status'] === 'HEALTHY' ? 'success' : meta['Status']?.includes('WARN') ? 'warning' : meta['Status']?.includes('CRITICAL') ? 'error' : 'neutral'}
        />
      </div>

      {/* Exec Summary */}
      <SectionCard title="Executive Summary" accent="blue" className="mb-6 bg-gradient-to-r from-slate-50 to-white">
        <div className="space-y-2">
          {execLines.map((line, i) => (
            <p key={i} className="text-sm text-slate-600 leading-relaxed">{line}</p>
          ))}
        </div>
      </SectionCard>

      {/* Hero MetricCards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard label="Projects" value={pdlcProjects.length} color="blue" subtitle={`${pdlcProjects.filter(p => p.pdlcStage.includes('S7') || p.pdlcStage.includes('S8')).length} live`} />
        <MetricCard label="Status" value={meta['Status'] || '?'} color={meta['Status'] === 'HEALTHY' ? 'green' : 'amber'} />
        {burnRow && <MetricCard label={burnRow.cells[0]} value={burnRow.cells[1]} color="amber" />}
        {freeRow && <MetricCard label={freeRow.cells[0]} value={freeRow.cells[1]} color="green" />}
        <MetricCard label="Alerts" value={hasAlerts ? alerts.length : 0} color={hasAlerts ? 'red' : 'green'} subtitle={hasAlerts ? 'Review below' : 'All clear'} />
      </div>

      {/* Alerts + Blocked */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Alerts" accent={hasAlerts ? 'red' : 'green'} className={hasAlerts ? 'border-red-200 bg-red-50/30' : ''}>
          {!hasAlerts ? (
            <div className="text-sm text-green-600">No alerts</div>
          ) : (
            <div className="space-y-2">
              {alerts.map((row, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`shrink-0 mt-1 w-2 h-2 rounded-full ${
                    row.cells[0]?.includes('CRITICAL') ? 'bg-red-400' : row.cells[0]?.includes('WARN') ? 'bg-amber-400' : 'bg-blue-400'
                  }`} />
                  <div>
                    <span className="text-slate-700">{row.cells[1]}</span>
                    {row.cells[2] && <span className="text-slate-400 ml-2">{row.cells[2]}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
        <SectionCard title="Needs Sponsor" accent="amber" className={blocked.length > 0 ? 'border-amber-200 bg-amber-50/30' : ''}>
          {blocked.length === 0 ? (
            <div className="text-sm text-green-600">Nothing blocked</div>
          ) : (
            <div className="space-y-2">
              {blocked.map((row, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-slate-700 font-medium">{row.cells[0]}</span>
                    <span className="text-slate-400 text-xs ml-auto">{row.cells[1]}</span>
                  </div>
                  {row.cells[2] && <div className="text-slate-400 ml-4 mt-0.5 text-xs">{row.cells[2]}</div>}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Infrastructure HealthRows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Infrastructure" accent="green">
          <div className="space-y-3">
            {[...infra, ...tooling].map((row, i) => (
              <HealthRow
                key={i}
                label={row.cells[0]}
                value={row.cells[1] || ''}
                status={getHealthStatus(row.cells[1] || '')}
              />
            ))}
            {infra.length === 0 && tooling.length === 0 && <div className="text-sm text-slate-400">No data</div>}
          </div>
        </SectionCard>
        <SectionCard title="Financial" accent="amber">
          <div className="space-y-3">
            {financial.map((row, i) => (
              <HealthRow
                key={i}
                label={row.cells[0]}
                value={row.cells[1] || ''}
                status={getHealthStatus(row.cells[1] || '')}
              />
            ))}
            {financial.length === 0 && <div className="text-sm text-slate-400">No data</div>}
          </div>
        </SectionCard>
      </div>

      {/* Velocity + Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {velocity.length > 0 && (
          <SectionCard title="Velocity" accent="blue">
            <div className="space-y-3">
              {velocity.map((row, i) => (
                <HealthRow key={i} label={row.cells[0]} value={row.cells[1] || ''} status="good" />
              ))}
            </div>
          </SectionCard>
        )}
        {actions.length > 0 && (
          <SectionCard title="Actions Taken" accent="green">
            <div className="space-y-2">
              {actions.map((row, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 text-green-600 mt-0.5">
                    {row.cells[1]?.includes('Done') || row.cells[1]?.includes('done') ? '>' : '.'}
                  </span>
                  <span className="text-slate-600">{row.cells[0]}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>

      {/* Projects PDLC Pipeline */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Projects -- PDLC Pipeline</div>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-green-500 inline-block" /> Completed</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-blue-500 ring-1 ring-blue-500/30 inline-block" /> Current</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-2 rounded-full bg-slate-200 inline-block" /> Upcoming</span>
          </div>
        </div>

        {/* PDLC Phase Reference */}
        <div className="border border-slate-200 rounded-xl p-4 mb-3 bg-slate-50 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium shrink-0">PDLC Lifecycle:</span>
            <div className="flex items-center gap-0.5 flex-1 max-w-xl">
              {PDLC_STAGES.map((s) => (
                <div key={s} className="flex-1 text-center">
                  <div className="h-1.5 rounded-full bg-slate-200" />
                  <span className="text-[10px] text-slate-400">{PDLC_LABELS[s]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stage distribution pills */}
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

          const CategorySection = ({ title, desc, color, items }: { title: string; desc: string; color: keyof typeof sectionColors; items: PdlcProject[] }) => {
            if (items.length === 0) return null;
            return (
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-semibold ${sectionColors[color]} uppercase tracking-wide`}>{title}</span>
                  <span className="text-xs text-slate-400">-- {desc}</span>
                  <span className="text-xs text-slate-400 ml-auto">{items.length} project{items.length > 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((p) => <PdlcCard key={p.codename} project={p} />)}
                </div>
              </div>
            );
          };

          const sectionColors = {
            green: 'text-green-600',
            blue: 'text-blue-600',
            purple: 'text-purple-600',
            slate: 'text-slate-500',
          };

          return (
            <>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="text-xs text-slate-500">{pdlcProjects.length} projects:</span>
                {Object.entries(stageCounts).map(([label, count]) => (
                  <SignalPill key={label} label={`${label} (${count})`} tone="neutral" />
                ))}
              </div>
              <CategorySection title="Foundry" desc="Apps & internal products" color="green" items={foundry} />
              <CategorySection title="Collaborate" desc="Co-founded ventures" color="blue" items={collaborate} />
              <CategorySection title="Service" desc="Client & partner projects" color="purple" items={service} />
              {other.length > 0 && <CategorySection title="Other" desc="Uncategorized" color="slate" items={other} />}
            </>
          );
        })()}
      </div>
    </div>
  );
}
