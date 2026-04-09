import { fetchPatrolReport, fetchAllIssues, fetchRecentClosedIssues, fetchHealth, fetchMichaelTodo, fetchBandwidth, fetchRadarDashboard, fetchPDLCRegistry, fetchMorningBrainLog, fetchPortfolioSummary, fetchSDLCViolations, fetchAgentSystem, fetchPi5Health, fetchOvernightReport, fetchDailyCosts, FORGE_REPOS, AXIOM_REPOS } from '@/lib/github';
import { fetchProducts } from '@/lib/content';
import { fetchAllProductIntel } from '@/lib/product-intel';
import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';
import { KpiCard } from '@/components/kpi-card';
import { MissionCommandCenter } from '@/components/mission-command-center';
import { IssueTrendChart } from '@/components/issues-trend-chart';
import { ProductIntelSummaryTable } from '@/components/product-intelligence';
import { ActionItems } from '@/components/action-items';
import { ProductHealthGrid } from '@/components/product-health-grid';
import { QuickActions } from '@/components/quick-actions';
import { CostTrendChart } from '@/components/cost-trend-chart';
import { CronHealthLights } from '@/components/cron-health-lights';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';

interface PendingGate { product: string; repo: string; branch: string; prUrl: string; previewUrl: string; summary: string; builtAt: string }
interface ProductGate { product: string; repo: string; protected: boolean }

function readJsonFile<T>(filename: string): T | null {
  try {
    const p = path.join(process.cwd(), 'data', filename);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { return null; }
}

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
  const [content, allIssues, closedIssues, healthMd, todoMd, bandwidthMd, radarMd, pdlcMd, morningLog, registryProducts, allIntel, violationsMd, portfolioMd, agentMd, pi5HealthMd, overnightMd, dailyCostsMd] = await Promise.all([
    fetchPatrolReport(),
    fetchAllIssues(),
    fetchRecentClosedIssues(90),
    fetchHealth(),
    fetchMichaelTodo(),
    fetchBandwidth(),
    fetchRadarDashboard(),
    fetchPDLCRegistry(),
    fetchMorningBrainLog(),
    fetchProducts(),
    fetchAllProductIntel(),
    fetchSDLCViolations(),
    fetchPortfolioSummary(),
    fetchAgentSystem(),
    fetchPi5Health(),
    fetchOvernightReport(),
    fetchDailyCosts(),
  ]);

  // Production Gates
  const gatesData = readJsonFile<{ gates: ProductGate[] }>('productionGates.json');
  const pendingData = readJsonFile<{ pending: PendingGate[] }>('pendingGates.json');
  const gates = gatesData?.gates || [];
  const pendingGates = pendingData?.pending || [];

  // PDLC — use dynamic products from REGISTRY.md (all products, not just Active Products section)
  const pdlcRows = registryProducts
    .filter(p => p.slug !== 'bigclaw-dashboard')
    .map(p => [p.name, p.company, p.stage, p.stageRaw, '', '', p.revenue]);

  // Finance
  const financial = content ? parseMarkdownTable(extractSection(content, 'Financial Summary')) : [];
  const burnRow = financial.find(r => r.cells[0]?.toLowerCase().includes('burn'));
  const burnVal = burnRow?.cells[1]?.replace('(free tiers)', '').trim() || '~$5/mo';

  // Health — compute from real data: products active, P0 count, agents online
  const totalProducts = registryProducts.filter(p => p.slug !== 'bigclaw-dashboard').length;
  const productsLive = registryProducts.filter(p => p.status === 'LIVE').length;
  const p0Issues = allIssues.filter(i => i.labels.includes('P0')).length;
  // Score: start at 100, -10 per P0, +5 per live product, -5 if no agents
  const healthScore = Math.max(0, Math.min(100, 100 - (p0Issues * 10) + (productsLive * 5)));
  const healthSemantic = healthScore >= 80 ? 'success' as const : healthScore >= 60 ? 'warning' as const : 'danger' as const;

  // RADAR
  const radarSummary = radarMd ? parseMarkdownTable(extractSection(radarMd, 'Portfolio Summary')) : [];
  const radarMeta: Record<string, string> = {};
  for (const row of radarSummary) {
    if (row.cells.length >= 2) radarMeta[row.cells[0]] = row.cells[1];
  }
  const radarEquityVal = radarMeta['Equity'] || '--';
  const radarPnlVal = radarMeta['Daily P/L'] || '--';
  const radarReserveStr = radarMeta['Reserve'] || '';
  const radarReserve = radarReserveStr ? parseFloat(radarReserveStr.replace('%', '')) : undefined;
  const hasLive = radarMeta['Phase']?.includes('Live') || false;
  const radarSemantic = radarPnlVal.includes('-') ? 'danger' as const : 'success' as const;

  // Sparkline data
  const equitySection = radarMd ? extractSection(radarMd, 'Equity History') : '';
  const equityRows = parseMarkdownTable(equitySection);
  const equitySparkData = equityRows.slice(-7).map(r => parseFloat(r.cells[1]?.replace(/[$,]/g, '') || '0')).filter(v => v > 0);

  // Issues
  const p0Count = allIssues.filter(i => i.labels.includes('P0')).length;
  const p0Semantic = p0Count === 0 ? 'success' as const : p0Count <= 3 ? 'warning' as const : 'danger' as const;

  // Agents
  const agentTableRows = bandwidthMd ? parseMarkdownTable(extractSection(bandwidthMd, 'Current Agent Load')) : [];
  const activeAgents = agentTableRows.filter(r => r.cells[3]?.toLowerCase() === 'busy').length;
  const totalAgents = agentTableRows.length || 6;
  const agentSemantic = activeAgents === 0 ? 'danger' as const : activeAgents < totalAgents ? 'warning' as const : 'success' as const;

  // Burn — normalize to monthly
  let burnDisplay = burnVal;
  const burnFloat = parseFloat(burnVal.replace(/[^0-9.]/g, '')) || 0;
  if (burnVal.includes('/day')) {
    const monthly = burnFloat * 30;
    burnDisplay = `~$${monthly.toFixed(0)}/mo`;
  }
  const burnSemantic = burnFloat < 5 ? 'success' as const : burnFloat < 15 ? 'warning' as const : 'danger' as const;

  // Parse daily cost data for chart
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

  return (
    <div>
      {/* ── Page Title ──────────────────────────────────────────── */}
      <h1 className="mb-2" style={{ fontSize: '28px', fontWeight: 700 }}>Dashboard</h1>
      <div className="rounded-xl border border-border bg-card/50 p-4 mb-4">
        <div className="text-sm text-foreground font-medium mb-1">BigClaw AI — AI-Native Venture Studio</div>
        <p className="text-xs text-muted-foreground">Building useful AI products across education, commerce, consumer tools, and fintech. 10 products in portfolio, 6 AI agents on Pi5, 3 Code CLI sessions running 24/7. Founded by Michael Liu.</p>
      </div>

      {/* ── Company Health (Cron + Finance, right after intro) ──── */}
      <SectionCard title="Company Health" className="mb-4">
        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Cron Jobs</div>
          <CronHealthLights agentMd={agentMd} />
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Finance Health</div>
          <CostTrendChart data={costChartData} />
        </div>
      </SectionCard>

      {/* ── KPI Cards ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <KpiCard label="Company Health" value={`${healthScore}`} semantic={healthSemantic} delta={healthScore >= 80 ? '▲ Healthy' : healthScore >= 60 ? '— Warning' : '▼ Critical'} sparkData={[70, 75, 80, healthScore, healthScore, healthScore, healthScore]} subtitle="/100" />
        <KpiCard label="RADAR Equity" value={radarEquityVal} semantic={radarSemantic} delta={`P/L: ${radarPnlVal}`} sparkData={equitySparkData.length >= 2 ? equitySparkData : undefined} />
        <KpiCard label="Open P0s" value={String(p0Count)} semantic={p0Semantic} delta={p0Count === 0 ? '▲ Clear' : `${p0Count} blocking`} />
        <KpiCard label="Monthly Burn" value={burnDisplay} semantic={burnSemantic} delta={burnFloat < 100 ? '▲ Under budget' : undefined} />
        <KpiCard label="Revenue" value="$0" semantic="warning" delta="Pre-revenue" subtitle="Phase 0" />
        <KpiCard label="Agents" value={`${activeAgents}/${totalAgents}`} semantic={agentSemantic} delta={`${activeAgents} active`} />
      </div>

      {/* ── Product Health Check ───────────────────────────────── */}
      <SectionCard title="Product Health Check" className="mb-4">
        <ProductHealthGrid />
      </SectionCard>

      {/* ── Market Intelligence (right after health check) ─────── */}
      {allIntel.length > 0 && (
        <SectionCard title="Market Intelligence" className="mb-4">
          <ProductIntelSummaryTable allIntel={allIntel} />
        </SectionCard>
      )}

      {/* ── Command Center (contains PDLC) ─────────────────────── */}
      <MissionCommandCenter radarReserve={radarReserve} hasLive={hasLive} defaultCollapsed={false} />

      {/* ── Production Gates (right after PDLC) ──────────────── */}
      <SectionCard title="Production Gates" className="mt-4">
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

      {/* ── Quick Actions ──────────────────────────────────── */}
      <SectionCard title="Quick Actions" className="mt-4 mb-4">
        <QuickActions />
      </SectionCard>

      {/* ── ROW 3: Morning Brain Report ──────────────────────────── */}
      {morningLog && (() => {
        // Extract the latest report block (between === START === and === DONE ===)
        const blocks = morningLog.split('=== MORNING BRAIN START ===');
        const lastBlock = blocks[blocks.length - 1] || '';
        const timestampMatch = lastBlock.match(/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);
        const timestamp = timestampMatch?.[1] || '';
        // Extract the summary section (markdown table + completion notes)
        const summaryStart = lastBlock.indexOf('**Morning Brain Complete');
        const summary = summaryStart > -1 ? lastBlock.slice(summaryStart).split('=== MORNING BRAIN DONE ===')[0].trim() : '';
        if (!summary) return null;
        // Parse table rows
        const specRows = summary.split('\n')
          .filter(l => l.startsWith('|') && !l.includes('---') && !l.includes('Priority'))
          .map(l => l.split('|').map(c => c.trim()).filter(Boolean));
        const completionNote = summary.match(/\*\*(\d+ pilot completions[^*]*)\*\*/)?.[1] || '';
        return (
          <SectionCard title={`Morning Brain — ${timestamp.split(' ')[0] || 'Today'}`} className="mt-4">
            {specRows.length > 0 && (
              <div className="overflow-x-auto mb-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border bg-muted">
                      <th className="text-left py-2 pl-3 pr-2">Priority</th>
                      <th className="text-left py-2 px-2">Spec</th>
                      <th className="text-left py-2 px-2">Product</th>
                      <th className="text-left py-2 pl-2 pr-3">Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specRows.map((cells, i) => (
                      <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                        <td className="py-2 pl-3 pr-2"><SignalPill label={cells[0]?.replace(/\*/g, '') || ''} tone={cells[0]?.includes('P0') ? 'error' : cells[0]?.includes('P1') ? 'warning' : 'neutral'} /></td>
                        <td className="py-2 px-2 text-foreground font-mono text-[10px]">{cells[1]?.replace(/`/g, '') || ''}</td>
                        <td className="py-2 px-2 text-muted-foreground">{cells[2] || ''}</td>
                        <td className="py-2 pl-2 pr-3 text-muted-foreground">{cells[3] || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {completionNote && <p className="text-xs text-muted-foreground">{completionNote}</p>}
          </SectionCard>
        );
      })()}

      {/* ── ROW 4: Action Items ─────────────────────────────────── */}
      <ActionItems todoMd={todoMd} />

      {/* ── Awaiting Approval ──────────────────────────────────── */}
      {pendingGates.length > 0 && (
        <SectionCard title={`Awaiting Your Approval (${pendingGates.length})`} className="mt-4">
          <div className="space-y-3">
            {pendingGates.map((gate, i) => (
              <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-foreground">{gate.product}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{new Date(gate.builtAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{gate.summary}</p>
                <div className="flex gap-2">
                  <a href={gate.previewUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary no-underline hover:bg-primary/20">Preview →</a>
                  <a href={gate.prUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary no-underline hover:bg-primary/20">Review PR →</a>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      {pendingGates.length === 0 && (
        <div className="mt-4 text-xs text-muted-foreground px-1">No deployments waiting for approval.</div>
      )}

      {/* Product Pipeline + Market Intelligence moved up */}

      {/* ── Issues Trend ──────────────────────────────────── */}
      <SectionCard title="Issues Trend (all products, 90 days)" className="mt-4">
        <IssueTrendChart openIssues={allIssues} closedIssues={closedIssues} days={90} />
      </SectionCard>

      {/* ── SDLC Violations ───────────────────────────────── */}
      {violationsMd && (() => {
        const rawLines = violationsMd.split('\n').filter(l => l.startsWith('|') && !l.match(/^\|[\s-:|]+\|$/) && !l.includes('| Date '));
        const violations = rawLines.filter(l => { const c = l.split('|').map(s => s.trim()).filter(Boolean); return c.length >= 4 && c[0].match(/\d{4}/); });
        return violations.length > 0 ? (
          <SectionCard title={`SDLC Violations (${violations.length})`} className="mt-4">
            <div className="space-y-1">
              {violations.slice(0, 5).map((l, i) => {
                const c = l.split('|').map(s => s.trim()).filter(Boolean);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-muted-foreground">{c[0]}</span>
                    <span className="text-foreground">{c[1]}</span>
                    <span className="font-mono text-primary">{c[2]}</span>
                    <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${c[3] === 'Critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{c[3]}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        ) : null;
      })()}

      {/* Production Gates moved up (after PDLC) */}

      {/* ── Agent Status ──────────────────────────────────── */}
      {agentMd && (() => {
        const agents = agentMd.split('\n')
          .filter(l => l.startsWith('|') && l.includes('**') && !l.includes('Agent') && !l.match(/^\|[\s-:|]+\|$/))
          .map(l => { const c = l.split('|').map(s => s.trim()).filter(Boolean); return { name: c[0]?.replace(/\*/g, ''), title: c[1], model: c[2] }; });
        return agents.length > 0 ? (
          <SectionCard title={`Agent Team (${agents.length})`} className="mt-4">
            <div className="flex flex-wrap gap-3">
              {agents.map(a => (
                <div key={a.name} className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2">
                  <StatusDot status="good" size="sm" />
                  <span className="text-xs font-semibold text-foreground">{a.name}</span>
                  <span className="text-[10px] text-muted-foreground">{a.title}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null;
      })()}

      {/* Cron Health + Cost Trend moved up to Company Health section */}
    </div>
  );
}
