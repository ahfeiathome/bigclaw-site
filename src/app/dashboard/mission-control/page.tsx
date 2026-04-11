export const dynamic = 'force-dynamic';

import { fetchAllIssues, fetchRecentClosedIssues, fetchMichaelTodo, fetchBandwidth, fetchRadarDashboard, fetchMorningBrainLog, fetchDailyCosts, fetchAgentSystem, fetchRepoFile } from '@/lib/github';
import { fetchProducts } from '@/lib/content';
import { SectionCard } from '@/components/dashboard';
import { IssueTrendChart } from '@/components/issues-trend-chart';
import { ProductHealthGrid } from '@/components/product-health-grid';
import { QuickActions } from '@/components/quick-actions';
import { CostTrendChart } from '@/components/cost-trend-chart';
import { CronHealthLights } from '@/components/cron-health-lights';
import { DeployApprovalSection } from '@/components/deploy-approval-section';
import { MoneyActionChecklist } from '@/components/money-action-checklist';
import { parsePendingGates } from '@/app/api/controls/pending/route';
import { parseMoneyItems } from '@/app/api/controls/todo/route';

// ── Shared helpers ──────────────────────────────────────────────────────────

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

// ── Page ────────────────────────────────────────────────────────────────────

export default async function MissionControlPage() {
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

  // ── Section 1: Pending production gates ───────────────────────────────────
  const pendingGates = todoMd ? parsePendingGates(todoMd) : [];

  // ── Section 2: Money action items ─────────────────────────────────────────
  const moneyItems = todoMd ? parseMoneyItems(todoMd) : [];
  const pendingMoneyItems = moneyItems.filter(i => !i.done);

  // ── Section 3: Product status ─────────────────────────────────────────────
  const products = registryProducts.filter(p => p.slug !== 'bigclaw-dashboard');

  // ── Section 4: System health ──────────────────────────────────────────────
  const costChartData: { date: string; spend: number }[] = [];
  if (dailyCostsMd) {
    for (const line of dailyCostsMd.split('\n')) {
      if (!line.startsWith('|') || line.match(/^\|[\s-:|]+\|$/) || line.includes('Date')) continue;
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      const dateMatch = cells[0]?.match(/\d{4}-\d{2}-\d{2}/);
      const spendMatch = cells[3]?.match(/\$?([\d.]+)/);
      if (dateMatch && spendMatch) {
        costChartData.push({ date: dateMatch[0], spend: parseFloat(spendMatch[1]) });
      }
    }
  }

  // Active sessions
  const sessionLines = activeSessionsMd
    ? activeSessionsMd.split('\n').filter(l => l.trim() && !l.startsWith('#') && l.includes('|'))
    : [];

  // Sanity check summary
  let sanityStatus = '';
  let sanityDate = '';
  if (sanityCheckMd) {
    const dateMatch = sanityCheckMd.match(/\*\*Run:\*\*\s*([^\n]+)/);
    const resultMatch = sanityCheckMd.match(/\*\*Result:\*\*\s*([^\n]+)/);
    sanityDate = dateMatch?.[1]?.trim() || '';
    sanityStatus = resultMatch?.[1]?.trim() || '';
  }

  // Agent team
  const agentTableRows = bandwidthMd ? parseMarkdownTable(extractSection(bandwidthMd, 'Current Agent Load')) : [];
  const activeAgents = agentTableRows.filter(r => r.cells[3]?.toLowerCase() === 'busy').length;

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

  return (
    <div>
      {/* ── Page Title ──────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-3 mb-2">
        <img src="/images/bigclaw-logo.png" alt="BigClaw AI" className="h-10 w-10 rounded-lg object-contain" />
        <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Mission Control</h1>
      </div>
      <p className="text-xs text-center text-muted-foreground mb-6">{"Michael's control panel — approve deploys, check off money actions"}</p>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 1: PRODUCTION DEPLOY APPROVALS                    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <SectionCard title={`Production Deploy Approvals${pendingGates.length > 0 ? ` (${pendingGates.length})` : ''}`} className="mb-4">
        <DeployApprovalSection initialGates={pendingGates} />
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 2: MONEY ACTIONS                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <SectionCard title={`💳 Money Actions${pendingMoneyItems.length > 0 ? ` (${pendingMoneyItems.length} pending)` : ''}`} className="mb-4">
        {moneyItems.length > 0
          ? <MoneyActionChecklist initialItems={moneyItems} />
          : <p className="text-sm text-muted-foreground">No action items found.</p>
        }
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 3: PRODUCT STATUS                                 */}
      {/* ══════════════════════════════════════════════════════════ */}
      <SectionCard title="Product Status" className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border">
                <th className="text-left py-2 pr-3">Product</th>
                <th className="text-left py-2 px-2">Stage</th>
                <th className="text-left py-2 px-2">Company</th>
                <th className="text-left py-2 px-2">Revenue</th>
                <th className="text-left py-2 pl-2">Live URL</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => (
                <tr key={p.slug} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
                  <td className="py-1.5 pr-3 font-medium text-foreground">{p.name}</td>
                  <td className="py-1.5 px-2 font-mono text-[10px] text-muted-foreground">{p.stage}</td>
                  <td className="py-1.5 px-2 text-muted-foreground">{p.company}</td>
                  <td className="py-1.5 px-2 text-muted-foreground">{p.revenue || '—'}</td>
                  <td className="py-1.5 pl-2">
                    {p.liveUrl
                      ? <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="text-primary no-underline hover:underline">↗</a>
                      : <span className="text-muted-foreground">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3">
          <ProductHealthGrid />
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 4: SYSTEM HEALTH                                  */}
      {/* ══════════════════════════════════════════════════════════ */}
      <SectionCard title="System Health" className="mb-4">
        {/* Cron jobs */}
        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Cron Jobs</div>
          <CronHealthLights agentMd={agentMd} />
        </div>

        {/* Cost trend */}
        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Daily Spend</div>
          <CostTrendChart data={costChartData} />
        </div>

        {/* Agent status */}
        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
            Agents — {activeAgents} active
          </div>
          {agentTableRows.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {agentTableRows.map((row, i) => {
                const name = row.cells[0]?.replace(/\*/g, '') || `Agent ${i}`;
                const busy = row.cells[3]?.toLowerCase() === 'busy';
                return (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-card/50">
                    <span className={`w-1.5 h-1.5 rounded-full ${busy ? 'bg-green-400' : 'bg-muted-foreground/40'}`} />
                    <span className="text-[10px] text-foreground font-mono">{name}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Agent data unavailable</p>
          )}
        </div>

        {/* Active sessions */}
        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Active Sessions</div>
          {sessionLines.length > 0 ? (
            <div className="space-y-1">
              {sessionLines.slice(0, 6).map((line, i) => (
                <div key={i} className="text-xs font-mono text-muted-foreground px-1">{line.trim()}</div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No active sessions</p>
          )}
        </div>

        {/* Sanity check */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Nightly Sanity Check</div>
          {sanityStatus ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-foreground">{sanityStatus}</span>
              {sanityDate && <span className="text-[10px] text-muted-foreground font-mono">{sanityDate}</span>}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No sanity check results yet</p>
          )}
        </div>
      </SectionCard>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* SECTION 5: INTELLIGENCE                                   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <SectionCard title="Intelligence" className="mb-4">
        {/* Morning report */}
        {morningSpecRows.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
              Morning Brain — {morningTimestamp || 'Latest'}
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

        {/* RADAR summary */}
        {Object.keys(radarMeta).length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">RADAR Portfolio</div>
            <div className="flex flex-wrap gap-3">
              {Object.entries(radarMeta).slice(0, 4).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border bg-card/50 px-3 py-2">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{k}</div>
                  <div className="text-sm font-mono font-semibold text-foreground">{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issues trend */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Issues Trend (all products, 90 days)</div>
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
