import { fetchPatrolReport, fetchCompanyCheckpoint, fetchCeoInbox, fetchAgentsMd, fetchProjects, fetchBandwidth } from '@/lib/github';
import { MetricCard, SectionCard, SignalPill, StatusDot } from '@/components/dashboard';

// ─── Shared helpers ──────────────────────────────────────────────────────────

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

function extractBulletItems(content: string): string[] {
  return content
    .split('\n')
    .filter((l) => l.match(/^[-*]\s/))
    .map((l) => l.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean);
}

// ─── Projects tab helpers ────────────────────────────────────────────────────

function extractCPsForProject(checkpoint: string, keywords: string[]): { todo: string[]; done: string[] } {
  const todo: string[] = [];
  const done: string[] = [];
  for (const line of checkpoint.split('\n')) {
    if (!line.includes('|') || !line.includes('CP-')) continue;
    const lower = line.toLowerCase();
    if (!keywords.some(k => lower.includes(k.toLowerCase()))) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    const label = cols[0] || '';
    if (line.includes('\u2705 DONE')) done.push(label);
    else if (line.includes('\u23F3')) todo.push(label);
  }
  return { todo, done };
}

interface ProjectData {
  name: string;
  status: string;
  phase: string;
  blocker: string;
  description: string;
  cpKeywords: string[];
  links?: { label: string; url: string }[];
}

const PROJECTS: ProjectData[] = [
  {
    name: 'Learnie AI',
    status: 'LIVE',
    phase: 'Pre-revenue \u00B7 233/233 tests passing',
    blocker: 'Stripe blocked on credit card',
    description: 'AI-powered K-5 tutoring platform. Print worksheets, scan answers, get personalized feedback and adaptive learning paths.',
    cpKeywords: ['learnie', 'TASK-'],
    links: [{ label: 'Live App', url: 'https://learnie-ai-ten.vercel.app' }],
  },
  {
    name: 'WINGMAN',
    status: 'QUEUE',
    phase: 'fatfrogmodels.com rebuild (CP-072\u2192076)',
    blocker: 'Blocked on Apple Dev ($99)',
    description: 'E-commerce site for Fat Frog Models. Full rebuild: foundation, catalog, admin panel, friend validation, DNS cutover.',
    cpKeywords: ['WINGMAN', 'fatfrog', 'CP-072', 'CP-073', 'CP-074', 'CP-075', 'CP-076'],
  },
  {
    name: 'RADAR',
    status: 'PAPER',
    phase: '3 signal feeds active \u00B7 Gate review ~May 2',
    blocker: 'Alpaca TOS review needed',
    description: 'Systematic trading engine with constitution-enforced risk management. PEAD + Momentum + BTD signal feeds. $100K paper capital.',
    cpKeywords: ['RADAR', 'CP-038', 'CP-090'],
    links: [{ label: 'RADAR Dashboard', url: '/dashboard/radar' }],
  },
  {
    name: 'FOUNDRY',
    status: 'QUEUE',
    phase: 'UI polish + market research (P2)',
    blocker: '',
    description: 'App factory \u2014 VAULT (receipt scan), VERDE (plant ID), TEMPO (calorie scan). Awaiting App Store category research before publish.',
    cpKeywords: ['FOUNDRY', 'CP-041', 'CP-077', 'VAULT', 'VERDE', 'TEMPO'],
  },
  {
    name: 'CLAW',
    status: 'LIVE',
    phase: 'bigclaw.com deployed on Vercel',
    blocker: 'DNS cutover pending',
    description: 'BigClaw AI company site + executive dashboard. Next.js on Vercel. Houses Felix Patrol, RADAR dashboard, and all project reporting.',
    cpKeywords: ['CLAW', 'bigclaw', 'CP-040'],
    links: [{ label: 'Live Site', url: 'https://bigclaw-site.vercel.app' }],
  },
  {
    name: 'PHOENIX',
    status: 'DESIGN',
    phase: 'OpenRouter built, pending API key',
    blocker: 'Michael creates OpenRouter account',
    description: 'Multi-model routing via OpenRouter. Per-agent model selection (Anthropic, Google, etc.) with privacy tiers. Phase I code ready.',
    cpKeywords: ['PHOENIX', 'OpenRouter'],
  },
];

function buildProjectsSummary(projects: ProjectData[], checkpoint: string | null): string[] {
  const lines: string[] = [];
  const live = projects.filter(p => p.status === 'LIVE');
  const building = projects.filter(p => p.status === 'BUILD' || p.status === 'PAPER' || p.status === 'DESIGN');
  const queued = projects.filter(p => p.status === 'QUEUE');
  if (live.length > 0) lines.push(`${live.length} project(s) live in production: ${live.map(p => p.name).join(', ')}.`);
  if (building.length > 0) lines.push(`${building.length} actively in development: ${building.map(p => `${p.name} (${p.status})`).join(', ')}.`);
  if (queued.length > 0) lines.push(`${queued.length} queued for build: ${queued.map(p => p.name).join(', ')}.`);
  const blocked = projects.filter(p => p.blocker);
  if (blocked.length > 0) lines.push(`Blockers: ${blocked.map(p => `${p.name} \u2014 ${p.blocker}`).join('; ')}.`);
  else lines.push('No blockers across the portfolio. Clear to execute.');
  if (checkpoint) {
    const todoCount = (checkpoint.match(/\u23F3/g) || []).length;
    const doneCount = (checkpoint.match(/\u2705 DONE/g) || []).length;
    if (todoCount > 0 || doneCount > 0) lines.push(`Checkpoint: ${doneCount} CPs completed, ${todoCount} pending across all ventures.`);
  }
  return lines;
}

function getProjectDotStatus(status: string): 'good' | 'warn' | 'bad' | 'neutral' {
  if (status === 'LIVE') return 'good';
  if (status === 'PAPER' || status === 'DESIGN') return 'warn';
  return 'neutral';
}

// ─── Growth (pipeline / agents / inbox) helpers ──────────────────────────────

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
  for (const section of ['Active', 'FOUNDRY', 'Pipeline', 'Autonomous']) {
    const regex = new RegExp(`## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm');
    const match = projectsMd.search(regex);
    if (match === -1) continue;
    const lines = projectsMd.slice(match).split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^## /) || line.match(/^---\s*$/)) break;
      if (!line.startsWith('|') || line.includes('Codename') || line.match(/^\|[\s-|]+\|$/)) continue;
      if (line.startsWith('| \u2014') || line.startsWith('|---')) continue;
      const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cols.length < 4) continue;
      const codename = cols[0].replace(/\*\*/g, '');
      if (seen.has(codename)) continue;
      seen.add(codename);
      const pdlc = cols[3] || '';
      if (pdlc.includes('ARCHIVED') || pdlc === '\u2014') continue;
      const stageMatch = pdlc.match(/S(\d)/);
      const stageNum = stageMatch ? parseInt(stageMatch[1]) : 0;
      const stageColor = stageNum >= 7 ? 'bg-green-500' : stageNum >= 4 ? 'bg-blue-500' : stageNum >= 1 ? 'bg-purple-500' : 'bg-gray-400';
      projects.push({ name: codename, stage: pdlc, status: cols[section === 'Pipeline' ? 5 : 4] || '', stageColor });
    }
  }
  return projects;
}

interface AgentInfo { name: string; role: string; status: string; activity: string }

function extractAgents(agentsMd: string | null): AgentInfo[] {
  if (!agentsMd) return [];
  const rows = parseMarkdownTable(agentsMd);
  const agents = rows
    .filter(r => r.cells.length >= 3)
    .map(r => ({ name: r.cells[0].replace(/\*\*/g, ''), role: r.cells[1] || '', status: r.cells[2] || '', activity: r.cells[3] || '' }));
  if (agents.length > 0) return agents;
  const pattern = /###?\s+(\w+)\s*(?:\(([^)]+)\))?/g;
  const fallback: AgentInfo[] = [];
  let m;
  while ((m = pattern.exec(agentsMd)) !== null) {
    if (['Agent', 'Agents', 'Overview', 'Table'].includes(m[1])) continue;
    fallback.push({ name: m[1], role: m[2] || '', status: 'active', activity: '' });
  }
  return fallback;
}

function agentTone(s: string): 'success' | 'warning' | 'error' | 'neutral' {
  const l = s.toLowerCase();
  if (l.includes('active') || l.includes('live') || l.includes('running')) return 'success';
  if (l.includes('blocked') || l.includes('down') || l.includes('fail')) return 'error';
  if (l.includes('queue') || l.includes('pending') || l.includes('wait')) return 'warning';
  return 'neutral';
}
function agentDot(s: string): 'good' | 'warn' | 'bad' | 'neutral' {
  const l = s.toLowerCase();
  if (l.includes('active') || l.includes('live') || l.includes('running')) return 'good';
  if (l.includes('blocked') || l.includes('down') || l.includes('fail')) return 'bad';
  if (l.includes('queue') || l.includes('pending') || l.includes('wait')) return 'warn';
  return 'neutral';
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProjectsPage() {
  const [, checkpoint, , inbox, agentsMd, projectsMd, bandwidth] = await Promise.all([
    fetchPatrolReport(),
    fetchCompanyCheckpoint(),
    Promise.resolve(null), // learnieHealth slot — unused here
    fetchCeoInbox(),
    fetchAgentsMd(),
    fetchProjects(),
    fetchBandwidth(),
  ]);

  const execLines = buildProjectsSummary(PROJECTS, checkpoint);
  const pipeline = extractPipelineProjects(projectsMd);
  const agents = extractAgents(agentsMd);

  const stageCounts = {
    live:  pipeline.filter(p => /S[78]/.test(p.stage)).length,
    build: pipeline.filter(p => /S[456]/.test(p.stage)).length,
    early: pipeline.filter(p => /S[123]/.test(p.stage)).length,
  };
  const activeAgents = agents.filter(a => a.status.toLowerCase().includes('active')).length;

  const velocityItems: { label: string; value: string }[] = [];
  if (inbox) {
    const n = (inbox.match(/^[-*]\s/gm) || []).length;
    if (n > 0) velocityItems.push({ label: 'Inbox Items', value: `${n}` });
  }
  if (bandwidth) {
    const m = bandwidth.match(/commits?[:\s]+(\d+)/i);
    if (m) velocityItems.push({ label: 'Commits (24h)', value: m[1] });
  }

  const cleanStage = (s: string) => {
    const m = s.match(/S(\d)/);
    if (!m) return s;
    const labels: Record<string, string> = { '1': 'Discover', '2': 'Define', '3': 'Design', '4': 'Build', '5': 'Harden', '6': 'Pilot', '7': 'Launch', '8': 'Grow' };
    return `S${m[1]} ${labels[m[1]] || ''}`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-foreground">Projects</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Portfolio view \u00B7 CHECKPOINT.md + PATROL_REPORT.md + PROJECTS.md
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status="good" size="sm" />
          <span className="text-xs text-muted-foreground font-mono">{PROJECTS.filter(p => p.status === 'LIVE').length} live</span>
        </div>
      </div>

      {/* Portfolio snapshot metrics */}
      {pipeline.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Total" value={pipeline.length} />
          <MetricCard label="Live / Grow" value={stageCounts.live} trend="up" />
          <MetricCard label="Building" value={stageCounts.build} trend="flat" />
          <MetricCard label="Discovery" value={stageCounts.early} />
          {velocityItems.map((v, i) => (
            <MetricCard key={i} label={v.label} value={v.value} trend="up" />
          ))}
          {(activeAgents > 0 || agents.length > 0) && (
            <MetricCard label="Active Agents" value={activeAgents || agents.length} trend="up" />
          )}
        </div>
      )}

      {/* Executive Summary */}
      <SectionCard title="Executive Summary" className="mb-6">
        <div className="space-y-1.5">
          {execLines.map((line, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{line}</p>
          ))}
        </div>
      </SectionCard>

      {/* Project Cards */}
      <div className="space-y-4 mb-6">
        {PROJECTS.map((project) => {
          const cps = checkpoint ? extractCPsForProject(checkpoint, project.cpKeywords) : { todo: [], done: [] };
          return (
            <div key={project.name} className="animate-fade-in border border-border rounded-2xl bg-card shadow-sm p-5">
              <div className="flex items-center gap-3 mb-3">
                <StatusDot status={getProjectDotStatus(project.status)} size="md" />
                <h3 className="font-semibold text-foreground">{project.name}</h3>
                <SignalPill
                  label={project.status}
                  tone={project.status === 'LIVE' ? 'success' : project.status === 'PAPER' ? 'warning' : project.status === 'DESIGN' ? 'info' : 'neutral'}
                />
                {project.links?.map((link) => (
                  <a key={link.url} href={link.url}
                    target={link.url.startsWith('/') ? undefined : '_blank'}
                    rel={link.url.startsWith('/') ? undefined : 'noopener noreferrer'}
                    className="text-xs text-blue-600 ml-auto no-underline hover:underline font-medium">
                    {link.label} →
                  </a>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{project.description}</p>
              <div className="flex flex-wrap gap-4 mb-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground uppercase tracking-wide">Phase:</span>
                  <span className="font-mono text-foreground/80">{project.phase}</span>
                </div>
                {project.blocker && (
                  <div className="flex items-center gap-1.5 border-l-2 border-amber-200 pl-3">
                    <span className="text-muted-foreground uppercase tracking-wide">Blocker:</span>
                    <span className="text-amber-600 font-medium">{project.blocker}</span>
                  </div>
                )}
              </div>
              {(cps.todo.length > 0 || cps.done.length > 0) && (
                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex gap-6 text-xs">
                    {cps.todo.length > 0 && (
                      <div>
                        <span className="text-blue-600 font-semibold">{cps.todo.length} TODO</span>
                        <div className="text-muted-foreground mt-1 space-y-0.5">
                          {cps.todo.slice(0, 3).map((cp, i) => <div key={i} className="truncate max-w-[300px] font-mono">{cp}</div>)}
                          {cps.todo.length > 3 && <div className="font-mono">+{cps.todo.length - 3} more</div>}
                        </div>
                      </div>
                    )}
                    {cps.done.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-green-600 font-semibold">{cps.done.length} DONE</span>
                        <span className="text-green-600">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pipeline — from PROJECTS.md (live data) */}
      {pipeline.length > 0 && (() => {
        const live  = pipeline.filter(p => /S[78]/.test(p.stage));
        const build = pipeline.filter(p => /S[456]/.test(p.stage));
        const early = pipeline.filter(p => /S[123]/.test(p.stage));

        const Row = ({ proj }: { proj: PipelineProject }) => (
          <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-muted rounded-lg px-2 transition-colors">
            <StatusDot status={proj.stageColor.includes('green') ? 'good' : proj.stageColor.includes('blue') ? 'neutral' : 'warn'} size="sm" />
            <span className="text-sm font-semibold text-foreground/80 w-24 shrink-0 font-mono">{proj.name}</span>
            <SignalPill label={cleanStage(proj.stage)} tone={proj.stageColor.includes('green') ? 'success' : proj.stageColor.includes('blue') ? 'info' : 'neutral'} />
            <span className="text-xs text-muted-foreground truncate ml-auto">{proj.status.replace(/\*\*/g, '').slice(0, 60)}</span>
          </div>
        );

        const Phase = ({ title, items, color, bg }: { title: string; items: PipelineProject[]; color: string; bg: string }) =>
          items.length > 0 ? (
            <div className="mb-4">
              <div className={`flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg ${bg}`}>
                <span className={`text-xs font-semibold ${color} uppercase tracking-wide`}>{title}</span>
                <span className="text-xs text-muted-foreground font-mono">{items.length}</span>
              </div>
              {items.map((p, i) => <Row key={i} proj={p} />)}
            </div>
          ) : null;

        return (
          <SectionCard title="Pipeline (PROJECTS.md)" className="mb-6">
            <Phase title="Live" items={live} color="text-green-600" bg="bg-green-50" />
            <Phase title="Building" items={build} color="text-blue-600" bg="bg-blue-50" />
            <Phase title="Early Stage" items={early} color="text-purple-600" bg="bg-purple-50" />
          </SectionCard>
        );
      })()}

      {/* Agent Activity */}
      {agents.length > 0 && (
        <SectionCard title="Agent Activity" className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((agent, i) => (
              <div key={i} className="border border-border rounded-2xl p-3.5 hover:shadow-sm transition-all bg-card">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <StatusDot status={agentDot(agent.status)} size="sm" />
                  <span className="text-sm font-semibold text-foreground">{agent.name}</span>
                  <SignalPill label={agent.status || 'unknown'} tone={agentTone(agent.status)} />
                </div>
                <div className="text-xs text-muted-foreground ml-5">{agent.role}</div>
                {agent.activity && <div className="text-xs text-muted-foreground truncate mt-1 ml-5">{agent.activity}</div>}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* COO Inbox */}
      {inbox && (
        <SectionCard title="COO Inbox (Recent)" className="mb-6">
          {(() => {
            const rows = parseMarkdownTable(inbox);
            if (rows.length > 0) {
              const headerLine = inbox.split('\n').find(l => l.includes('|') && !l.match(/^\|[\s-|]+\|$/) && !l.match(/^\| \u2014/));
              const headers = headerLine ? headerLine.split('|').map(c => c.trim()).filter(Boolean) : [];
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    {headers.length > 1 && (
                      <thead>
                        <tr className="border-b border-border bg-muted">
                          {headers.map((h, i) => (
                            <th key={i} className={`text-left text-xs text-muted-foreground font-medium pb-2.5 pt-2 pr-3 ${i === 0 ? 'pl-3' : ''}`}>
                              {h.replace(/\*\*/g, '')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {rows.slice(0, 10).map((row, i) => (
                        <tr key={i} className={`border-b border-gray-50 last:border-0 ${i % 2 === 1 ? 'bg-muted/50' : ''} hover:bg-blue-50/50 transition-colors`}>
                          {row.cells.map((cell, ci) => (
                            <td key={ci} className={`py-2 pr-3 text-sm ${ci === 0 ? 'font-medium text-foreground/80 pl-3' : 'text-muted-foreground'}`}>
                              {cell.replace(/\*\*/g, '').slice(0, 60)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 10 && <div className="text-xs text-muted-foreground mt-2 font-mono">+{rows.length - 10} more items</div>}
                </div>
              );
            }
            const bullets = extractBulletItems(inbox);
            if (bullets.length > 0) {
              return (
                <div className="space-y-2">
                  {bullets.slice(0, 10).map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm">
                      <StatusDot status="neutral" size="sm" />
                      <span className="text-muted-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              );
            }
            return (
              <div className="space-y-1.5">
                {inbox.split('\n').filter(l => l.trim() && !l.startsWith('#')).slice(0, 10).map((line, i) => (
                  <p key={i} className="text-sm text-muted-foreground">{line}</p>
                ))}
              </div>
            );
          })()}
        </SectionCard>
      )}
    </div>
  );
}
