import { fetchAllIssues, fetchRecentClosedIssues, fetchSDLCGatesMatrix, fetchSDLCViolations, fetchDailyCosts, fetchRadarDashboard, fetchPatrolReport, fetchPortfolioSummary, fetchAgentSystem, fetchPi5Health, fetchOvernightReport } from '@/lib/github';
import fs from 'node:fs';
import path from 'node:path';

interface ProductGate { product: string; repo: string; protected: boolean }
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
  const [products, allIssues, closedIssues, gatesMd, violationsMd, dailyCostsMd, radarMd, patrolMd, portfolioMd, allIntel, agentMd, pi5HealthMd, overnightMd] = await Promise.all([
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
    fetchAgentSystem(),
    fetchPi5Health(),
    fetchOvernightReport(),
  ]);

  // Production Gates
  let gates: ProductGate[] = [];
  try {
    const gatesPath = path.join(process.cwd(), 'data', 'productionGates.json');
    if (fs.existsSync(gatesPath)) {
      gates = JSON.parse(fs.readFileSync(gatesPath, 'utf8')).gates || [];
    }
  } catch { /* no gates file */ }

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

      {/* ── PANEL 6: Operations / Agent Health ────────────── */}
      <SectionCard title="Operations / Agent Health" className="mb-6">
        {/* Agent roster */}
        {agentMd && (() => {
          const rosterLines = agentMd.split('\n').filter(l => l.startsWith('|') && l.includes('**') && !l.includes('Agent') && !l.match(/^\|[\s-:|]+\|$/));
          const agents = rosterLines.map(l => {
            const cells = l.split('|').map(c => c.trim()).filter(Boolean);
            return { name: cells[0]?.replace(/\*/g, ''), title: cells[1], model: cells[2], duty: cells[4], mode: cells[5] };
          });
          return agents.length > 0 ? (
            <div className="mb-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Agent Roster ({agents.length})</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {agents.map(a => (
                  <div key={a.name} className="rounded-lg border border-border bg-card/50 p-2 flex items-center gap-2">
                    <StatusDot status="good" size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-foreground">{a.name} <span className="text-muted-foreground font-normal">— {a.title}</span></div>
                      <div className="text-[10px] text-muted-foreground font-mono">{a.model} · {a.mode}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* Cron schedule */}
        {agentMd && (() => {
          const cronSection = agentMd.split('## Cron Schedule')[1]?.split('## ')[0] || '';
          const cronLines = cronSection.split('\n').filter(l => l.startsWith('|') && l.includes('`') && !l.includes('Script') && !l.match(/^\|[\s-:|]+\|$/));
          const crons = cronLines.map(l => {
            const cells = l.split('|').map(c => c.trim()).filter(Boolean);
            return { script: cells[0]?.replace(/`/g, ''), schedule: cells[1], agent: cells[2], duty: cells[3] };
          });
          return crons.length > 0 ? (
            <div className="mb-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Cron Jobs ({crons.length})</div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border bg-muted">
                      <th className="text-left py-1.5 pl-3 pr-2">Script</th>
                      <th className="text-left py-1.5 px-2">Schedule</th>
                      <th className="text-left py-1.5 px-2">Agent</th>
                      <th className="text-left py-1.5 pl-2 pr-3">Duty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crons.map((c, i) => (
                      <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                        <td className="py-1.5 pl-3 pr-2 font-mono text-[10px] text-primary">{c.script}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">{c.schedule}</td>
                        <td className="py-1.5 px-2 text-foreground">{c.agent}</td>
                        <td className="py-1.5 pl-2 pr-3 text-muted-foreground">{c.duty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null;
        })()}

        {/* Pi5 Health */}
        {pi5HealthMd && (() => {
          const healthLines = pi5HealthMd.split('\n').filter(l => l.startsWith('|') && !l.match(/^\|[\s-:|]+\|$/) && !l.includes('Metric'));
          const metrics = healthLines.slice(0, 6).map(l => {
            const cells = l.split('|').map(c => c.trim()).filter(Boolean);
            return { metric: cells[0], value: cells[1] };
          });
          return metrics.length > 0 ? (
            <div className="mb-4">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Pi5 System Health</div>
              <div className="flex flex-wrap gap-3">
                {metrics.map(m => (
                  <div key={m.metric} className="text-xs">
                    <span className="text-muted-foreground">{m.metric}:</span>{' '}
                    <span className="font-mono text-foreground">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null;
        })()}

        {/* Overnight Report */}
        {overnightMd && (() => {
          const lines = overnightMd.split('\n');
          const timestampMatch = overnightMd.match(/(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})/);
          const summaryLines = lines.filter(l => l.startsWith('- ') || l.startsWith('* ')).slice(0, 5);
          return (
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Overnight Patrol {timestampMatch ? `— ${timestampMatch[1]}` : ''}</div>
              {summaryLines.length > 0 ? (
                <ul className="space-y-0.5">
                  {summaryLines.map((l, i) => (
                    <li key={i} className="text-xs text-muted-foreground">{l.replace(/^[-*]\s*/, '• ')}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No overnight report data.</p>
              )}
            </div>
          );
        })()}

        {!agentMd && !pi5HealthMd && !overnightMd && (
          <p className="text-sm text-muted-foreground">Operations data not available. Agent system files will appear when Pi5 crons populate them.</p>
        )}
      </SectionCard>

      {/* ── PANEL 7: Production Gates ─────────────────────── */}
      {gates.length > 0 && (
        <SectionCard title="Production Gates" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3 pr-2">Product</th>
                  <th className="text-left py-2 px-2">Repo</th>
                  <th className="text-left py-2 pl-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {gates.map((gate, i) => (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-1.5 pl-3 pr-2 text-foreground">{gate.product}</td>
                    <td className="py-1.5 px-2 text-muted-foreground font-mono text-[10px]">{gate.repo}</td>
                    <td className="py-1.5 pl-2 pr-3">
                      {gate.protected
                        ? <span className="text-amber-400 text-[10px]">🔒 Protected</span>
                        : <span className="text-green-400 text-[10px]">✅ Auto-deploy</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
