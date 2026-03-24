import { fetchFinanceData } from '@/lib/github';
import { MetricCard, HealthRow, SignalPill, SectionCard } from '@/components/dashboard';

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

interface FinanceKpi {
  label: string;
  value: string;
  status: 'green' | 'amber' | 'red' | 'neutral';
}

function extractKpis(content: string): FinanceKpi[] {
  const kpis: FinanceKpi[] = [];

  const burnMatch = content.match(/(?:monthly\s+)?burn[:\s]+\$?([\d,.]+\s*(?:\/mo)?)/i);
  if (burnMatch) {
    kpis.push({
      label: 'Monthly Burn',
      value: burnMatch[1].includes('$') ? burnMatch[1] : `$${burnMatch[1]}`,
      status: 'neutral',
    });
  }

  const costMatch = content.match(/(?:total|monthly)\s+(?:cost|spend)[:\s]+\$?([\d,.]+)/i);
  if (costMatch && !burnMatch) {
    kpis.push({ label: 'Monthly Cost', value: `$${costMatch[1]}`, status: 'neutral' });
  }

  const freeMatch = content.match(/free[- ]tier[^:]*[:\s]+([\d]+(?:\.\d+)?%)/i);
  if (freeMatch) {
    const pct = parseFloat(freeMatch[1]);
    kpis.push({
      label: 'Free Tier Usage',
      value: freeMatch[1],
      status: pct >= 80 ? 'red' : pct >= 60 ? 'amber' : 'green',
    });
  } else if (content.toLowerCase().includes('free tier') || content.toLowerCase().includes('free-tier')) {
    kpis.push({ label: 'Free Tier', value: 'Active', status: 'green' });
  }

  const apiMatch = content.match(/(?:api|claude|anthropic|openai)\s+(?:cost|spend|usage)[:\s]+\$?([\d,.]+)/i);
  if (apiMatch) {
    kpis.push({ label: 'API Costs', value: `$${apiMatch[1]}`, status: 'neutral' });
  }

  const revMatch = content.match(/revenue[:\s]+\$?([\d,.]+)/i);
  if (revMatch) {
    kpis.push({ label: 'Revenue', value: `$${revMatch[1]}`, status: 'green' });
  }

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
  const alertSection = extractSection(content, 'Warning') || extractSection(content, 'Alert');
  if (alertSection) {
    alerts.push(...alertSection.split('\n').filter((l) => l.match(/^[-*]\s/)).map((l) => l.replace(/^[-*]\s+/, '').trim()).filter(Boolean));
  }
  const lines = content.split('\n');
  for (const line of lines) {
    if (line.includes('over budget') || line.includes('exceeded')) {
      const cleaned = line.replace(/^[-*#\s]+/, '').trim();
      if (cleaned && !alerts.includes(cleaned)) alerts.push(cleaned);
    }
  }
  return alerts;
}

const kpiColorMap: Record<string, 'green' | 'blue' | 'amber' | 'red' | 'purple'> = {
  green: 'green',
  amber: 'amber',
  red: 'red',
  neutral: 'blue',
};

export default async function FinancePage() {
  const finance = await fetchFinanceData();

  if (!finance) {
    return (
      <div className="text-center py-20 text-slate-400">
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

  // Parse remaining structured data sections
  const allSections: { title: string; rows: TableRow[] }[] = [];
  const headingPattern = /^##+ (.+)$/gm;
  let match;
  while ((match = headingPattern.exec(finance)) !== null) {
    const heading = match[1].trim();
    const section = extractSection(finance, heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const rows = parseMarkdownTable(section);
    if (rows.length > 0) {
      allSections.push({ title: heading, rows });
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-base font-medium text-slate-800">Financial Health</div>
          <div className="text-xs text-slate-400">Source: company/FINANCE.md</div>
        </div>
        <SignalPill
          label={alerts.length > 0 ? 'ALERTS' : 'HEALTHY'}
          tone={alerts.length > 0 ? 'warning' : 'success'}
        />
      </div>

      {/* Hero MetricCards */}
      {kpis.length > 0 && (
        <div className={`grid gap-4 mb-6 ${
          kpis.length <= 2 ? 'grid-cols-2' :
          kpis.length === 3 ? 'grid-cols-3' :
          'grid-cols-2 md:grid-cols-4'
        }`}>
          {kpis.map((kpi, i) => (
            <MetricCard
              key={i}
              label={kpi.label}
              value={kpi.value}
              color={kpiColorMap[kpi.status]}
            />
          ))}
        </div>
      )}

      {/* Alerts as HealthRows */}
      {alerts.length > 0 && (
        <SectionCard title="Cost Alerts" accent="red" className="mb-6 border-red-200 bg-red-50/30">
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="shrink-0 mt-1 w-2 h-2 rounded-full bg-red-400" />
                <span className="text-slate-700">{alert}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Cost Breakdown as HealthRows with bars */}
      {costItems.length > 0 && (
        <SectionCard title="Cost Breakdown" accent="amber" className="mb-6">
          <div className="space-y-3">
            {costItems.map((item, i) => (
              <HealthRow
                key={i}
                label={item.category}
                value={item.amount}
                status={item.status === 'red' ? 'bad' : item.status === 'green' ? 'good' : 'good'}
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Free Tier Usage as HealthRows with bars */}
      {freeTierItems.length > 0 && (
        <SectionCard title="Free Tier Usage" accent="green" className="mb-6">
          <div className="space-y-3">
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
        </SectionCard>
      )}

      {/* Remaining structured data as SectionCards with HealthRows */}
      {allSections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allSections.map((sec, i) => (
            <SectionCard key={i} title={sec.title} accent="slate">
              <div className="space-y-2.5">
                {sec.rows.map((row, j) => (
                  <HealthRow
                    key={j}
                    label={row.cells[0]}
                    value={row.cells.slice(1).join(' | ')}
                    status="good"
                  />
                ))}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </div>
  );
}
