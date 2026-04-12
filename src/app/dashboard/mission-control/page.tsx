export const dynamic = 'force-dynamic';

import { fetchAllIssues, fetchRecentClosedIssues, fetchMichaelTodo, fetchBandwidth, fetchRadarDashboard, fetchMorningBrainLog, fetchDailyCosts, fetchAgentSystem, fetchRepoFile } from '@/lib/github';
import { fetchProducts } from '@/lib/content';
import { SectionCard } from '@/components/dashboard';
import { IssueTrendChart } from '@/components/issues-trend-chart';
import { QuickActions } from '@/components/quick-actions';
import { CostTrendChart } from '@/components/cost-trend-chart';
import { CronHealthLights } from '@/components/cron-health-lights';
import { DeployApprovalSection } from '@/components/deploy-approval-section';
import { MoneyActionChecklist } from '@/components/money-action-checklist';
import { parsePendingGates } from '@/app/api/controls/pending/route';
import { parseMoneyItems } from '@/app/api/controls/todo/route';

// ── Shared helpers ───────────────────────────────────────────────────────────

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

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'America/Los_Angeles' });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function MissionControlPage() {
  const pageRenderedAt = new Date();

  const [allIssues, closedIssues, todoMd, bandwidthMd, radarMd, morningLog, registryProducts, agentMd, dailyCostsMd, activeSessionsMd, sanityCheckMd] = await Promise.all([
    fetchAllIssues(),
    fetchRecentClosedIssues(90),
    fetchMichaelTodo(),
    fetchBandwidth(),
    fetchRadarDashboard(),
    fetchMorningBrainLog(),
    fetchProducts(),
    fetchAgentSystem(),
    fetchDailyCosts(),
    fetchRepoFile('bigclaw-ai', 'ops/ACTIVE_SESSIONS.md'),
    fetchRepoFile('bigclaw-ai', 'ops/SANITY_CHECK.md'),
  ]);

  // ── Section 2: Action Required ────────────────────────────────────────────
  const pendingGates = todoMd ? parsePendingGates(todoMd) : [];
  const moneyItems = todoMd ? parseMoneyItems(todoMd) : [];
  const pendingMoneyItems = moneyItems.filter(i => !i.done);
  const hasActions = pendingGates.length > 0 || pendingMoneyItems.length > 0;

  // ── Section 3: Portfolio ──────────────────────────────────────────────────
  const products = registryProducts.filter(
    p => p.slug !== 'bigclaw-dashboard' && p.slug !== 'cortex' && p.name.toLowerCase() !== 'cortex'
  );

  // ── Section 4: System Health ──────────────────────────────────────────────
  // Cost — last entry
  let lastSpend: string | null = null;
  let lastSpendDate: string | null = null;
  if (dailyCostsMd) {
    const costLines = dailyCostsMd.split('\n').filter(
      l => l.startsWith('|') && !l.match(/^\|[\s-:|]+\|$/) && !l.includes('Date')
    );
    const last = costLines[costLines.length - 1];
    if (last) {
      const cells = last.split('|').map(c => c.trim()).filter(Boolean);
      const dateM = cells[0]?.match(/\d{4}-\d{2}-\d{2}/);
      const spendM = cells[3]?.match(/\$?([\d.]+)/);
      if (dateM) lastSpendDate = dateM[0];
      if (spendM) lastSpend = `$${parseFloat(spendM[1]).toFixed(2)}`;
    }
  }

  // Agents
  const agentTableRows = bandwidthMd ? parseMarkdownTable(extractSection(bandwidthMd, 'Current Agent Load')) : [];
  const activeAgents = agentTableRows.filter(r => r.cells[3]?.toLowerCase() === 'busy').length;

  // Sessions
  const sessionLines = activeSessionsMd
    ? activeSessionsMd.split('\n').filter(l => l.trim() && !l.startsWith('#') && l.includes('|'))
    : [];

  // Sanity check
  let sanityStatus = '';
  let sanityDate = '';
  if (sanityCheckMd) {
    const dateMatch = sanityCheckMd.match(/\*\*Run:\*\*\s*([^\n]+)/);
    const resultMatch = sanityCheckMd.match(/\*\*Result:\*\*\s*([^\n]+)/);
    sanityDate = dateMatch?.[1]?.trim() || '';
    sanityStatus = resultMatch?.[1]?.trim() || '';
  }

  // ── Section 5: Intelligence ───────────────────────────────────────────────
  // Morning report
  let morningTimestamp = '';
  let morningSpecRows: string[][] = [];
  if (morningLog) {
    const blocks = morningLog.split('=== MORNING BRAIN START ===');
    const lastBlock = blocks[blocks.length - 1] || '';
    const tsMatch = lastBlock.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);
    morningTimestamp = tsMatch?.[1]?.split(' ')[0] || '';
    const summaryStart = lastBlock.indexOf('**Morning Brain Complete');
    const summary = summaryStart > -1 ? lastBlock.slice(summaryStart).split('=== MORNING BRAIN DONE ===')[0] : '';
    morningSpecRows = summary.split('\n')
      .filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Priority'))
      .map(l => l.split('|').map(c => c.trim()).filter(Boolean));
  }

  // RADAR summary
  const radarSummary = radarMd ? parseMarkdownTable(extractSection(radarMd, 'Portfolio Summary')) : [];
  const radarMeta: Record<string, string> = {};
  for (const row of radarSummary) {
    if (row.cells.length >= 2) radarMeta[row.cells[0]] = row.cells[1];
  }

  const ts = formatTime(pageRenderedAt);

  return (
    <div>
      {/* ── Page Title ────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <img src="/images/bigclaw-logo.png" alt="BigClaw AI" className="h-10 w-10 rounded-lg object-contain" />
        <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Mission Control</h1>
      </div>
      <p className="text-xs text-center text-muted-foreground mb-6">
        {"Michael's control panel — approve deploys, check off money actions"}
        <span className="ml-2 opacity-50">· {ts} PT</span>
      </p>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: YOUR WORKFLOW (collapsible cheat sheet)        */}
      {/* ══════════════════════════════════════════════════════════ */}
      <details className="group mb-4 rounded-xl border border-border/50 overflow-hidden">
        <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer select-none hover:bg-muted/40 list-none [&::-webkit-details-marker]:hidden bg-card/30">
          <svg className="w-3 h-3 text-muted-foreground shrink-0 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-sm font-semibold text-foreground">Your Workflow — Quick Reference</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Commands for common scenarios. Copy-paste to any session.</span>
        </summary>

        <div className="px-4 pb-4 pt-3 border-t border-border/40 space-y-4 bg-card/10">

          {/* Workflow blocks in a 2-col grid on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* After Coding */}
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-2">After Coding is Done</div>
              <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">{`Step 1: "Push to main. Give me the preview URL."
        → Code pushes to main
        → Vercel creates preview URL (NOT production)

Step 2:  Review preview on your phone

Step 3a: "Approved. Merge main to release."
         → Code merges → production goes live

Step 3b: "Rejected. Fix [what's wrong]."
         → Code fixes, new preview URL`}</pre>
            </div>

            {/* Other commands */}
            <div className="space-y-3">
              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-2">Starting a Session</div>
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">{`"Read the briefing."
  → Consultant/Code catches up

"Read the briefing. I want to work on [task]."`}</pre>
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-2">Money / Legal Gates</div>
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">{`"I approved [item] in FOUNDER_TODO.md"
  → Code reads the file and executes

"Add [item] to FOUNDER_TODO.md"
  → Consultant writes the gate entry`}</pre>
              </div>

              <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
                <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-2">Ending a Session</div>
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">{`"Update the briefing and wrap up."
  → Consultant writes SESSION_BRIEFING.md

"Update CLAUDE.md and wrap up."
  → Code CLI writes repo's CLAUDE.md`}</pre>
              </div>
            </div>
          </div>

          {/* Never Say table */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-2">Never Say</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1.5 pr-3">Don't Say</th>
                    <th className="text-left py-1.5 px-2">Why</th>
                    <th className="text-left py-1.5 pl-2">Say Instead</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['"Push to release"', 'Bypasses preview review', '"Push to main. Give me the preview URL."'],
                    ['"Deploy to production"', 'Skips the gate', '"Approved. Merge main to release."'],
                    ['"Just merge it"', 'No review step', '"Give me the preview URL first."'],
                    ['"Push to both branches"', 'Release goes live unreviewed', '"Push to main only."'],
                  ].map(([dont, why, instead], i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-1.5 pr-3 font-mono text-red-400/80 text-[10px]">{dont}</td>
                      <td className="py-1.5 px-2 text-muted-foreground">{why}</td>
                      <td className="py-1.5 pl-2 font-mono text-green-400/80 text-[10px]">{instead}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Session wrap-up table */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground mb-2">Wrap-Up Cheat Sheet</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-1.5 pr-3">Session</th>
                    <th className="text-left py-1.5 px-2">You Say</th>
                    <th className="text-left py-1.5 pl-2">What Gets Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Consultant', '"Update the briefing and wrap up."', 'founder/SESSION_BRIEFING.md'],
                    ['lc-forge', '"Update CLAUDE.md and wrap up."', 'learnie-ai/CLAUDE.md + touched repos'],
                    ['lc-axiom', '"Update CLAUDE.md and wrap up."', 'Each Axiom repo\'s CLAUDE.md'],
                    ['lc-bigclaw', '"Update CLAUDE.md and wrap up."', 'bigclaw-site/CLAUDE.md'],
                  ].map(([session, say, updates], i) => (
                    <tr key={i} className="border-b border-border/30">
                      <td className="py-1.5 pr-3 font-mono text-[10px] text-foreground">{session}</td>
                      <td className="py-1.5 px-2 font-mono text-[10px] text-muted-foreground">{say}</td>
                      <td className="py-1.5 pl-2 text-muted-foreground">{updates}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-amber-400/80 mt-2">⚠️ If you don't say this, the next session starts cold.</p>
          </div>
        </div>
      </details>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 2: ACTION REQUIRED                               */}
      {/* ══════════════════════════════════════════════════════════ */}
      <SectionCard
        title={hasActions
          ? `Action Required (${pendingGates.length + pendingMoneyItems.length})`
          : 'Action Required'}
        className="mb-4"
      >
        {!hasActions ? (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <span>✅</span>
            <span>No action required — all clear</span>
            <span className="text-[10px] text-muted-foreground font-mono ml-auto">{ts}</span>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingGates.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 flex items-center justify-between">
                  <span>Production Deploy Approvals ({pendingGates.length})</span>
                  <span className="font-mono normal-case">{ts}</span>
                </div>
                <DeployApprovalSection initialGates={pendingGates} />
              </div>
            )}
            {pendingMoneyItems.length > 0 && (
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 flex items-center justify-between">
                  <span>💳 Money Actions ({pendingMoneyItems.length} pending)</span>
                  <span className="font-mono normal-case">{ts}</span>
                </div>
                <MoneyActionChecklist initialItems={pendingMoneyItems} />
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 3: PORTFOLIO                                      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <SectionCard title="Portfolio" className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">{products.length} products</span>
          <span className="text-[10px] text-muted-foreground font-mono">{ts}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {products.map(p => (
            <div key={p.slug} className="rounded-lg border border-border/50 bg-card/30 px-3 py-2.5">
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-xs font-semibold text-foreground leading-tight">{p.name}</span>
                {p.liveUrl && (
                  <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"
                     className="text-[10px] text-primary no-underline hover:underline shrink-0 mt-0.5" title={p.liveUrl}>↗</a>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">{p.stage}</span>
                {p.company && (
                  <span className="text-[9px] text-muted-foreground/60 truncate">{p.company}</span>
                )}
              </div>
              {p.revenue && (
                <div className="text-[10px] text-green-400/80 font-mono mt-1">{p.revenue}</div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 4: SYSTEM HEALTH (one row)                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      <SectionCard title="System Health" className="mb-4">
        {/* Top stat strip */}
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {lastSpend && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-card/30">
              <span className="text-[10px] text-muted-foreground">Spend</span>
              <span className="text-sm font-mono font-semibold text-foreground">{lastSpend}</span>
              {lastSpendDate && <span className="text-[9px] text-muted-foreground font-mono">{lastSpendDate}</span>}
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-card/30">
            <span className={`w-1.5 h-1.5 rounded-full ${activeAgents > 0 ? 'bg-green-400' : 'bg-muted-foreground/40'}`} />
            <span className="text-[10px] text-muted-foreground">Agents</span>
            <span className="text-sm font-mono font-semibold text-foreground">{activeAgents}</span>
            <span className="text-[9px] text-muted-foreground">active</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-card/30">
            <span className={`w-1.5 h-1.5 rounded-full ${sessionLines.length > 0 ? 'bg-blue-400' : 'bg-muted-foreground/40'}`} />
            <span className="text-[10px] text-muted-foreground">Sessions</span>
            <span className="text-sm font-mono font-semibold text-foreground">{sessionLines.length}</span>
            <span className="text-[9px] text-muted-foreground">active</span>
          </div>
          {sanityStatus && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border/50 bg-card/30">
              <span className="text-[10px] text-muted-foreground">Sanity</span>
              <span className="text-xs text-foreground">{sanityStatus}</span>
              {sanityDate && <span className="text-[9px] text-muted-foreground font-mono">{sanityDate}</span>}
            </div>
          )}
          <span className="text-[10px] text-muted-foreground font-mono ml-auto">{ts}</span>
        </div>

        {/* Cron jobs */}
        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Cron Jobs</div>
          <CronHealthLights agentMd={agentMd} />
        </div>

        {/* Cost trend */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Daily Spend Trend</div>
          <CostTrendChart data={(() => {
            const data: { date: string; spend: number }[] = [];
            if (dailyCostsMd) {
              for (const line of dailyCostsMd.split('\n')) {
                if (!line.startsWith('|') || line.match(/^\|[\s-:|]+\|$/) || line.includes('Date')) continue;
                const cells = line.split('|').map(c => c.trim()).filter(Boolean);
                const dateMatch = cells[0]?.match(/\d{4}-\d{2}-\d{2}/);
                const spendMatch = cells[3]?.match(/\$?([\d.]+)/);
                if (dateMatch && spendMatch) data.push({ date: dateMatch[0], spend: parseFloat(spendMatch[1]) });
              }
            }
            return data;
          })()} />
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 5: INTELLIGENCE                                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <SectionCard title="Intelligence" className="mb-4">
        {/* RADAR */}
        {Object.keys(radarMeta).length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 flex items-center justify-between">
              <span>RADAR Portfolio</span>
              <span className="font-mono normal-case">{ts}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(radarMeta).slice(0, 6).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-card/50 px-3 py-2">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{k}</div>
                  <div className="text-sm font-mono font-semibold text-foreground">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Morning report */}
        {morningSpecRows.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 flex items-center justify-between">
              <span>Morning Brain — {morningTimestamp || 'Latest'}</span>
              <span className="font-mono normal-case">{ts}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-1.5 pr-2">Priority</th>
                    <th className="text-left py-1.5 px-2">Spec</th>
                    <th className="text-left py-1.5 pl-2">Product</th>
                  </tr>
                </thead>
                <tbody>
                  {morningSpecRows.map((cells, i) => (
                    <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
                      <td className="py-1 pr-2 font-mono text-[10px]">{cells[0]?.replace(/\*/g, '') || ''}</td>
                      <td className="py-1 px-2 font-mono text-[10px] text-muted-foreground">{cells[1]?.replace(/`/g, '') || ''}</td>
                      <td className="py-1 pl-2 text-muted-foreground">{cells[2] || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Issues trend */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2 flex items-center justify-between">
            <span>Issues Trend (all products, 90 days)</span>
            <span className="font-mono normal-case">{ts}</span>
          </div>
          <IssueTrendChart openIssues={allIssues} closedIssues={closedIssues} days={90} />
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 6: QUICK ACTIONS                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <SectionCard title="Quick Actions" className="mb-4">
        <QuickActions />
      </SectionCard>
    </div>
  );
}
