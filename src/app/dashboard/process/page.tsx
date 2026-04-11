import { SectionCard } from '@/components/dashboard';
import { DevFlowChart } from '@/components/dev-flow-chart';
import Link from 'next/link';

export default function ProcessPage() {
  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Process</h1>
      <p className="text-sm text-muted-foreground mb-6">PDLC, SDLC, testing, cron, and interactive flows</p>

      {/* PDLC Stages */}
      <SectionCard title="PDLC Stages (Product Development Lifecycle)" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2 pl-3 pr-2">Stage</th>
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 pl-2 pr-3">What It Means</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['S1', 'DISCOVER', 'Competitive research complete. Go/no-go decision made.'],
                ['S2', 'DEFINE', 'Market Requirements Document (MRD) written. Problem and positioning defined.'],
                ['S3', 'DESIGN', 'Product Requirements Document (PRD) written. Architecture decided.'],
                ['S4', 'BUILD', 'Code is being written. Features in development.'],
                ['S5', 'HARDEN', 'Polish, testing, App Store readiness.'],
                ['S6', 'PILOT', 'TestFlight / beta with real users.'],
                ['S7', 'LAUNCH', 'Production. Payment live. Real customers.'],
                ['S8', 'GROW', 'Revenue growth, iteration, monitoring.'],
              ].map(([stage, name, desc], i) => (
                <tr key={stage} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-2 pl-3 pr-2 font-mono font-bold text-primary">{stage}</td>
                  <td className="py-2 px-2 text-foreground font-medium">{name}</td>
                  <td className="py-2 pl-2 pr-3 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* SDLC Process */}
      <SectionCard title="SDLC — Software Development Lifecycle" className="mb-6">
        <p className="text-xs text-muted-foreground mb-3">Every code change follows this 8-stage pipeline. No exceptions.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2 pl-3 pr-2">Stage</th>
                <th className="text-left py-2 px-2">Who</th>
                <th className="text-left py-2 px-2">Gate</th>
                <th className="text-left py-2 pl-2 pr-3">Tool</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['1. Plan', 'Consultant', 'Spec exists in docs/specs/', 'Claude Chat'],
                ['2. Code', 'Code CLI', 'Feature branch created', 'git branch'],
                ['3. Test', 'Code CLI', 'All tests pass (lint, types, unit, build, E2E)', 'vitest + playwright'],
                ['4. Review', 'Code CLI', 'PR created, CI passes', 'GitHub Actions'],
                ['5. Merge', 'Code CLI', 'CI green, review done', 'gh pr merge'],
                ['6. Deploy', 'Vercel', 'Preview verified first', 'Vercel auto-deploy'],
                ['7. Verify', 'Code CLI', 'Live URL checked, screenshot taken', 'Playwright'],
                ['8. Close', 'Code CLI', 'Issue closed with evidence', 'GitHub Issues'],
              ].map(([stage, who, gate, tool], i) => (
                <tr key={stage} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-2 pl-3 pr-2 text-foreground font-medium">{stage}</td>
                  <td className="py-2 px-2 text-muted-foreground">{who}</td>
                  <td className="py-2 px-2 text-muted-foreground">{gate}</td>
                  <td className="py-2 pl-2 pr-3 text-muted-foreground font-mono text-[10px]">{tool}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Test Flow */}
      <SectionCard title="Test Flow" className="mb-6">
        <p className="text-xs text-muted-foreground mb-3">Quality gate before every merge. Runs locally and in CI.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2 pl-3 pr-2">Step</th>
                <th className="text-left py-2 px-2">Command</th>
                <th className="text-left py-2 px-2">What It Checks</th>
                <th className="text-left py-2 pl-2 pr-3">Blocks Merge?</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['1. TypeScript', 'npx tsc --noEmit', 'Type errors across all files', 'Yes'],
                ['2. Lint', 'npx next lint', 'ESLint rules, import order, unused vars', 'Yes'],
                ['3. Unit Tests', 'npx vitest run', 'Component + utility tests', 'Yes'],
                ['4. Build', 'npx next build', 'Full production build succeeds', 'Yes'],
                ['5. E2E', 'npx playwright test', 'Browser tests on preview URL', 'Yes (when configured)'],
                ['6. Gemini Review', 'GitHub Actions', 'AI code review on PR diff', 'Advisory'],
              ].map(([step, cmd, checks, blocks], i) => (
                <tr key={step} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-2 pl-3 pr-2 text-foreground font-medium">{step}</td>
                  <td className="py-2 px-2 text-muted-foreground font-mono text-[10px]">{cmd}</td>
                  <td className="py-2 px-2 text-muted-foreground">{checks}</td>
                  <td className="py-2 pl-2 pr-3">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${blocks === 'Yes' ? 'bg-red-500/20 text-red-400' : blocks === 'Advisory' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {blocks}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Cron (Auto) Flow */}
      <SectionCard title="Cron (Auto) Flow" className="mb-6">
        <p className="text-xs text-muted-foreground mb-3">Automated tasks that run on schedule without human intervention.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2 pl-3 pr-2">Schedule</th>
                <th className="text-left py-2 px-2">Task</th>
                <th className="text-left py-2 px-2">Agent</th>
                <th className="text-left py-2 pl-2 pr-3">Output</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Every PR', 'CI Pipeline (lint + types + test + build)', 'GitHub Actions', 'PR status check'],
                ['Every PR', 'Gemini Code Review', 'GitHub Actions', 'PR comment with findings'],
                ['6:00 AM', 'Gemini E2E Validation', 'Gemini + Playwright', 'ops/gemini/VALIDATION_REPORT.md'],
                ['Overnight', 'Agent Patrol (spec sweep, issue triage)', 'lc-forge / lc-axiom', 'ACTIVE_SESSIONS.md'],
                ['On deploy', 'Vercel auto-deploy from main', 'Vercel', 'Production URL live'],
              ].map(([schedule, task, agent, output], i) => (
                <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-2 pl-3 pr-2 text-foreground font-medium">{schedule}</td>
                  <td className="py-2 px-2 text-muted-foreground">{task}</td>
                  <td className="py-2 px-2 text-muted-foreground">{agent}</td>
                  <td className="py-2 pl-2 pr-3 text-muted-foreground font-mono text-[10px]">{output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Development Flow */}
      <SectionCard title="Development Flow" className="mb-6">
        <p className="text-xs text-muted-foreground mb-4">The complete pipeline from research to verified. Each box represents a document, tool, or process.</p>
        <DevFlowChart />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground mt-6">
          <div>
            <div className="font-semibold text-foreground mb-2">Research Phase (S1-S2)</div>
            <p>Sage runs competitive analysis → Consultant writes MRD → PRD Checklist and Test Matrix are derived from MRD. Competitive Log updated weekly by Sage.</p>
          </div>
          <div>
            <div className="font-semibold text-foreground mb-2">Design Phase</div>
            <p>/brainstorm explores context, proposes 2-3 approaches, saves design spec. /write-plan breaks the spec into TDD tasks (2-5 min each) mapped to PRD items.</p>
          </div>
          <div>
            <div className="font-semibold text-foreground mb-2">Build Phase (TDD)</div>
            <p>/execute-plan runs tasks. Each task: RED (write failing test) → GREEN (minimal code to pass) → REFACTOR → COMMIT. Updates PRD Checklist when items are Done.</p>
          </div>
          <div>
            <div className="font-semibold text-foreground mb-2">Verification Phase</div>
            <p>CI on every PR. Gemini browser-tests the live site at 6am daily. Michael reviews on phone. All three must pass before an item is marked ✅ Verified in the Test Matrix.</p>
          </div>
          <div>
            <div className="font-semibold text-foreground mb-2">Bug Loop</div>
            <p>Any bug found triggers: fix → add regression test row to Test Matrix → CI confirms fix → back to Gemini + Michael verification. Test matrix only grows, never shrinks.</p>
          </div>
        </div>
        <div className="mt-4">
          <Link
            href="https://github.com/ahfeiathome/bigclaw-ai/blob/main/knowledge/UNIFIED_DEV_FLOW.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary hover:underline"
          >
            View documentation (UNIFIED_DEV_FLOW.md) →
          </Link>
        </div>
      </SectionCard>

      {/* Interactive Flow */}
      <SectionCard title="Interactive Flow" className="mb-6">
        <p className="text-xs text-muted-foreground mb-3">Human-triggered sessions where Michael or an agent initiates work.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2 pl-3 pr-2">Trigger</th>
                <th className="text-left py-2 px-2">Flow</th>
                <th className="text-left py-2 px-2">Who Runs It</th>
                <th className="text-left py-2 pl-2 pr-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Michael opens Claude Code', 'Session start -> read specs -> execute pipeline', 'Code CLI (lc-bigclaw)', 'Feature shipped + verified'],
                ['Michael writes a spec', 'Spec placed in docs/specs/ -> next session picks it up', 'Consultant -> Code CLI', 'Spec executed end-to-end'],
                ['Michael reports a bug', 'GitHub Issue created -> Code CLI picks up on next session', 'Code CLI', 'Bug fixed + regression test added'],
                ['Michael approves gate', 'FOUNDER_TODO.md checked -> PR merged -> production deploy', 'Code CLI', 'Protected product goes live'],
                ['Agent dispatches work', 'Cross-agent spec -> Code CLI executes heavy-lift task', 'Any agent -> Code CLI', 'Task completed + reported back'],
              ].map(([trigger, flow, who, result], i) => (
                <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-2 pl-3 pr-2 text-foreground font-medium">{trigger}</td>
                  <td className="py-2 px-2 text-muted-foreground">{flow}</td>
                  <td className="py-2 px-2 text-muted-foreground">{who}</td>
                  <td className="py-2 pl-2 pr-3 text-muted-foreground">{result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Dashboard Reference */}
      <SectionCard title="Dashboard Reference" className="mb-6">
        <p className="text-xs text-muted-foreground mb-4">How the dashboard works — data sources, color codes, and architecture.</p>

        {/* KPI Cards */}
        <div className="mb-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">Mission Control KPIs</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3 pr-2">Card</th>
                  <th className="text-left py-2 px-2">What It Shows</th>
                  <th className="text-left py-2 px-2">Data Source</th>
                  <th className="text-left py-2 pl-2 pr-3">When to Worry</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Company Health', 'Overall health score (0–100)', 'REGISTRY.md + GitHub Issues API', 'Below 60 = Critical'],
                  ['RADAR Equity', 'Paper trading portfolio + daily P/L', 'RADAR_DASHBOARD.md (Rex, 3× daily)', 'Equity < $90K or P/L consistently negative'],
                  ['Open P0s', 'Critical bugs across ALL repos', 'GitHub Issues API (label: P0)', 'Any P0 > 0 needs attention'],
                  ['Monthly Burn', 'Estimated monthly spend across all services', 'FINANCE.md + DAILY_COSTS.md', 'Above $100/mo → review costs'],
                  ['Revenue', 'Total MRR across all products', 'Hardcoded ($0 until launch)', 'Expected $0 during Phase 0'],
                  ['Agents', 'Pi5 agents: active / total', 'BANDWIDTH.md', '0/6 = all idle (Pi5 may be down)'],
                ].map(([card, what, source, worry], i) => (
                  <tr key={card} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2 pl-3 pr-2 text-foreground font-medium">{card}</td>
                    <td className="py-2 px-2 text-muted-foreground">{what}</td>
                    <td className="py-2 px-2 text-muted-foreground font-mono text-[10px]">{source}</td>
                    <td className="py-2 pl-2 pr-3 text-amber-400 text-[10px]">{worry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Color Coding */}
        <div className="mb-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /><span className="text-foreground font-medium">Green</span><span className="text-muted-foreground">— Healthy</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /><span className="text-foreground font-medium">Amber</span><span className="text-muted-foreground">— Warning, needs attention</span></div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /><span className="text-foreground font-medium">Red</span><span className="text-muted-foreground">— Critical, action required</span></div>
        </div>

        {/* Production Gates */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><span className="text-amber-400 font-mono">🔒 PROTECTED</span> — Code CLI creates preview, writes to FOUNDER_TODO.md, waits for Michael to merge PR.</p>
          <p><span className="text-green-400 font-mono">✅ STANDARD</span> — Code CLI merges and deploys autonomously (BigClaw Dashboard only).</p>
          <p className="text-[10px] pt-1">Data freshness: pages cache 5 min (Next.js revalidation). Hard-refresh forces a re-fetch.</p>
        </div>
      </SectionCard>
    </div>
  );
}
