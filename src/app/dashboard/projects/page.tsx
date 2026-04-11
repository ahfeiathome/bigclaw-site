export const dynamic = 'force-dynamic';

import { fetchAgentsMd, fetchProjects, fetchBandwidth, fetchIssuesSnapshot, fetchAllIssues, fetchRecentClosedIssues } from '@/lib/github';
import type { GitHubIssue } from '@/lib/github';
import { MetricCard, SectionCard, SignalPill, StatusDot, TaskFlowWidget, EventStreamWidget } from '@/components/dashboard';

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

interface ProjectData {
  name: string;
  company: 'Forge' | 'Axiom';
  status: string;
  phase: string;
  blocker: string;
  description: string;
  links?: { label: string; url: string }[];
}

const PROJECTS: ProjectData[] = [
  // ── Forge (AGENTS architecture) ──
  {
    name: 'GrovaKid',
    company: 'Forge',
    status: 'LIVE',
    phase: 'Pre-revenue',
    blocker: 'Co-founder agreement gates Stripe',
    description: 'AI-powered K-5 tutoring platform. Print worksheets, scan answers, get personalized feedback and adaptive learning paths.',
    links: [{ label: 'Live App', url: 'https://learnie-ai-ten.vercel.app' }],
  },
  {
    name: 'BigClaw Dashboard',
    company: 'Forge',
    status: 'LIVE',
    phase: 'Active development',
    blocker: '',
    description: 'Executive dashboard for BigClaw AI. Felix Patrol, RADAR dashboard, project reporting, finance tracking.',
    links: [{ label: 'Dashboard', url: 'https://bigclaw-site.vercel.app/dashboard' }],
  },
  // ── Axiom (CODE_ONLY architecture) ──
  {
    name: 'RADAR',
    company: 'Axiom',
    status: 'PAPER',
    phase: '3 signal feeds active',
    blocker: 'Alpaca TOS review needed',
    description: 'Systematic trading engine with constitution-enforced risk management. PEAD + Momentum + BTD signal feeds. $100K paper capital.',
    links: [{ label: 'RADAR Dashboard', url: '/dashboard/radar' }],
  },
  {
    name: 'iris-studio',
    company: 'Axiom',
    status: 'SPEC',
    phase: 'Pre-build — spec complete',
    blocker: '',
    description: 'AI art generation and sales platform. Stripe revenue model.',
  },
  {
    name: 'fatfrogmodels',
    company: 'Axiom',
    status: 'LIVE',
    phase: 'Maintenance',
    blocker: '',
    description: 'E-commerce site for Fat Frog Models. Catalog, admin panel, bulk import.',
    links: [{ label: 'Live Site', url: 'https://fatfrogmodels.vercel.app' }],
  },
  {
    name: 'FairConnect',
    company: 'Axiom',
    status: 'SETUP',
    phase: 'Initial setup',
    blocker: '',
    description: 'Fair pricing and connection platform. Apple IAP revenue model.',
  },
  {
    name: 'KeepTrack',
    company: 'Axiom',
    status: 'SETUP',
    phase: 'Initial setup',
    blocker: '',
    description: 'Personal tracking and accountability app. Apple IAP revenue model.',
  },
  {
    name: 'SubCheck',
    company: 'Axiom',
    status: 'SETUP',
    phase: 'Initial setup',
    blocker: '',
    description: 'Subscription management and audit tool. Apple IAP revenue model.',
  },
];

function buildProjectsSummary(projects: ProjectData[]): string[] {
  const lines: string[] = [];
  const forgeProjects = projects.filter(p => p.company === 'Forge');
  const axiomProjects = projects.filter(p => p.company === 'Axiom');
  const live = projects.filter(p => p.status === 'LIVE');
  const building = projects.filter(p => p.status === 'BUILD' || p.status === 'PAPER' || p.status === 'SPEC');
  const setup = projects.filter(p => p.status === 'SETUP');
  lines.push(`Forge: ${forgeProjects.length} products (AGENTS architecture). Axiom: ${axiomProjects.length} products (CODE_ONLY).`);
  if (live.length > 0) lines.push(`${live.length} live in production: ${live.map(p => p.name).join(', ')}.`);
  if (building.length > 0) lines.push(`${building.length} in development: ${building.map(p => `${p.name} (${p.status})`).join(', ')}.`);
  if (setup.length > 0) lines.push(`${setup.length} in setup: ${setup.map(p => p.name).join(', ')}.`);
  const blocked = projects.filter(p => p.blocker);
  if (blocked.length > 0) lines.push(`Blockers: ${blocked.map(p => `${p.name} \u2014 ${p.blocker}`).join('; ')}.`);
  else lines.push('No blockers across the portfolio. Clear to execute.');
  return lines;
}

function getProjectDotStatus(status: string): 'good' | 'warn' | 'bad' | 'neutral' {
  if (status === 'LIVE') return 'good';
  if (status === 'PAPER' || status === 'SPEC') return 'warn';
  if (status === 'SETUP') return 'neutral';
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
  for (const section of ['Active', 'Forge', 'Axiom', 'Pipeline', 'Autonomous']) {
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
  const [agentsMd, projectsMd, bandwidth, forgeSnapshot, allIssues, closedIssues] = await Promise.all([
    fetchAgentsMd(),
    fetchProjects(),
    fetchBandwidth(),
    fetchIssuesSnapshot('the-firm'),
    fetchAllIssues(),
    fetchRecentClosedIssues(7),
  ]);

  const execLines = buildProjectsSummary(PROJECTS);
  const pipeline = extractPipelineProjects(projectsMd);
  const agents = extractAgents(agentsMd);

  const stageCounts = {
    live:  pipeline.filter(p => /S[78]/.test(p.stage)).length,
    build: pipeline.filter(p => /S[456]/.test(p.stage)).length,
    early: pipeline.filter(p => /S[123]/.test(p.stage)).length,
  };
  const activeAgents = agents.filter(a => a.status.toLowerCase().includes('active')).length;

  const velocityItems: { label: string; value: string }[] = [];
  if (forgeSnapshot) {
    const issueLines = forgeSnapshot.split('\n').filter(l => l.startsWith('- ['));
    if (issueLines.length > 0) velocityItems.push({ label: 'Tracked Issues', value: `${issueLines.length}` });
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
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Projects</h1>
            <span className="text-xs text-muted-foreground font-mono mt-1">Last updated: {new Date().toISOString().slice(0, 10)}</span>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="good" size="sm" />
            <span className="text-xs text-muted-foreground font-mono">{PROJECTS.filter(p => p.status === 'LIVE').length} live</span>
          </div>
        </div>
        <div className="text-lg font-semibold text-foreground font-mono">{PROJECTS.length} products &middot; {PROJECTS.filter(p => p.company === 'Forge').length} Forge &middot; {PROJECTS.filter(p => p.company === 'Axiom').length} Axiom</div>
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

      {/* Project Cards — grouped by company */}
      {(['Forge', 'Axiom'] as const).map((company) => {
        const companyProjects = PROJECTS.filter(p => p.company === company);
        return (
          <div key={company} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-sm font-semibold uppercase tracking-wide ${company === 'Forge' ? 'text-green-600' : 'text-blue-600'}`}>
                {company}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                {company === 'Forge' ? 'AGENTS' : 'CODE_ONLY'} &middot; {companyProjects.length} products
              </span>
            </div>
            <div className="space-y-4">
              {companyProjects.map((project) => (
                <div key={project.name} className="animate-fade-in border border-border rounded-2xl bg-card shadow-sm p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <StatusDot status={getProjectDotStatus(project.status)} size="md" />
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    <SignalPill
                      label={project.status}
                      tone={project.status === 'LIVE' ? 'success' : project.status === 'PAPER' || project.status === 'SPEC' ? 'warning' : 'neutral'}
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
                  <div className="flex flex-wrap gap-4 text-xs">
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
                </div>
              ))}
            </div>
          </div>
        );
      })}

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

      {/* Open Issues (full list, grouped by company) */}
      {allIssues.length > 0 && (
        <SectionCard title="Open Issues" className="mb-6" action={<a href="https://github.com/users/ahfeiathome/projects/1" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline no-underline">Board &rarr;</a>}>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {allIssues.slice(0, 25).map((issue: GitHubIssue) => (
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
        </SectionCard>
      )}

      {/* Task Flow + Event Stream */}
      {(() => {
        const inProgressLabels = ['in progress', 'in-progress', 'wip'];
        const backlogLabels = ['backlog', 'later', 'icebox'];
        const todoIssues = allIssues.filter((i: GitHubIssue) => !i.labels.some(l => inProgressLabels.includes(l.toLowerCase())) && !i.labels.some(l => backlogLabels.includes(l.toLowerCase())));
        const inProgressIssues = allIssues.filter((i: GitHubIssue) => i.labels.some(l => inProgressLabels.includes(l.toLowerCase())));
        const backlogIssues = allIssues.filter((i: GitHubIssue) => i.labels.some(l => backlogLabels.includes(l.toLowerCase())));
        const taskFlowColumns = [
          { label: 'Todo', count: todoIssues.length, items: todoIssues.map(i => ({ repo: i.repo, number: i.number, title: i.title, labels: i.labels, url: i.url })) },
          { label: 'In Progress', count: inProgressIssues.length, items: inProgressIssues.map(i => ({ repo: i.repo, number: i.number, title: i.title, labels: i.labels, url: i.url })) },
          { label: 'Done', count: closedIssues.length, items: closedIssues.map(i => ({ repo: i.repo, number: i.number, title: i.title, labels: i.labels, url: i.url })) },
          { label: 'Backlog', count: backlogIssues.length, items: backlogIssues.map(i => ({ repo: i.repo, number: i.number, title: i.title, labels: i.labels, url: i.url })) },
        ];

        type EventAction = 'opened' | 'closed' | 'updated';
        const eventStream: { repo: string; number: number; title: string; action: EventAction; timestamp: string; url: string }[] = [];
        for (const issue of closedIssues) {
          eventStream.push({ repo: issue.repo, number: issue.number, title: issue.title, action: 'closed', timestamp: issue.updatedAt, url: issue.url });
        }
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000; // eslint-disable-line react-hooks/purity
        for (const issue of allIssues) {
          const created = new Date(issue.createdAt).getTime();
          const updated = new Date(issue.updatedAt).getTime();
          if (created > sevenDaysAgo) eventStream.push({ repo: issue.repo, number: issue.number, title: issue.title, action: 'opened', timestamp: issue.createdAt, url: issue.url });
          else if (updated > sevenDaysAgo) eventStream.push({ repo: issue.repo, number: issue.number, title: issue.title, action: 'updated', timestamp: issue.updatedAt, url: issue.url });
        }
        eventStream.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return (
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <TaskFlowWidget columns={taskFlowColumns} />
            <EventStreamWidget events={eventStream.slice(0, 30)} />
          </div>
        );
      })()}
    </div>
  );
}
