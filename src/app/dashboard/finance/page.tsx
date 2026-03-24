import { fetchFinanceData } from '@/lib/github';

interface TableRow {
  cells: string[];
}

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
  const regex = new RegExp(`^##+ ${heading}`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^##+ /) && !lines[i].includes(heading)) {
      end = i;
      break;
    }
  }
  return lines.slice(0, end).join('\n');
}

function extractKeyValue(content: string, pattern: RegExp): string | null {
  const match = content.match(pattern);
  return match ? match[1]?.trim() || match[0]?.trim() : null;
}

function extractBulletItems(section: string): string[] {
  return section
    .split('\n')
    .filter((l) => l.match(/^[-*]\s/))
    .map((l) => l.replace(/^[-*]\s+/, '').trim())
    .filter(Boolean);
}

interface FinanceKpi {
  label: string;
  value: string;
  status: 'green' | 'amber' | 'red' | 'neutral';
}

function extractKpis(content: string): FinanceKpi[] {
  const kpis: FinanceKpi[] = [];
  const lower = content.toLowerCase();

  // Monthly burn
  const burnMatch = content.match(/(?:monthly\s+)?burn[:\s]+\$?([\d,.]+\s*(?:\/mo)?)/i);
  if (burnMatch) {
    kpis.push({
      label: 'Monthly Burn',
      value: burnMatch[1].includes('$') ? burnMatch[1] : `$${burnMatch[1]}`,
      status: 'neutral',
    });
  }

  // Total costs / spend
  const costMatch = content.match(/(?:total|monthly)\s+(?:cost|spend)[:\s]+\$?([\d,.]+)/i);
  if (costMatch && !burnMatch) {
    kpis.push({
      label: 'Monthly Cost',
      value: `$${costMatch[1]}`,
      status: 'neutral',
    });
  }

  // Free tier usage
  const freeMatch = content.match(/free[- ]tier[^:]*[:\s]+([\d]+(?:\.\d+)?%)/i);
  if (freeMatch) {
    const pct = parseFloat(freeMatch[1]);
    kpis.push({
      label: 'Free Tier Usage',
      value: freeMatch[1],
      status: pct >= 80 ? 'red' : pct >= 60 ? 'amber' : 'green',
    });
  } else if (lower.includes('free tier') || lower.includes('free-tier')) {
    kpis.push({
      label: 'Free Tier',
      value: 'Active',
      status: 'green',
    });
  }

  // API costs
  const apiMatch = content.match(/(?:api|claude|anthropic|openai)\s+(?:cost|spend|usage)[:\s]+\$?([\d,.]+)/i);
  if (apiMatch) {
    kpis.push({
      label: 'API Costs',
      value: `$${apiMatch[1]}`,
      status: 'neutral',
    });
  }

  // Revenue
  const revMatch = content.match(/revenue[:\s]+\$?([\d,.]+)/i);
  if (revMatch) {
    kpis.push({
      label: 'Revenue',
      value: `$${revMatch[1]}`,
      status: 'green',
    });
  }

  // Runway
  const runwayMatch = content.match(/runway[:\s]+([\d]+\s*(?:months?|mo))/i);
  if (runwayMatch) {
    const months = parseInt(runwayMatch[1]);
    kpis.push({
      label: 'Runway',
      value: runwayMatch[1],
      status: months <= 3 ? 'red' : months <= 6 ? 'amber' : 'green',
    });
  }

  return kpis;
}

interface CostItem {
  category: string;
  amount: string;
  notes: string;
  status: 'green' | 'amber' | 'red' | 'neutral';
}

function extractCostBreakdown(content: string): CostItem[] {
  const items: CostItem[] = [];

  // Try table-based extraction first
  const sections = ['Cost', 'Breakdown', 'Services', 'Expenses', 'Spending', 'Budget', 'Line Items', 'Monthly'];
  for (const heading of sections) {
    const section = extractSection(content, heading);
    if (!section) continue;
    const rows = parseMarkdownTable(section);
    for (const row of rows) {
      if (row.cells.length >= 2) {
        const amount = row.cells[1] || '';
        const isOver = amount.toLowerCase().includes('over') || row.cells.some((c) => c.includes('over budget'));
        const isFree = amount.includes('$0') || amount.toLowerCase().includes('free');
        items.push({
          category: row.cells[0].replace(/\*\*/g, ''),
          amount: row.cells[1],
          notes: row.cells[2] || '',
          status: isOver ? 'red' : isFree ? 'green' : 'neutral',
        });
      }
    }
  }

  // Fallback: extract from bullet lists with dollar amounts
  if (items.length === 0) {
    const bulletPattern = /^[-*]\s+\*?\*?([^:*]+)\*?\*?[:\s]+\$?([\d,.]+(?:\.\d+)?(?:\s*\/\s*mo)?)/gm;
    let match;
    while ((match = bulletPattern.exec(content)) !== null) {
      items.push({
        category: match[1].trim(),
        amount: match[2].includes('$') ? match[2] : `$${match[2]}`,
        notes: '',
        status: 'neutral',
      });
    }
  }

  return items;
}

interface FreeTierItem {
  service: string;
  usage: string;
  limit: string;
  percent: number;
}

function extractFreeTierUsage(content: string): FreeTierItem[] {
  const items: FreeTierItem[] = [];
  const section = extractSection(content, 'Free') || extractSection(content, 'Tier') || extractSection(content, 'Usage');
  if (!section) return items;

  const rows = parseMarkdownTable(section);
  for (const row of rows) {
    if (row.cells.length >= 2) {
      const pctMatch = row.cells.join(' ').match(/([\d]+(?:\.\d+)?)\s*%/);
      items.push({
        service: row.cells[0].replace(/\*\*/g, ''),
        usage: row.cells[1],
        limit: row.cells[2] || '',
        percent: pctMatch ? parseFloat(pctMatch[1]) : 0,
      });
    }
  }

  return items;
}

function extractAlerts(content: string): string[] {
  const alerts: string[] = [];
  const lower = content.toLowerCase();

  if (lower.includes('warning') || lower.includes('alert')) {
    const alertSection = extractSection(content, 'Warning') || extractSection(content, 'Alert');
    if (alertSection) {
      alerts.push(...extractBulletItems(alertSection));
    }
  }

  // Look for warning emoji lines
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('⚠') || line.includes('🚨') || line.includes('over budget') || line.includes('exceeded')) {
      const cleaned = line.replace(/^[-*#\s]+/, '').trim();
      if (cleaned && !alerts.includes(cleaned)) {
        alerts.push(cleaned);
      }
    }
  }

  return alerts;
}

function buildExecSummary(content: string, kpis: FinanceKpi[], alerts: string[]): string[] {
  const lines: string[] = [];
  const lower = content.toLowerCase();

  // Cost trajectory
  if (lower.includes('increase') || lower.includes('rising') || lower.includes('up from')) {
    lines.push('Cost trajectory trending upward — review line items.');
  } else if (lower.includes('decrease') || lower.includes('stable') || lower.includes('flat') || lower.includes('down from')) {
    lines.push('Costs stable or declining. No budget concerns.');
  } else {
    lines.push('Financial data loaded. Current cost posture below.');
  }

  // Free tier note
  const freeKpi = kpis.find((k) => k.label.includes('Free'));
  if (freeKpi) {
    lines.push(`Free-tier status: ${freeKpi.value}.`);
  }

  // Alert count
  if (alerts.length > 0) {
    lines.push(`${alerts.length} cost alert(s) flagged.`);
  }

  return lines.slice(0, 3); // Max 3 lines
}

function StatusDot({ status }: { status: 'green' | 'amber' | 'red' | 'neutral' }) {
  const colors = {
    green: 'bg-green-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
    neutral: 'bg-slate-400',
  };
  return <span className={`w-2 h-2 rounded-full ${colors[status]} inline-block`} />;
}

function KpiHeroCard({ kpi }: { kpi: FinanceKpi }) {
  const statusColors = {
    green: 'text-green-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    neutral: 'text-foreground',
  };
  const bgColors = {
    green: 'bg-green-50 border-green-200',
    amber: 'bg-amber-50 border-amber-200',
    red: 'bg-red-50 border-red-200',
    neutral: 'bg-slate-50 border-border',
  };

  return (
    <div className={`rounded-lg p-5 border ${bgColors[kpi.status]}`}>
      <div className="flex items-center gap-2 mb-2">
        <StatusDot status={kpi.status} />
        <span className="text-xs text-muted uppercase tracking-wide font-medium">{kpi.label}</span>
      </div>
      <div className={`text-2xl font-mono font-bold ${statusColors[kpi.status]}`}>
        {kpi.value}
      </div>
    </div>
  );
}

function CostBreakdownGrid({ items }: { items: CostItem[] }) {
  if (items.length === 0) return null;

  const statusBorder = {
    green: 'border-l-green-500',
    amber: 'border-l-amber-500',
    red: 'border-l-red-500',
    neutral: 'border-l-slate-300',
  };

  return (
    <div className="mb-6">
      <div className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
        Cost Breakdown
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <div key={i} className={`border border-border rounded-lg p-4 border-l-4 ${statusBorder[item.status]}`}>
            <div className="text-sm text-muted mb-1">{item.category}</div>
            <div className="text-lg font-mono font-semibold text-foreground">{item.amount}</div>
            {item.notes && <div className="text-xs text-muted mt-1">{item.notes}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

function FreeTierBars({ items }: { items: FreeTierItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
        Free Tier Usage
      </div>
      <div className="border border-border rounded-lg p-5 space-y-4">
        {items.map((item, i) => {
          const pct = Math.min(item.percent, 100);
          const color = pct >= 80 ? 'bg-red-500' : pct >= 60 ? 'bg-amber-500' : 'bg-green-500';
          const textColor = pct >= 80 ? 'text-red-600' : pct >= 60 ? 'text-amber-600' : 'text-green-600';

          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-foreground">{item.service}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">{item.usage}{item.limit ? ` / ${item.limit}` : ''}</span>
                  {pct > 0 && <span className={`text-sm font-mono font-semibold ${textColor}`}>{pct}%</span>}
                </div>
              </div>
              {pct > 0 && (
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AlertsSection({ alerts }: { alerts: string[] }) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-6">
      <div className={`border rounded-lg p-5 border-red-200 bg-red-50`}>
        <div className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">Cost Alerts</div>
        <div className="space-y-2">
          {alerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="shrink-0 mt-0.5 w-2 h-2 rounded-full bg-red-400" />
              <span className="text-foreground/90">{alert}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RawDataFallback({ content }: { content: string }) {
  // Parse remaining sections as table-based KPI cards
  const sections: { title: string; rows: TableRow[] }[] = [];
  const headingPattern = /^##+ (.+)$/gm;
  let match;
  while ((match = headingPattern.exec(content)) !== null) {
    const heading = match[1].trim();
    const section = extractSection(content, heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const rows = parseMarkdownTable(section);
    if (rows.length > 0) {
      sections.push({ title: heading, rows });
    }
  }

  if (sections.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((sec, i) => (
        <div key={i} className="border border-border rounded-lg p-5">
          <div className="text-sm font-semibold text-foreground/70 uppercase tracking-wide mb-3">{sec.title}</div>
          <div className="space-y-2.5">
            {sec.rows.map((row, j) => (
              <div key={j} className="flex justify-between items-center text-sm gap-2">
                <span className="text-muted shrink-0">{row.cells[0]}</span>
                <span className="font-mono text-foreground/80">{row.cells.slice(1).join(' | ')}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function FinancePage() {
  const finance = await fetchFinanceData();

  if (!finance) {
    return (
      <div className="text-center py-20 text-muted">
        <div className="text-2xl mb-2">--</div>
        <div>Unable to fetch financial data from GitHub.</div>
        <div className="text-xs mt-2">Ensure GITHUB_TOKEN is set and the company repo is accessible.</div>
      </div>
    );
  }

  const kpis = extractKpis(finance);
  const costItems = extractCostBreakdown(finance);
  const freeTierItems = extractFreeTierUsage(finance);
  const alerts = extractAlerts(finance);
  const execLines = buildExecSummary(finance, kpis, alerts);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">Financial Health</h2>
          <p className="text-xs text-muted">Source: company/FINANCE.md — compiled by CFO (rex)</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${alerts.length > 0 ? 'bg-amber-400' : 'bg-green-400'} animate-pulse`} />
          <span className="text-xs font-mono text-muted uppercase">
            {alerts.length > 0 ? 'ALERTS' : 'HEALTHY'}
          </span>
        </div>
      </div>

      {/* Exec Summary */}
      {execLines.length > 0 && (
        <div className="border border-border rounded-lg p-5 mb-6 bg-slate-50">
          <div className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">Executive Summary</div>
          <div className="space-y-2">
            {execLines.map((line, i) => (
              <p key={i} className="text-sm text-foreground/80 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      )}

      {/* Hero KPI Row */}
      {kpis.length > 0 && (
        <div className={`grid gap-4 mb-6 ${
          kpis.length === 1 ? 'grid-cols-1' :
          kpis.length === 2 ? 'grid-cols-2' :
          kpis.length === 3 ? 'grid-cols-3' :
          'grid-cols-2 md:grid-cols-4'
        }`}>
          {kpis.map((kpi, i) => (
            <KpiHeroCard key={i} kpi={kpi} />
          ))}
        </div>
      )}

      {/* Alerts */}
      <AlertsSection alerts={alerts} />

      {/* Cost Breakdown */}
      <CostBreakdownGrid items={costItems} />

      {/* Free Tier Usage Bars */}
      <FreeTierBars items={freeTierItems} />

      {/* Remaining structured data */}
      <RawDataFallback content={finance} />
    </div>
  );
}
