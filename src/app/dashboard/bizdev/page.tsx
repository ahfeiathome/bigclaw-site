import { fetchCeoInbox, fetchMarketing, fetchAgentsMd, fetchProjects, fetchBandwidth } from '@/lib/github';
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
  const regex = new RegExp(`^##+ ${heading}`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^##+ /) && !lines[i].includes(heading)) {
      end = i;
      break;
    }
  }
  return lines.slice(0, end).join('\n');
}

function extractBulletItems(content: string): string[] {
  return content
    .split('\n')
    .filter((l) => l.match(/^[-*]\s/))
    .map((l) => l.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean);
}

interface PipelineProject {
  name: string;
  stage: string;
  status: string;
  stageColor: string;
}

function extractPipelineProjects(projectsMd: string | null): PipelineProject[] {
  if (!projectsMd) return [];
  const projects: PipelineProject[] = [];
  const seen = new Set<string>();
  const sections = ['Active', 'FOUNDRY', 'Pipeline', 'Autonomous'];
  for (const section of sections) {
    const regex = new RegExp(`## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm');
    const match = projectsMd.search(regex);
    if (match === -1) continue;
    const rest = projectsMd.slice(match);
    const lines = rest.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^## /) || line.match(/^---\s*$/)) break;
      if (!line.startsWith('|') || line.includes('Codename') || line.match(/^\|[\s-|]+\|$/)) continue;
      if (line.startsWith('| —') || line.startsWith('|---')) continue;
      const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cols.length < 4) continue;
      const codename = cols[0].replace(/\*\*/g, '');
      if (seen.has(codename)) continue;
      seen.add(codename);
      const pdlc = cols[3] || '';
      if (pdlc.includes('ARCHIVED') || pdlc === '—') continue;
      const stageMatch = pdlc.match(/S(\d)/);
      const stageNum = stageMatch ? parseInt(stageMatch[1]) : 0;
      const stageColor =
        stageNum >= 7 ? 'bg-green-400' :
        stageNum >= 4 ? 'bg-blue-400' :
        stageNum >= 1 ? 'bg-purple-400' : 'bg-slate-400';
      const isPipeline = section === 'Pipeline';
      const statusIdx = isPipeline ? 5 : 4;
      projects.push({
        name: codename,
        stage: pdlc,
        status: cols[statusIdx] || '',
        stageColor,
      });
    }
  }
  return projects;
}

interface AgentInfo {
  name: string;
  role: string;
  status: string;
  activity: string;
}

function extractAgents(agentsMd: string | null): AgentInfo[] {
  if (!agentsMd) return [];
  const agents: AgentInfo[] = [];
  const rows = parseMarkdownTable(agentsMd);
  for (const row of rows) {
    if (row.cells.length >= 3) {
      agents.push({
        name: row.cells[0].replace(/\*\*/g, ''),
        role: row.cells[1] || '',
        status: row.cells[2] || '',
        activity: row.cells[3] || '',
      });
    }
  }
  if (agents.length === 0) {
    const pattern = /###?\s+(\w+)\s*(?:\(([^)]+)\))?/g;
    let match;
    while ((match = pattern.exec(agentsMd)) !== null) {
      const name = match[1];
      if (['Agent', 'Agents', 'Overview', 'Table'].includes(name)) continue;
      agents.push({ name, role: match[2] || '', status: 'active', activity: '' });
    }
  }
  return agents;
}

function getAgentTone(status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
  const lower = status.toLowerCase();
  if (lower.includes('active') || lower.includes('live') || lower.includes('running')) return 'success';
  if (lower.includes('blocked') || lower.includes('down') || lower.includes('fail')) return 'error';
  if (lower.includes('queue') || lower.includes('pending') || lower.includes('wait')) return 'warning';
  return 'neutral';
}

export default async function GrowthPage() {
  const [inbox, marketing, agentsMd, projectsMd, bandwidth] = await Promise.all([
    fetchCeoInbox(),
    fetchMarketing(),
    fetchAgentsMd(),
    fetchProjects(),
    fetchBandwidth(),
  ]);

  const pipelineProjects = extractPipelineProjects(projectsMd);
  const agents = extractAgents(agentsMd);

  const stageCounts = {
    live: pipelineProjects.filter((p) => p.stage.includes('S7') || p.stage.includes('S8')).length,
    build: pipelineProjects.filter((p) => p.stage.includes('S4') || p.stage.includes('S5') || p.stage.includes('S6')).length,
    early: pipelineProjects.filter((p) => p.stage.includes('S1') || p.stage.includes('S2') || p.stage.includes('S3')).length,
  };

  const activeAgents = agents.filter((a) => a.status.toLowerCase().includes('active')).length;

  // Velocity
  const velocityMetrics: { label: string; value: string }[] = [];
  if (inbox) {
    const actionItems = (inbox.match(/^[-*]\s/gm) || []).length;
    if (actionItems > 0) velocityMetrics.push({ label: 'Inbox Items', value: `${actionItems}` });
  }
  if (bandwidth) {
    const commitMatch = bandwidth.match(/commits?[:\s]+(\d+)/i);
    if (commitMatch) velocityMetrics.push({ label: 'Commits (24h)', value: commitMatch[1] });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-base font-medium text-slate-800">Growth</div>
          <div className="text-xs text-slate-400">
            Sources: COO_INBOX.md, MARKETING.md, PROJECTS.md, AGENTS.md
          </div>
        </div>
        <SignalPill label="ACTIVE" tone="success" />
      </div>

      {/* Hero MetricCards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Total Projects" value={pipelineProjects.length} color="blue" />
        <MetricCard label="Live / Growing" value={stageCounts.live} color="green" />
        <MetricCard label="Building" value={stageCounts.build} color="blue" />
        <MetricCard label="Discovery" value={stageCounts.early} color="purple" />
      </div>

      {/* Velocity row */}
      {velocityMetrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {velocityMetrics.map((v, i) => (
            <MetricCard key={i} label={v.label} value={v.value} color="cyan" />
          ))}
          <MetricCard label="Active Agents" value={activeAgents || agents.length} color="green" />
        </div>
      )}

      {/* Pipeline Projects — grouped by phase */}
      {pipelineProjects.length > 0 && (() => {
        const live = pipelineProjects.filter(p => p.stage.includes('S7') || p.stage.includes('S8'));
        const building = pipelineProjects.filter(p => p.stage.includes('S4') || p.stage.includes('S5') || p.stage.includes('S6'));
        const early = pipelineProjects.filter(p => p.stage.includes('S1') || p.stage.includes('S2') || p.stage.includes('S3'));

        const cleanStage = (s: string) => {
          const m = s.match(/S(\d)/);
          if (!m) return s;
          const labels: Record<string, string> = { '1': 'Discover', '2': 'Define', '3': 'Design', '4': 'Build', '5': 'Harden', '6': 'Pilot', '7': 'Launch', '8': 'Grow' };
          return `S${m[1]} ${labels[m[1]] || ''}`;
        };

        const ProjectRow = ({ proj }: { proj: PipelineProject }) => (
          <div className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${proj.stageColor}`} />
            <span className="text-sm font-medium text-slate-700 w-24 shrink-0">{proj.name}</span>
            <SignalPill label={cleanStage(proj.stage)} tone={proj.stageColor.includes('green') ? 'success' : proj.stageColor.includes('blue') ? 'info' : 'neutral'} />
            <span className="text-xs text-slate-400 truncate ml-auto">{proj.status.replace(/\*\*/g, '').slice(0, 50)}</span>
          </div>
        );

        const PhaseSection = ({ title, items, color }: { title: string; items: PipelineProject[]; color: string }) => (
          items.length > 0 ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold ${color} uppercase tracking-wide`}>{title}</span>
                <span className="text-xs text-slate-400">{items.length}</span>
              </div>
              <div>{items.map((p, i) => <ProjectRow key={i} proj={p} />)}</div>
            </div>
          ) : null
        );

        return (
          <SectionCard title="Project Pipeline" accent="blue" className="mb-6">
            <PhaseSection title="Live" items={live} color="text-green-600" />
            <PhaseSection title="Building" items={building} color="text-blue-600" />
            <PhaseSection title="Early Stage" items={early} color="text-purple-600" />
          </SectionCard>
        );
      })()}

      {/* Agent Activity as compact cards with SignalPills */}
      {agents.length > 0 && (
        <SectionCard title="Agent Activity" accent="green" className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((agent, i) => (
              <div key={i} className="border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-slate-800">{agent.name}</span>
                  <SignalPill label={agent.status || 'unknown'} tone={getAgentTone(agent.status)} />
                  <span className="text-xs text-slate-400 ml-auto">{agent.role}</span>
                </div>
                {agent.activity && (
                  <div className="text-xs text-slate-500 truncate">{agent.activity}</div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* COO Inbox — recent items only */}
      {inbox && (
        <SectionCard title="COO Inbox (Recent)" accent="cyan" className="mb-6">
          {(() => {
            const rows = parseMarkdownTable(inbox);
            if (rows.length > 0) {
              // Get headers
              const headerLine = inbox.split('\n').find(l => l.includes('|') && !l.match(/^\|[\s-|]+\|$/) && !l.match(/^\| —/));
              const headers = headerLine ? headerLine.split('|').map(c => c.trim()).filter(Boolean) : [];
              const displayRows = rows.slice(0, 10); // Cap at 10 rows
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    {headers.length > 1 && (
                      <thead>
                        <tr className="border-b border-slate-200">
                          {headers.map((h, hi) => (
                            <th key={hi} className="text-left text-xs text-slate-400 font-medium pb-2 pr-3">{h.replace(/\*\*/g, '')}</th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {displayRows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-50 last:border-0">
                          {row.cells.map((cell, ci) => (
                            <td key={ci} className={`py-1.5 pr-3 text-sm ${ci === 0 ? 'font-medium text-slate-700' : 'text-slate-500'}`}>
                              {cell.replace(/\*\*/g, '').slice(0, 60)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 10 && <div className="text-xs text-slate-400 mt-2">+{rows.length - 10} more items</div>}
                </div>
              );
            }
            const bullets = extractBulletItems(inbox);
            if (bullets.length > 0) {
              return (
                <div className="space-y-2">
                  {bullets.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="text-slate-600">{item}</span>
                    </div>
                  ))}
                </div>
              );
            }
            const lines = inbox.split('\n').filter((l) => l.trim() && !l.startsWith('#')).slice(0, 10);
            return (
              <div className="space-y-1.5">
                {lines.map((line, i) => (
                  <p key={i} className="text-sm text-slate-600">{line}</p>
                ))}
              </div>
            );
          })()}
        </SectionCard>
      )}

      {/* No data fallback */}
      {!inbox && !marketing && pipelineProjects.length === 0 && agents.length === 0 && (
        <div className="text-center py-10 text-slate-400">
          <div className="text-sm">No growth data available yet.</div>
          <div className="text-xs mt-1">Data will appear when COO_INBOX.md, MARKETING.md, or PROJECTS.md are populated.</div>
        </div>
      )}
    </div>
  );
}
