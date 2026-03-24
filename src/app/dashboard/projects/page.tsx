import { fetchPatrolReport, fetchCompanyCheckpoint, fetchRepoFile, fetchLearnieHealth } from '@/lib/github';

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

function extractCPsForProject(checkpoint: string, keywords: string[]): { todo: string[]; done: string[] } {
  const todo: string[] = [];
  const done: string[] = [];
  for (const line of checkpoint.split('\n')) {
    if (!line.includes('|') || !line.includes('CP-')) continue;
    const lower = line.toLowerCase();
    if (!keywords.some(k => lower.includes(k.toLowerCase()))) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    const label = cols[0] || '';
    if (line.includes('✅ DONE')) done.push(label);
    else if (line.includes('⏳')) todo.push(label);
  }
  return { todo, done };
}

interface ProjectData {
  name: string;
  status: string;
  phase: string;
  blocker: string;
  color: string;
  accentColor: string;
  description: string;
  cpKeywords: string[];
  links?: { label: string; url: string }[];
}

const PROJECTS: ProjectData[] = [
  {
    name: 'Learnie AI',
    status: 'LIVE',
    phase: 'Pre-revenue · 233/233 tests passing',
    blocker: 'Stripe blocked on credit card',
    color: 'bg-green-400',
    accentColor: 'text-green-400',
    description: 'AI-powered K-5 tutoring platform. Print worksheets, scan answers, get personalized feedback and adaptive learning paths.',
    cpKeywords: ['learnie', 'TASK-'],
    links: [{ label: 'Live App', url: 'https://learnie-ai-ten.vercel.app' }],
  },
  {
    name: 'WINGMAN',
    status: 'QUEUE',
    phase: 'fatfrogmodels.com rebuild (CP-072→076)',
    blocker: 'Blocked on Apple Dev ($99)',
    color: 'bg-zinc-500',
    accentColor: 'text-zinc-400',
    description: 'E-commerce site for Fat Frog Models. Full rebuild: foundation, catalog, admin panel, friend validation, DNS cutover.',
    cpKeywords: ['WINGMAN', 'fatfrog', 'CP-072', 'CP-073', 'CP-074', 'CP-075', 'CP-076'],
  },
  {
    name: 'RADAR',
    status: 'PAPER',
    phase: '3 signal feeds active · Gate review ~May 2',
    blocker: 'Alpaca TOS review needed',
    color: 'bg-cyan-400',
    accentColor: 'text-cyan-400',
    description: 'Systematic trading engine with constitution-enforced risk management. PEAD + Momentum + BTD signal feeds. $100K paper capital.',
    cpKeywords: ['RADAR', 'CP-038', 'CP-090'],
    links: [{ label: 'RADAR Dashboard', url: '/dashboard/radar' }],
  },
  {
    name: 'FOUNDRY',
    status: 'QUEUE',
    phase: 'UI polish + market research (P2)',
    blocker: '',
    color: 'bg-zinc-500',
    accentColor: 'text-zinc-400',
    description: 'App factory — VAULT (receipt scan), VERDE (plant ID), TEMPO (calorie scan). Awaiting App Store category research before publish.',
    cpKeywords: ['FOUNDRY', 'CP-041', 'CP-077', 'VAULT', 'VERDE', 'TEMPO'],
  },
  {
    name: 'CLAW',
    status: 'LIVE',
    phase: 'bigclaw.com deployed on Vercel',
    blocker: 'DNS cutover pending',
    color: 'bg-green-400',
    accentColor: 'text-green-400',
    description: 'BigClaw AI company site + executive dashboard. Next.js on Vercel. Houses Felix Patrol, RADAR dashboard, and all project reporting.',
    cpKeywords: ['CLAW', 'bigclaw', 'CP-040'],
    links: [{ label: 'Live Site', url: 'https://bigclaw-site.vercel.app' }],
  },
  {
    name: 'PHOENIX',
    status: 'DESIGN',
    phase: 'OpenRouter built, pending API key',
    blocker: 'Michael creates OpenRouter account',
    color: 'bg-purple-400',
    accentColor: 'text-purple-400',
    description: 'Multi-model routing via OpenRouter. Per-agent model selection (Anthropic, Google, etc.) with privacy tiers. Phase I code ready.',
    cpKeywords: ['PHOENIX', 'OpenRouter'],
  },
];

function buildProjectsSummary(projects: ProjectData[], checkpoint: string | null): string[] {
  const lines: string[] = [];

  const live = projects.filter(p => p.status === 'LIVE');
  const building = projects.filter(p => p.status === 'BUILD' || p.status === 'PAPER' || p.status === 'DESIGN');
  const queued = projects.filter(p => p.status === 'QUEUE');

  if (live.length > 0) {
    lines.push(`${live.length} project(s) live in production: ${live.map(p => p.name).join(', ')}.`);
  }
  if (building.length > 0) {
    lines.push(`${building.length} actively in development: ${building.map(p => `${p.name} (${p.status})`).join(', ')}.`);
  }
  if (queued.length > 0) {
    lines.push(`${queued.length} queued for build: ${queued.map(p => p.name).join(', ')}.`);
  }

  const blocked = projects.filter(p => p.blocker);
  if (blocked.length > 0) {
    lines.push(`Blockers: ${blocked.map(p => `${p.name} — ${p.blocker}`).join('; ')}.`);
  } else {
    lines.push('No blockers across the portfolio. Clear to execute.');
  }

  // CP summary from checkpoint
  if (checkpoint) {
    const todoCount = (checkpoint.match(/⏳/g) || []).length;
    const doneCount = (checkpoint.match(/✅ DONE/g) || []).length;
    if (todoCount > 0 || doneCount > 0) {
      lines.push(`Checkpoint: ${doneCount} CPs completed, ${todoCount} pending across all ventures.`);
    }
  }

  return lines;
}

export default async function ProjectsPage() {
  const [patrolReport, checkpoint, learnieHealth] = await Promise.all([
    fetchPatrolReport(),
    fetchCompanyCheckpoint(),
    fetchLearnieHealth(),
  ]);

  const execLines = buildProjectsSummary(PROJECTS, checkpoint);

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Projects</h2>
      <p className="text-xs text-muted mb-6">
        Expanded view of all BigClaw AI ventures · sourced from CHECKPOINT.md + PATROL_REPORT.md
      </p>

      <div className="border border-slate-200 rounded-xl shadow-md p-5 mb-6 bg-gradient-to-r from-slate-50 to-white">
        <div className="text-xs font-semibold text-accent uppercase tracking-wide mb-3">Executive Summary</div>
        <div className="space-y-1.5">
          {execLines.map((line, i) => (
            <p key={i} className="text-xs text-foreground/80 leading-relaxed">{line}</p>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {PROJECTS.map((project) => {
          const cps = checkpoint ? extractCPsForProject(checkpoint, project.cpKeywords) : { todo: [], done: [] };
          const statusColor =
            project.status === 'LIVE' ? 'bg-green-400' :
            project.status === 'PAPER' ? 'bg-cyan-400' :
            project.status === 'DESIGN' ? 'bg-purple-400' :
            project.status === 'BUILD' ? 'bg-blue-400' : 'bg-zinc-500';

          return (
            <div key={project.name} className="border border-slate-200 rounded-xl shadow-md bg-white hover:shadow-lg transition-shadow p-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`} />
                <h3 className="font-semibold">{project.name}</h3>
                <span className="text-[10px] font-mono text-muted px-2 py-0.5 border border-slate-200 rounded">
                  {project.status}
                </span>
                {project.links?.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target={link.url.startsWith('/') ? undefined : '_blank'}
                    rel={link.url.startsWith('/') ? undefined : 'noopener noreferrer'}
                    className="text-xs text-accent ml-auto no-underline hover:underline"
                  >
                    {link.label} →
                  </a>
                ))}
              </div>

              {/* Description */}
              <p className="text-xs text-foreground/70 mb-3">{project.description}</p>

              {/* Phase + Blocker */}
              <div className="flex flex-wrap gap-4 mb-3 text-xs">
                <div>
                  <span className="text-muted">Phase: </span>
                  <span className="font-mono">{project.phase}</span>
                </div>
                {project.blocker && (
                  <div>
                    <span className="text-muted">Blocker: </span>
                    <span className="text-amber-600">{project.blocker}</span>
                  </div>
                )}
              </div>

              {/* CPs */}
              {(cps.todo.length > 0 || cps.done.length > 0) && (
                <div className="border-t border-slate-200 pt-3 mt-3">
                  <div className="flex gap-6 text-xs">
                    {cps.todo.length > 0 && (
                      <div>
                        <span className="text-accent font-semibold">{cps.todo.length} TODO</span>
                        <div className="text-muted mt-1 space-y-0.5">
                          {cps.todo.slice(0, 3).map((cp, i) => (
                            <div key={i} className="truncate max-w-[300px]">{cp}</div>
                          ))}
                          {cps.todo.length > 3 && <div>+{cps.todo.length - 3} more</div>}
                        </div>
                      </div>
                    )}
                    {cps.done.length > 0 && (
                      <div>
                        <span className="text-green-600 font-semibold">{cps.done.length} DONE</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
