import { SectionCard } from '@/components/dashboard';

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
    </div>
  );
}
