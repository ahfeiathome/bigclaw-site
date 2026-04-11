import { fetchAgentSystem, fetchTestHealth, fetchLatestCiRun } from '@/lib/github';
import { SectionCard, StatusDot } from '@/components/dashboard';

// Projects for test health table
const TEST_PROJECTS = [
  { name: 'GrovaKid', repo: 'learnie-ai' },
  { name: 'fatfrogmodels', repo: 'fatfrogmodels' },
  { name: 'iris-studio', repo: 'iris-studio' },
  { name: 'bigclaw-site', repo: 'bigclaw-site' },
];

function parseTestHealthRow(md: string | null, check: string): '✅' | '❌' | '⚠️' | '—' {
  if (!md) return '—';
  const line = md.split('\n').find(l => l.toLowerCase().includes(check.toLowerCase()));
  if (!line) return '—';
  if (line.includes('pass') || line.includes('✅')) return '✅';
  if (line.includes('FAIL') || line.includes('❌')) return '❌';
  if (line.includes('warn') || line.includes('⚠')) return '⚠️';
  return '—';
}

function cellColor(v: string) {
  if (v === '✅') return 'text-green-400';
  if (v === '❌') return 'text-red-400';
  if (v === '⚠️') return 'text-amber-400';
  return 'text-muted-foreground';
}

export default async function OrganizationPage() {
  const [agentMd, ...testHealthResults] = await Promise.all([
    fetchAgentSystem(),
    ...TEST_PROJECTS.map(p => Promise.all([fetchTestHealth(p.repo), fetchLatestCiRun(p.repo)])),
  ]);

  const testHealthData = TEST_PROJECTS.map((p, i) => {
    const [healthMd, ciRun] = testHealthResults[i] as [string | null, import('@/lib/github').GitHubCiRun | null];
    const ciStatus: '✅' | '❌' | '⚠️' | '—' = ciRun
      ? ciRun.conclusion === 'success' ? '✅' : ciRun.conclusion === 'failure' ? '❌' : '⚠️'
      : '—';
    return {
      name: p.name,
      lint: parseTestHealthRow(healthMd, 'lint'),
      types: parseTestHealthRow(healthMd, 'typescript'),
      unit: parseTestHealthRow(healthMd, 'unit'),
      build: parseTestHealthRow(healthMd, 'build'),
      e2e: parseTestHealthRow(healthMd, 'e2e'),
      ci: ciStatus,
      hasData: !!healthMd,
    };
  });

  const agents = agentMd ? agentMd.split('\n')
    .filter(l => l.startsWith('|') && l.includes('**') && !l.includes('Agent') && !l.match(/^\|[\s-:|]+\|$/))
    .map(l => { const c = l.split('|').map(s => s.trim()).filter(Boolean); return { name: c[0]?.replace(/\*/g, ''), title: c[1], model: c[2], duty: c[4], mode: c[5] }; }) : [];

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Organization</h1>
      <p className="text-sm text-muted-foreground mb-6">Company structure, roles, workflows, and documentation</p>

      {/* Company Structure */}
      <SectionCard title="Company Structure" className="mb-6">
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="rounded-lg border-2 border-primary bg-primary/10 px-6 py-3 text-center">
            <div className="text-sm font-bold text-primary">Michael Liu</div>
            <div className="text-[10px] text-muted-foreground">CEO / Founder</div>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex gap-8 items-start">
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-lg border border-green-500/50 bg-green-500/10 px-4 py-2 text-center">
                <div className="text-xs font-bold text-green-400">Code CLI</div>
                <div className="text-[10px] text-muted-foreground">3 sessions</div>
              </div>
              <div className="flex gap-3">
                {[
                  { name: 'lc-forge', products: 'GrovaKid, REHEARSAL' },
                  { name: 'lc-axiom', products: 'iris, fatfrog, FC, KT, SC, CX' },
                  { name: 'lc-bigclaw', products: 'Dashboard' },
                ].map(s => (
                  <div key={s.name} className="rounded border border-border bg-card px-2 py-1 text-center">
                    <div className="text-[10px] font-mono text-foreground">{s.name}</div>
                    <div className="text-[9px] text-muted-foreground">{s.products}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 px-4 py-2 text-center">
                <div className="text-xs font-bold text-blue-400">Pi5 Agents</div>
                <div className="text-[10px] text-muted-foreground">6 agents</div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-[300px]">
                {agents.map(a => (
                  <div key={a.name} className="rounded border border-border bg-card px-2 py-1 text-center">
                    <div className="text-[10px] font-bold text-foreground">{a.name}</div>
                    <div className="text-[9px] text-muted-foreground">{a.title}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-lg border border-purple-500/50 bg-purple-500/10 px-4 py-2 text-center">
                <div className="text-xs font-bold text-purple-400">Consultant</div>
                <div className="text-[10px] text-muted-foreground">Claude Chat</div>
              </div>
              <div className="rounded border border-border bg-card px-2 py-1 text-center">
                <div className="text-[10px] text-muted-foreground">Strategy, specs, audits</div>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Test Health */}
      <SectionCard title="Test Health — All Projects" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2.5 pl-3 pr-2">Project</th>
                <th className="text-center py-2.5 px-2">Lint</th>
                <th className="text-center py-2.5 px-2">Types</th>
                <th className="text-center py-2.5 px-2">Unit</th>
                <th className="text-center py-2.5 px-2">Build</th>
                <th className="text-center py-2.5 px-2">E2E</th>
                <th className="text-center py-2.5 pl-2 pr-3">CI</th>
              </tr>
            </thead>
            <tbody>
              {testHealthData.map((p, i) => (
                <tr key={p.name} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-2 pl-3 pr-2 text-foreground font-medium">
                    {p.name}
                    {!p.hasData && <span className="ml-1 text-[9px] text-muted-foreground/50">(no health file)</span>}
                  </td>
                  {(['lint', 'types', 'unit', 'build', 'e2e', 'ci'] as const).map(key => (
                    <td key={key} className={`py-2 px-2 text-center font-mono ${cellColor(p[key])}`}>{p[key]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 px-1">
          ✅ Passing · ❌ Failing · ⚠️ Stale/partial · — No data. Health files written by each session to <code>docs/status/test-health.md</code>.
        </p>
      </SectionCard>

      {/* Roles & Responsibilities */}
      <SectionCard title="Roles & Responsibilities" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2.5 pl-3 pr-2">Role</th>
                <th className="text-left py-2.5 px-2">Who</th>
                <th className="text-left py-2.5 px-2">Responsibilities</th>
                <th className="text-left py-2.5 pl-2 pr-3">Decisions</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['CEO', 'Michael Liu', 'Product vision, 💳 credit card gates, ⚖️ legal, 🧠 judgment calls', '💳 ⚖️ 🧠 ONLY'],
                ['Code CLI (lc-forge)', 'Felix', 'GrovaKid + REHEARSAL: code, tests, deploy', 'All engineering'],
                ['Code CLI (lc-axiom)', 'Axiom session', '6 products: code, tests, deploy', 'All engineering'],
                ['Code CLI (lc-bigclaw)', 'BigClaw session', 'Dashboard: specs, code, deploy, governance', 'Dashboard architecture'],
                ['Consultant', 'Claude Chat', 'Strategy, specs, audits, PRD/MRD writing', 'Spec prioritization'],
                ['Mika (COO)', 'Pi5 agent', 'Ops orchestrator, message routing, escalation', 'Agent coordination'],
                ['Koda (Dev Lead)', 'Pi5 agent', 'Code health: stale PRs, CI, npm vulns', 'Code quality alerts'],
                ['Sage (BDM)', 'Pi5 agent', 'Market intelligence, competitive research', 'Research priorities'],
                ['Rex (CFO)', 'Pi5 agent', 'RADAR trading, OpenRouter costs, daily P&L', 'Cost alerts'],
              ].map(([role, who, resp, decisions], i) => (
                <tr key={role} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-2 pl-3 pr-2 text-foreground font-medium">{role}</td>
                  <td className="py-2 px-2 text-muted-foreground">{who}</td>
                  <td className="py-2 px-2 text-muted-foreground">{resp}</td>
                  <td className="py-2 pl-2 pr-3 text-muted-foreground">{decisions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Daytime Workflow */}
      <SectionCard title="Daytime Operations (7am — 10pm)" className="mb-6">
        <div className="space-y-2 text-xs">
          {[
            { time: '7:00am', event: 'Morning Brain', detail: 'Reads overnight completions → writes 1-3 new specs' },
            { time: '8:00am', event: 'Michael opens Dashboard', detail: 'Reviews KPIs, action items, approvals' },
            { time: '9:00am', event: 'Code CLI sessions start', detail: 'Execute specs in priority order' },
            { time: '9:30am', event: 'Market opens', detail: 'RADAR 30-min trading cycles (paper)' },
            { time: 'Every 6h', event: 'Sage market scan', detail: 'Competitive intelligence for all products' },
            { time: '1:00pm', event: 'Rex EOD check', detail: 'OpenRouter balance + RADAR P&L' },
            { time: '4:00pm', event: 'Market closes', detail: 'RADAR stops trading' },
            { time: '10:00pm', event: 'Sessions end', detail: 'Auto-commit, logs, test results' },
          ].map(({ time, event, detail }) => (
            <div key={event} className="flex items-start gap-3">
              <span className="text-[10px] font-mono text-primary whitespace-nowrap w-16">{time}</span>
              <span className="text-foreground font-medium">{event}</span>
              <span className="text-muted-foreground">— {detail}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Nighttime Workflow */}
      <SectionCard title="Nighttime Operations (2am — 7am)" className="mb-6">
        <div className="space-y-2 text-xs">
          {[
            { time: '2:00am', event: 'Overnight Patrol', detail: 'Executes specs from OVERNIGHT_GOALS.md' },
            { time: '5:00am', event: 'Byte health check', detail: 'Pi5 disk/RAM/load → HEALTH.md' },
            { time: '6:00am', event: 'Koda GitHub health', detail: 'Stale PRs, failing CI → COO_INBOX.md' },
            { time: '6:00am', event: 'Sage market scan', detail: 'First daily competitive cycle' },
            { time: '7:00am', event: 'Morning Brain', detail: 'Reads overnight → generates today\'s specs' },
          ].map(({ time, event, detail }) => (
            <div key={event} className="flex items-start gap-3">
              <span className="text-[10px] font-mono text-primary whitespace-nowrap w-16">{time}</span>
              <span className="text-foreground font-medium">{event}</span>
              <span className="text-muted-foreground">— {detail}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Documentation */}
      <SectionCard title="Documentation Structure" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2 pl-3 pr-2">Location</th>
                <th className="text-left py-2 px-2">Contents</th>
                <th className="text-left py-2 pl-2 pr-3">Updated By</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['REGISTRY.md', 'Product stages, repos, revenue — source of truth', 'Code CLI'],
                ['founder/FOUNDER_TODO.md', '💳/⚖️/🧠 gates, action items', 'Consultant + CLI'],
                ['knowledge/', 'Market intel, SDLC process, cost model', 'Sage + Consultant'],
                ['growth/', 'Learnings (DEV-###), SDLC violations', 'Code CLI'],
                ['ops/', 'Daily costs, morning/overnight reports', 'Rex + crons'],
                ['docs/specs/', 'Execution briefs', 'Consultant → CLI'],
                ['<repo>/docs/product/', 'S1/S2/S3 docs, competitive log, PRD checklist', 'Code CLI + Sage'],
              ].map(([loc, contents, updatedBy], i) => (
                <tr key={loc} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-2 pl-3 pr-2 text-primary font-mono text-[10px]">{loc}</td>
                  <td className="py-2 px-2 text-muted-foreground">{contents}</td>
                  <td className="py-2 pl-2 pr-3 text-muted-foreground">{updatedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
