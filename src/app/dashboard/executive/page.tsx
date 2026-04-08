import { fetchAllIssues, fetchRecentClosedIssues, fetchSDLCGatesMatrix, fetchSDLCViolations, fetchDailyCosts, fetchRadarDashboard, fetchPatrolReport, fetchPortfolioSummary } from '@/lib/github';
import { fetchProducts } from '@/lib/content';
import { fetchAllProductIntel } from '@/lib/product-intel';
import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';
import { ProductIntelSummaryTable } from '@/components/product-intelligence';
import { IssueTrendChart } from '@/components/issues-trend-chart';
import { parseMarkdownTable, extractSection } from '@/app/dashboard/sdlc/helpers';
import Link from 'next/link';

function clean(s: string): string {
  return s.replace(/\*\*/g, '').trim();
}

export default async function ExecutiveDashboardPage() {
  const [products, allIssues, closedIssues, gatesMd, violationsMd, dailyCostsMd, radarMd, patrolMd, portfolioMd, allIntel] = await Promise.all([
    fetchProducts(),
    fetchAllIssues(),
    fetchRecentClosedIssues(90),
    fetchSDLCGatesMatrix(),
    fetchSDLCViolations(),
    fetchDailyCosts(),
    fetchRadarDashboard(),
    fetchPatrolReport(),
    fetchPortfolioSummary(),
    fetchAllProductIntel(),
  ]);

  const p0Count = allIssues.filter(i => i.labels.includes('P0')).length;
  const violationRows = violationsMd ? parseMarkdownTable(extractSection(violationsMd, 'Raw Violations Log')) : [];
  const dailyCostRows = dailyCostsMd ? parseMarkdownTable(dailyCostsMd) : [];
  const latestCost = dailyCostRows[dailyCostRows.length - 1];

  // RADAR
  const radarSummary = radarMd ? parseMarkdownTable(extractSection(radarMd, 'Portfolio Summary')) : [];
  const radarMeta: Record<string, string> = {};
  for (const row of radarSummary) { if (row.cells.length >= 2) radarMeta[row.cells[0]] = row.cells[1]; }

  // PDLC gate status
  const gateRows = portfolioMd ? parseMarkdownTable(extractSection(portfolioMd, 'PDLC Gate Status')) : [];

  // Stage distribution
  const stageCounts: Record<string, number> = {};
  for (const p of products) {
    const s = p.stage.match(/S\d/)?.[0] || 'Other';
    stageCounts[s] = (stageCounts[s] || 0) + 1;
  }

  // Finance from patrol
  const financialSection = patrolMd ? extractSection(patrolMd, 'Financial Summary') : '';
  const finRows = parseMarkdownTable(financialSection);
  const burnRow = finRows.find(r => r.cells[0]?.toLowerCase().includes('burn'));
  const burn = burnRow ? clean(burnRow.cells[1] || '') : '~$5/mo';

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Executive Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">Business health at a glance — 5 domains</p>

      {/* ── PANEL 1: Company Health ──────────────────────────── */}
      <SectionCard title="Company Health" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Products</div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">{products.length}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">$0</div>
            <div className="text-[10px] text-amber-400">Pre-revenue</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Burn</div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">{burn}</div>
            <div className="text-[10px] text-green-400">Low</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">RADAR Equity</div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">{radarMeta['Equity'] || '—'}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">PDLC Stages</div>
            <div className="flex gap-1 mt-1 flex-wrap">
              {Object.entries(stageCounts).sort().map(([s, n]) => (
                <span key={s} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s}: {n}</span>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── PANEL 2: Market Intelligence ─────────────────────── */}
      <SectionCard title="Market Intelligence" className="mb-6">
        <ProductIntelSummaryTable allIntel={allIntel} />
        {allIntel.some(i => i.staleness === 'outdated' || i.staleness === 'missing') && (
          <div className="mt-2 px-2 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            Products with missing or outdated research need attention.
          </div>
        )}
      </SectionCard>

      {/* ── PANEL 3: Product Summary ─────────────────────────── */}
      <SectionCard title="Product Summary" className="mb-6">
        {gateRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3 pr-2">Product</th>
                  {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map(s => (
                    <th key={s} className="text-center py-2 px-1 font-mono">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gateRows.map((row, i) => {
                  const name = row.cells[0] || '';
                  const slug = name.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                      <td className="py-2 pl-3 pr-2 font-medium">
                        <Link href={`/dashboard/products/${slug}`} className="text-foreground no-underline hover:text-primary">{name}</Link>
                      </td>
                      {row.cells.slice(1, 9).map((cell, ci) => {
                        const isPass = cell.includes('✅');
                        const isCurrent = cell.includes('🔄');
                        const color = isPass ? 'text-green-400' : isCurrent ? 'text-amber-400' : 'text-muted-foreground/30';
                        return <td key={ci} className={`py-2 px-1 text-center ${color}`}>{isPass ? '●' : isCurrent ? '◐' : '○'}</td>;
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── PANEL 4: Engineering / SDLC ──────────────────────── */}
      <SectionCard title="Engineering / SDLC" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Open Issues</div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">{allIssues.length}</div>
            {p0Count > 0 && <div className="text-[10px] text-red-400 mt-1">{p0Count} P0</div>}
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Closed (90d)</div>
            <div className="text-xl font-bold font-mono text-green-400 mt-1">{closedIssues.length}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Violations</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">{violationRows.length}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Trend</div>
            <div className="mt-1"><IssueTrendChart openIssues={allIssues} closedIssues={closedIssues} days={90} /></div>
          </div>
        </div>
      </SectionCard>

      {/* ── PANEL 5: Finance ─────────────────────────────────── */}
      <SectionCard title="Finance" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Monthly Burn</div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">{burn}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">OpenRouter</div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">{latestCost ? latestCost.cells[1] || '—' : '—'}</div>
            <div className="text-[10px] text-muted-foreground">{latestCost ? `Remaining: ${latestCost.cells[2]}` : ''}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">RADAR P/L</div>
            <div className={`text-xl font-bold font-mono mt-1 ${(radarMeta['Daily P/L'] || '').includes('-') ? 'text-red-400' : 'text-green-400'}`}>{radarMeta['Daily P/L'] || '—'}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</div>
            <div className="text-xl font-bold font-mono text-foreground mt-1">$0</div>
            <div className="text-[10px] text-amber-400">Pre-revenue</div>
          </div>
        </div>
        {dailyCostRows.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3">Date</th>
                  <th className="text-right py-2 px-2">Used</th>
                  <th className="text-right py-2 px-2">Remaining</th>
                  <th className="text-right py-2 px-2">Daily</th>
                  <th className="text-right py-2 pr-3">Runway</th>
                </tr>
              </thead>
              <tbody>
                {dailyCostRows.slice(-7).map((row, i) => (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-1.5 pl-3 font-mono text-muted-foreground">{row.cells[0]}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{row.cells[1]}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{row.cells[2]}</td>
                    <td className="py-1.5 px-2 text-right font-mono">{row.cells[3]}</td>
                    <td className="py-1.5 pr-3 text-right font-mono text-muted-foreground">{row.cells[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
