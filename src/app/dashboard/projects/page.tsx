import { fetchPatrolReport, fetchCompanyCheckpoint, fetchRepoFile, fetchLearnieHealth } from '@/lib/github';
import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';

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
    lines.push(`Blockers: ${blocked.map(p => `${p.name} \u2014 ${p.blocker}`).join('; ')}.`);
  } else {
    lines.push('No blockers across the portfolio. Clear to execute.');
  }

  if (checkpoint) {
    const todoCount = (checkpoint.match(/\u23F3/g) || []).length;
    const doneCount = (checkpoint.match(/\u2705 DONE/g) || []).length;
    if (todoCount > 0 || doneCount > 0) {
      lines.push(`Checkpoint: ${doneCount} CPs completed, ${todoCount} pending across all ventures.`);
    }
  }

  return lines;
}

function getProjectDotStatus(status: string): 'good' | 'warn' | 'bad' | 'neutral' {
  if (status === 'LIVE') return 'good';
  if (status === 'PAPER' || status === 'DESIGN') return 'warn';
  if (status === 'BUILD') return 'neutral';
  return 'neutral';
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Projects</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Expanded view of all BigClaw AI ventures \u00B7 sourced from CHECKPOINT.md + PATROL_REPORT.md
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusDot status="good" size="sm" />
          <span className="text-xs text-gray-400 font-mono">{PROJECTS.filter(p => p.status === 'LIVE').length} live</span>
        </div>
      </div>

      {/* Executive Summary */}
      <SectionCard title="Executive Summary" className="mb-6">
        <div className="space-y-1.5">
          {execLines.map((line, i) => (
            <p key={i} className="text-sm text-gray-500 leading-relaxed">{line}</p>
          ))}
        </div>
      </SectionCard>

      {/* Project Cards */}
      <div className="space-y-4">
        {PROJECTS.map((project) => {
          const cps = checkpoint ? extractCPsForProject(checkpoint, project.cpKeywords) : { todo: [], done: [] };

          return (
            <div key={project.name} className="animate-fade-in border border-gray-100 rounded-2xl bg-white shadow-sm transition-all duration-200 p-5">
              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <StatusDot status={getProjectDotStatus(project.status)} size="md" />
                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                <SignalPill
                  label={project.status}
                  tone={
                    project.status === 'LIVE' ? 'success' :
                    project.status === 'PAPER' ? 'warning' :
                    project.status === 'DESIGN' ? 'info' :
                    project.status === 'BUILD' ? 'info' :
                    'neutral'
                  }
                />
                {project.links?.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target={link.url.startsWith('/') ? undefined : '_blank'}
                    rel={link.url.startsWith('/') ? undefined : 'noopener noreferrer'}
                    className="text-xs text-blue-600 ml-auto no-underline hover:underline font-medium"
                  >
                    {link.label} \u2192
                  </a>
                ))}
              </div>

              {/* Description */}
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">{project.description}</p>

              {/* Phase + Blocker */}
              <div className="flex flex-wrap gap-4 mb-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 uppercase tracking-wide">Phase:</span>
                  <span className="font-mono text-gray-700">{project.phase}</span>
                </div>
                {project.blocker && (
                  <div className="flex items-center gap-1.5 border-l-2 border-amber-200 pl-3">
                    <span className="text-gray-400 uppercase tracking-wide">Blocker:</span>
                    <span className="text-amber-600 font-medium">{project.blocker}</span>
                  </div>
                )}
              </div>

              {/* CPs */}
              {(cps.todo.length > 0 || cps.done.length > 0) && (
                <div className="border-t border-gray-100 pt-3 mt-3">
                  <div className="flex gap-6 text-xs">
                    {cps.todo.length > 0 && (
                      <div>
                        <span className="text-blue-600 font-semibold">{cps.todo.length} TODO</span>
                        <div className="text-gray-400 mt-1 space-y-0.5">
                          {cps.todo.slice(0, 3).map((cp, i) => (
                            <div key={i} className="truncate max-w-[300px] font-mono">{cp}</div>
                          ))}
                          {cps.todo.length > 3 && <div className="font-mono">+{cps.todo.length - 3} more</div>}
                        </div>
                      </div>
                    )}
                    {cps.done.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-green-600 font-semibold">{cps.done.length} DONE</span>
                        <span className="text-green-600">\u2713</span>
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
