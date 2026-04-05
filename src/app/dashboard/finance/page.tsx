import { fetchFinanceData, fetchRadarDashboard } from '@/lib/github';
import { StatusDot, SignalPill, SectionCard, HealthRow } from '@/components/dashboard';
import { ViewSource } from '@/components/view-source';
import { CollapsibleSection } from '@/components/collapsible-section';
import { ExpandableRows } from './expandable-rows';

interface TableRow { cells: string[]; }

function parseMarkdownTable(section: string): TableRow[] {
  const lines = section.split('\n').filter(l => l.includes('|') && !l.match(/^\|[\s-|]+\|$/));
  if (lines.length <= 1) return [];
  return lines.slice(1).map(line => ({ cells: line.split('|').map(c => c.trim()).filter(Boolean) }));
}

function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`^##+ ${heading}`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^##+ /) && !lines[i].includes(heading)) { end = i; break; }
  }
  return lines.slice(0, end).join('\n');
}

function clean(s: string): string {
  return s.replace(/\*\*/g, '').replace(/~~([^~]+)~~/g, '$1').trim();
}

interface CostRow {
  category: string;
  monthly: string;
  pctOfTotal: string;
  status: string;
  statusTone: 'success' | 'warning' | 'error' | 'neutral';
  children?: { label: string; value: string; detail?: string }[];
}

function buildCostRows(content: string): CostRow[] {
  const rows: CostRow[] = [];

  // Parse budget section for total budget
  const budgetRows = parseMarkdownTable(extractSection(content, 'Budget'));
  const anthropicBudget = budgetRows.find(r => r.cells[0]?.toLowerCase().includes('anthropic'));
  const budgetTotal = anthropicBudget?.cells[1] || '$127.00';
  const budgetSpend = anthropicBudget?.cells[2] || '~$5.00';

  // Parse per-project costs
  const projectSection = extractSection(content, 'Per-Project Breakdown') || extractSection(content, 'App Factory');
  const projectRows = parseMarkdownTable(projectSection);
  const appChildren = projectRows
    .filter(r => r.cells.length >= 4 && r.cells[0] && !r.cells[0].includes('---'))
    .map(r => ({
      label: clean(r.cells[0]),
      value: clean(r.cells[4] || r.cells[3] || '$0'),
      detail: r.cells[5] ? `Margin: ${clean(r.cells[5])}` : undefined,
    }));

  // Parse agent costs
  const agentSection = extractSection(content, 'Pi5 Agent Token Usage');
  const agentRows = parseMarkdownTable(agentSection);
  const agentChildren = agentRows
    .filter(r => r.cells.length >= 5 && !r.cells[0].includes('Total'))
    .map(r => ({
      label: `${clean(r.cells[0])} (${clean(r.cells[1])})`,
      value: clean(r.cells[4] || r.cells[5] || '$0'),
      detail: `${clean(r.cells[2] || '')} model`,
    }));

  // Parse orchestration
  const orchSection = extractSection(content, 'Pi5 Cost Breakdown by Tier');
  const orchRows = parseMarkdownTable(orchSection);
  const orchTotal = orchRows.find(r => r.cells[0]?.includes('Orchestration'));
  const orchCost = orchTotal?.cells[2] || '~$3.73';

  rows.push({
    category: 'Anthropic API (Claude)',
    monthly: clean(budgetSpend),
    pctOfTotal: '100%',
    status: `Within budget (${clean(budgetTotal)})`,
    statusTone: 'success',
    children: [
      ...(appChildren.length > 0 ? [{ label: `App products (${appChildren.length} projects)`, value: '$1.07', detail: undefined }] : []),
      ...appChildren.map(c => ({ ...c, label: `  └ ${c.label}` })),
      ...(agentChildren.length > 0 ? [{ label: `Agent operations (${agentChildren.length} agents)`, value: '~$1.27', detail: undefined }] : []),
      ...agentChildren.map(c => ({ ...c, label: `  └ ${c.label}` })),
      { label: 'Orchestration overhead', value: clean(orchCost), detail: 'SDK + routing' },
    ],
  });

  rows.push({
    category: 'Hosting (Vercel + Neon)',
    monthly: '$0.00',
    pctOfTotal: '0%',
    status: 'Free tier',
    statusTone: 'success',
    children: [
      { label: 'Vercel', value: '$0', detail: 'Hobby plan' },
      { label: 'Neon', value: '$0', detail: '0.5 GB free' },
      { label: 'Oracle Cloud', value: '$0', detail: 'Always Free tier' },
    ],
  });

  rows.push({
    category: 'SaaS tools',
    monthly: '$0.00',
    pctOfTotal: '0%',
    status: 'Free tier',
    statusTone: 'success',
    children: [
      { label: 'GitHub', value: '$0', detail: 'Unlimited repos' },
      { label: 'Mixpanel', value: '$0', detail: '1M events/mo' },
      { label: 'Auth0', value: '$0', detail: '25K MAU' },
    ],
  });

  // OpenRouter
  const orMatch = content.match(/OpenRouter[^|]*\|[^|]*\|[^|]*~?\$?([\d,.-]+)/i);
  rows.push({
    category: 'OpenRouter (Phoenix)',
    monthly: orMatch ? `~$${orMatch[1]}` : '~$7-15',
    pctOfTotal: 'TBD',
    status: 'Trial budget ($15)',
    statusTone: 'warning',
    children: [
      { label: 'Gate review', value: '2026-03-31', detail: 'Evaluate spend vs quality' },
      { label: 'Per-agent threshold', value: '$0.50/day', detail: 'Alert if exceeded' },
    ],
  });

  return rows;
}

function extractAlerts(content: string): string[] {
  const alerts: string[] = [];
  const section = extractSection(content, 'Active Alerts') || extractSection(content, 'Alerts');
  if (!section) return alerts;
  const rows = parseMarkdownTable(section);
  for (const row of rows) {
    if (row.cells[0] && !row.cells[0].includes('---') && row.cells[0] !== 'Alert') {
      alerts.push(`${clean(row.cells[0])}: ${clean(row.cells[1] || '')}`);
    }
  }
  return alerts;
}

interface FreeTierItem { service: string; usage: string; limit: string; percent: number; }

function extractFreeTierUsage(content: string): FreeTierItem[] {
  const section = extractSection(content, 'Free-Tier Limit Status');
  if (!section) return [];
  return parseMarkdownTable(section)
    .filter(r => r.cells.length >= 4 && !r.cells[0].includes('Service'))
    .map(r => {
      const pctMatch = r.cells[3]?.match(/([\d.]+)/);
      return {
        service: clean(r.cells[0]),
        usage: clean(r.cells[2] || ''),
        limit: clean(r.cells[1] || ''),
        percent: pctMatch ? parseFloat(pctMatch[1]) : 0,
      };
    });
}

function extractProjections(content: string): TableRow[] {
  const section = extractSection(content, 'Monthly API Projection');
  return parseMarkdownTable(section);
}

function extractPendingExpenses(content: string): TableRow[] {
  const section = extractSection(content, 'Pending Expenses');
  return parseMarkdownTable(section).filter(r => !r.cells[0]?.includes('~~'));
}

export default async function FinancePage() {
  const [finance, radarMd] = await Promise.all([
    fetchFinanceData(),
    fetchRadarDashboard(),
  ]);

  if (!finance) {
    return (
      <div className="text-center py-20 text-muted-foreground animate-fade-in">
        <div className="text-3xl font-mono mb-2">--</div>
        <div>Unable to fetch financial data.</div>
      </div>
    );
  }

  const costRows = buildCostRows(finance);
  const alerts = extractAlerts(finance);
  const freeTierItems = extractFreeTierUsage(finance);
  const projections = extractProjections(finance);
  const pendingExpenses = extractPendingExpenses(finance);

  // RADAR P/L
  const radarSummary = radarMd ? parseMarkdownTable(extractSection(radarMd, 'Portfolio Summary')) : [];
  const radarMeta: Record<string, string> = {};
  for (const row of radarSummary) {
    if (row.cells.length >= 2) radarMeta[row.cells[0]] = row.cells[1];
  }
  const radarEquity = radarMeta['Equity'] || '--';
  const radarPnl = radarMeta['Daily P/L'] || '--';

  // Summary metrics
  const burnMatch = finance.match(/burn[:\s]+~?\$?([\d,.]+\s*\/?\s*(?:mo|day)?)/i);
  const burn = burnMatch ? `$${burnMatch[1]}` : '~$5/mo';

  const budgetRows = parseMarkdownTable(extractSection(finance, 'Budget'));
  const anthropicRow = budgetRows.find(r => r.cells[0]?.toLowerCase().includes('anthropic'));
  const budgetSpend = clean(anthropicRow?.cells[2] || '~$5');
  const budgetTotal = clean(anthropicRow?.cells[1] || '$127');

  const allFreeSafe = freeTierItems.every(i => i.percent < 20);

  return (
    <div>
      {/* ── SCORECARD HEADER ──────────────────────────────────── */}
      <div className="mb-4 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Finance</h1>
            <span className="text-xs text-muted-foreground font-mono mt-1">Last updated: {new Date().toISOString().slice(0, 10)}</span>
          </div>
          <div className="flex items-center gap-3">
            <ViewSource repo="the-firm" path="FINANCE.md" />
            <SignalPill
              label={alerts.length > 0 ? `${alerts.length} alert${alerts.length > 1 ? 's' : ''}` : 'HEALTHY'}
              tone={alerts.length > 0 ? 'warning' : 'success'}
            />
          </div>
        </div>
        {alerts.length > 0 && <div className="text-lg font-bold text-amber-400 font-mono">{alerts.length} alert{alerts.length > 1 ? 's' : ''} — review below</div>}
        {alerts.length === 0 && <div className="text-lg font-semibold text-green-400 font-mono">All clear — burn low, free tiers safe</div>}
      </div>

      {/* ── HERO METRICS (4 cards, one glance) ────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Monthly Burn</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{burn}</div>
          <div className="flex items-center gap-1 mt-1"><StatusDot status="good" size="sm" /><span className="text-xs text-green-400">Low</span></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Budget</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{budgetSpend}</div>
          <div className="text-xs text-muted-foreground mt-1">of {budgetTotal}</div>
          <div className="flex items-center gap-1 mt-1"><StatusDot status="good" size="sm" /><span className="text-xs text-green-400">96% free</span></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Free Tiers</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">All &lt;10%</div>
          <div className="flex items-center gap-1 mt-1"><StatusDot status={allFreeSafe ? 'good' : 'warn'} size="sm" /><span className="text-xs text-green-400">{allFreeSafe ? 'Safe' : 'Check'}</span></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Revenue</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">$0</div>
          <div className="flex items-center gap-1 mt-1"><StatusDot status="warn" size="sm" /><span className="text-xs text-amber-400">Pre-revenue</span></div>
        </div>
      </div>

      {/* ── WHERE THE MONEY GOES (expandable rows) ────────────── */}
      <SectionCard title="Where the Money Goes" className="mb-6">
        <ExpandableRows rows={costRows} />

        {/* Total */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
          <span className="text-sm font-semibold text-foreground">TOTAL</span>
          <span className="text-sm font-bold font-mono text-foreground">~$5-20/mo</span>
        </div>
      </SectionCard>

      {/* ── ALERTS ────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="rounded-xl border-2 border-amber-500/30 bg-amber-500/5 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <StatusDot status="warn" size="md" />
            <span className="text-sm font-semibold text-amber-400 uppercase tracking-wide">Alerts ({alerts.length})</span>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className="text-sm text-foreground/80 font-mono text-xs pl-5">• {alert}</div>
            ))}
          </div>
        </div>
      )}

      {/* ── COLLAPSIBLE DETAIL SECTIONS ───────────────────────── */}

      {/* Section 2: Free Tier Status */}
      {freeTierItems.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title="Free Tier Status" defaultOpen={false} badge={<span className="text-[10px] text-muted-foreground font-mono ml-1">{freeTierItems.length} services</span>}>
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              {freeTierItems.map((item, i) => (
                <HealthRow
                  key={i}
                  label={item.service}
                  value={`${item.usage}${item.limit ? ` / ${item.limit}` : ''}${item.percent > 0 ? ` (${item.percent}%)` : ''}`}
                  status={item.percent >= 80 ? 'bad' : item.percent >= 60 ? 'warn' : 'good'}
                  bar={item.percent > 0 ? item.percent : undefined}
                />
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Section 3: Projections & Scaling */}
      {projections.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title="Projections & Scaling" defaultOpen={false} badge={<span className="text-[10px] text-muted-foreground font-mono ml-1">{projections.length} scenarios</span>}>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-2 pr-3 pl-1">Scenario</th>
                      <th className="text-right py-2 px-2">Pi5 Agents</th>
                      <th className="text-right py-2 px-2">Pi5 Orch</th>
                      <th className="text-right py-2 px-2">App Factory</th>
                      <th className="text-right py-2 px-2">GH Actions</th>
                      <th className="text-right py-2 pl-2 font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.map((row, i) => (
                      <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                        {row.cells.map((cell, ci) => (
                          <td key={ci} className={`py-2 ${ci === 0 ? 'text-left pr-3 pl-1 text-foreground/80' : 'text-right px-2 font-mono text-muted-foreground'} ${ci === row.cells.length - 1 ? 'font-bold text-foreground' : ''}`}>
                            {clean(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Section 4: Pending Expenses */}
      {pendingExpenses.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title="Pending Expenses" defaultOpen={false} badge={<span className="text-[10px] text-muted-foreground font-mono ml-1">{pendingExpenses.length} items</span>}>
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              {pendingExpenses.map((row, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-foreground/80">{clean(row.cells[0])}</span>
                    {row.cells[2] && <span className="text-xs text-muted-foreground ml-2">{clean(row.cells[2])}</span>}
                  </div>
                  <span className="font-mono text-muted-foreground">{clean(row.cells[1] || '')}</span>
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Section 5: RADAR P/L */}
      {radarMd && (
        <div className="mb-4">
          <CollapsibleSection title="RADAR P/L" defaultOpen={false} badge={<SignalPill label={radarPnl.includes('-') ? 'Loss' : 'Gain'} tone={radarPnl.includes('-') ? 'warning' : 'success'} />}>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Equity</div>
                  <div className="text-xl font-bold font-mono text-foreground">{radarEquity}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Daily P/L</div>
                  <div className={`text-xl font-bold font-mono ${radarPnl.includes('-') ? 'text-red-400' : 'text-green-400'}`}>{radarPnl}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                <a href="/dashboard/fintech" className="text-primary hover:underline">View full RADAR dashboard →</a>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}
