import { fetchFinanceData, fetchHealth, fetchPatrolReport, fetchBandwidth } from '@/lib/github';
import { MetricCard, HealthRow, SignalPill, SectionCard, StatusDot, AgentStatusPanel, SecurityPostureBadge } from '@/components/dashboard';

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

function cleanMarkdown(text: string): string {
  return text.replace(/\*\*/g, '').replace(/~~([^~]+)~~/g, '$1').replace(/`([^`]+)`/g, '$1');
}

function RenderTable({ title, rows, headers }: { title: string; rows: TableRow[]; headers?: string[] }) {
  if (rows.length === 0) return null;
  return (
    <SectionCard title={title}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {headers && headers.length > 0 && (
            <thead>
              <tr className="border-b border-border bg-muted">
                {headers.map((h, i) => (
                  <th key={i} className={`text-left text-xs text-muted-foreground font-medium pb-2.5 pt-2 pr-3 ${i === 0 ? 'pl-3' : ''}`}>
                    {cleanMarkdown(h)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, j) => (
              <tr key={j} className={`border-b border-gray-50 last:border-0 ${j % 2 === 1 ? 'bg-muted/50' : ''} hover:bg-blue-50/50 transition-colors`}>
                {row.cells.map((cell, ci) => (
                  <td key={ci} className={`py-2 pr-3 text-sm ${ci === 0 ? 'font-medium text-foreground/80 pl-3' : 'text-muted-foreground font-mono'}`}>
                    {cleanMarkdown(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

function extractTableHeaders(section: string): string[] {
  const lines = section.split('\n').filter(l => l.includes('|') && !l.match(/^\|[\s-|]+\|$/));
  if (lines.length === 0) return [];
  return lines[0].split('|').map(c => c.trim()).filter(Boolean);
}

export default async function InfraPage() {
  const [finance, healthMd, patrolContent] = await Promise.all([
    fetchFinanceData(),
    fetchHealth(),
    fetchPatrolReport(),
  ]);

  // Parse health metrics for security posture
  const securityMetrics: { label: string; value: string; status: 'good' | 'warn' | 'bad'; bar?: number }[] = [];
  let securityPosture: 'SECURE' | 'WARNING' | 'CRITICAL' = 'SECURE';

  if (healthMd) {
    for (const line of healthMd.split('\n')) {
      if (!line.startsWith('|') || line.match(/^\|[\s-|]+\|$/) || line.includes('Metric')) continue;
      const cols = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cols.length < 2) continue;
      const label = cols[0];
      const value = cols[1];
      const isBad = /DOWN|FAIL|CRITICAL|ERROR/i.test(value);
      const isWarn = /STALE|WARN|HIGH|ALERT/i.test(value);
      const status = isBad ? 'bad' as const : isWarn ? 'warn' as const : 'good' as const;
      if (isBad) securityPosture = 'CRITICAL';
      if (isWarn && securityPosture !== 'CRITICAL') securityPosture = 'WARNING';
      const barMatch = value.match(/([\d.]+)\s*%/);
      securityMetrics.push({ label, value, status, bar: barMatch ? parseFloat(barMatch[1]) : undefined });
    }
  }

  // Parse infrastructure from patrol report
  const patrolInfra = patrolContent ? parseMarkdownTable(extractSection(patrolContent, 'Infrastructure')) : [];
  const patrolTooling = patrolContent ? parseMarkdownTable(extractSection(patrolContent, 'Tooling')) : [];

  // Extract infrastructure-related sections (finance may be null)
  const subscriptionsSection = finance ? extractSection(finance, 'Active Subscriptions') : '';
  const subscriptionRows = parseMarkdownTable(subscriptionsSection);
  const subscriptionHeaders = extractTableHeaders(subscriptionsSection);

  const personalSection = finance ? extractSection(finance, "Michael's Personal AI Subscriptions") : '';
  const personalRows = parseMarkdownTable(personalSection);
  const personalHeaders = extractTableHeaders(personalSection);

  const pricingSection = finance ? (extractSection(finance, 'Pricing \\(current rates\\)') || extractSection(finance, 'Pricing')) : '';
  const pricingRows = parseMarkdownTable(pricingSection);
  const pricingHeaders = extractTableHeaders(pricingSection);

  const agentSection = finance ? extractSection(finance, 'Pi5 Agent Token Usage') : '';
  const agentRows = parseMarkdownTable(agentSection);
  const agentHeaders = extractTableHeaders(agentSection);

  const costTierSection = finance ? extractSection(finance, 'Pi5 Cost Breakdown by Tier') : '';
  const costTierRows = parseMarkdownTable(costTierSection);
  const costTierHeaders = extractTableHeaders(costTierSection);

  const decisionSection = finance ? extractSection(finance, 'Subscription Cost Decisions Log') : '';
  const decisionRows = parseMarkdownTable(decisionSection);
  const decisionHeaders = extractTableHeaders(decisionSection);

  // Count active services
  const activeCount = subscriptionRows.filter(r => r.cells.some(c => c.toLowerCase().includes('active'))).length;
  const totalMonthlyCost = personalRows.reduce((sum, r) => {
    const costCell = r.cells[2] || '';
    const match = costCell.match(/\$?([\d,.]+)/);
    return sum + (match ? parseFloat(match[1]) : 0);
  }, 0);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Infrastructure</h1>
            <span className="text-xs text-muted-foreground font-mono mt-1">Last updated: {new Date().toISOString().slice(0, 10)}</span>
          </div>
          <SignalPill label={`${activeCount} services`} tone="success" />
        </div>
        <div className="text-lg font-semibold text-foreground font-mono">{activeCount} services &middot; ${totalMonthlyCost}/mo &middot; 6 agents online</div>
      </div>

      {/* Hero cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Active Services" value={activeCount} trend="flat" />
        <MetricCard label="Personal AI" value={`$${totalMonthlyCost}/mo`} trend="flat" />
        <MetricCard label="Pi5 Agents" value="6" subtitle="All active" trend="up" />
        <MetricCard label="Free Tiers" value={subscriptionRows.filter(r => r.cells.some(c => c.includes('$0'))).length} subtitle="services" trend="up" />
      </div>

      {/* Agent Status + Security Posture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <AgentStatusPanel />
        <SecurityPostureBadge posture={securityPosture} metrics={securityMetrics.slice(0, 8)} />
      </div>

      {/* Infrastructure Health (from patrol report) */}
      {(patrolInfra.length > 0 || patrolTooling.length > 0) && (
        <div className="mb-6">
          <SectionCard title="System Health (Felix Patrol)">
            <div className="space-y-3">
              {[...patrolInfra, ...patrolTooling].map((row, i) => {
                const value = row.cells[1] || '';
                const isBad = /DOWN|FAIL|CRITICAL/i.test(value);
                const isWarn = /STALE|WARN|HIGH/i.test(value);
                const barMatch = value.match(/([\d.]+)\s*%/);
                return (
                  <HealthRow
                    key={i}
                    label={row.cells[0]}
                    value={value}
                    status={isBad ? 'bad' : isWarn ? 'warn' : 'good'}
                    bar={barMatch ? parseFloat(barMatch[1]) : undefined}
                  />
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Active Subscriptions & Services */}
      <div className="mb-6">
        <RenderTable title="Active Subscriptions & Services" rows={subscriptionRows} headers={subscriptionHeaders} />
      </div>

      {/* Personal AI Subscriptions */}
      <div className="mb-6">
        <RenderTable title="Personal AI Subscriptions (Firm Infrastructure)" rows={personalRows} headers={personalHeaders} />
      </div>

      {/* Two-column: Pricing + Agent Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <RenderTable title="API Pricing (Current Rates)" rows={pricingRows} headers={pricingHeaders} />
        <RenderTable title="Pi5 Cost Breakdown by Tier" rows={costTierRows} headers={costTierHeaders} />
      </div>

      {/* Agent token usage */}
      {agentRows.length > 0 && (
        <div className="mb-6">
          <RenderTable title="Pi5 Agent Token Usage (Lifetime)" rows={agentRows} headers={agentHeaders} />
        </div>
      )}

      {/* Subscription decisions log */}
      {decisionRows.length > 0 && (
        <div className="mb-6">
          <RenderTable title="Subscription Cost Decisions" rows={decisionRows} headers={decisionHeaders} />
        </div>
      )}
    </div>
  );
}
