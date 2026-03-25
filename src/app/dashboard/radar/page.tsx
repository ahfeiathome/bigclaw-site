import {
  fetchRadarStatus,
  fetchRadarScorecard,
  fetchRadarDashboard,
} from '@/lib/github';
import { MetricCard, HealthRow, SignalPill, SectionCard, StatusDot } from '@/components/dashboard';
import { RechartsEquityChart } from '@/components/radar-charts';

interface TableRow {
  cells: string[];
}

function parseMarkdownTable(content: string): TableRow[] {
  const lines = content.split('\n').filter(
    (l) => l.includes('|') && !l.match(/^\|[\s-|]+\|$/)
  );
  if (lines.length <= 1) return [];
  return lines.slice(1).map((line) => ({
    cells: line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean),
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

function parseDashboardMeta(content: string): Record<string, string> {
  const section = extractSection(content, 'Portfolio Summary');
  const rows = parseMarkdownTable(section);
  const meta: Record<string, string> = {};
  for (const row of rows) {
    if (row.cells.length >= 2) meta[row.cells[0]] = row.cells[1];
  }
  return meta;
}

function parseExecSummary(content: string): string[] {
  const section = extractSection(content, 'Exec Summary');
  if (!section) return [];
  const lines = section.split('\n')
    .filter(l => l.startsWith('- ') || l.startsWith('* '))
    .map(l => l.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return section.split('\n')
      .slice(1)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('#'));
  }
  return lines;
}

function parseEquityData(content: string): Array<{ date: string; equity: number; pnl: number }> {
  const section = extractSection(content, 'Equity History');
  const rows = parseMarkdownTable(section);
  return rows.map((row) => {
    const equity = parseFloat(row.cells[1]?.replace(/[$,]/g, '') || '0');
    const pnl = parseFloat(row.cells[2]?.replace(/[$,]/g, '') || '0');
    return { date: row.cells[0] || '', equity, pnl };
  });
}

function PositionsTable({ content }: { content: string }) {
  const section = extractSection(content, 'Positions');
  const rows = parseMarkdownTable(section);

  return (
    <SectionCard title="Open Positions" className="mb-4">
      {rows.length === 0 ? (
        <div className="text-xs text-gray-400 py-4 text-center">No open positions</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="text-left py-2.5 pr-4 pl-3">Symbol</th>
                <th className="text-right py-2.5 px-2">Qty</th>
                <th className="text-right py-2.5 px-2">Entry</th>
                <th className="text-right py-2.5 px-2">Current</th>
                <th className="text-right py-2.5 px-2">P/L</th>
                <th className="text-right py-2.5 px-2">P/L %</th>
                <th className="text-right py-2.5 pl-2">Stop</th>
                <th className="text-right py-2.5 pl-2 pr-3">Target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const pnlPct = row.cells[5] || '';
                const isPos = !pnlPct.includes('-') && pnlPct !== '0%';
                const isNeg = pnlPct.includes('-');
                return (
                  <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''} hover:bg-blue-50/50 transition-colors`}>
                    <td className="py-2.5 pr-4 pl-3 font-mono font-semibold text-gray-900">{row.cells[0]}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-gray-600">{row.cells[1]}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-gray-600">{row.cells[2]}</td>
                    <td className="py-2.5 px-2 text-right font-mono text-gray-600">{row.cells[3]}</td>
                    <td className={`py-2.5 px-2 text-right font-mono font-semibold ${isPos ? 'text-green-600' : isNeg ? 'text-red-600' : 'text-gray-600'}`}>
                      {row.cells[4]}
                    </td>
                    <td className={`py-2.5 px-2 text-right font-mono font-semibold ${isPos ? 'text-green-600' : isNeg ? 'text-red-600' : 'text-gray-600'}`}>
                      {pnlPct}
                    </td>
                    <td className="py-2.5 pl-2 text-right font-mono text-red-400">{row.cells[6]}</td>
                    <td className="py-2.5 pl-2 pr-3 text-right font-mono text-green-500">{row.cells[7]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function TradeHistory({ tradeLog }: { tradeLog: string | null }) {
  if (!tradeLog) return null;
  const rows = parseMarkdownTable(tradeLog);

  return (
    <SectionCard title="Trade History" className="mb-4">
      {rows.length === 0 ? (
        <div className="text-xs text-gray-400 py-4 text-center">No trades yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
                <th className="text-left py-2.5 pr-3 pl-3">Date</th>
                <th className="text-left py-2.5 px-2">Action</th>
                <th className="text-left py-2.5 px-2">Symbol</th>
                <th className="text-right py-2.5 px-2">Qty</th>
                <th className="text-right py-2.5 px-2">Price</th>
                <th className="text-right py-2.5 px-2">Amount</th>
                <th className="text-left py-2.5 pl-2 pr-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''} hover:bg-blue-50/50 transition-colors`}>
                  <td className="py-2.5 pr-3 pl-3 font-mono text-gray-400">{row.cells[0]?.slice(0, 10)}</td>
                  <td className={`py-2.5 px-2 font-mono font-semibold ${
                    row.cells[1] === 'BUY' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {row.cells[1]}
                  </td>
                  <td className="py-2.5 px-2 font-mono font-semibold text-gray-900">{row.cells[2]}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-gray-600">{row.cells[3]}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-gray-600">{row.cells[4]}</td>
                  <td className="py-2.5 px-2 text-right font-mono text-gray-600">{row.cells[5]}</td>
                  <td className="py-2.5 pl-2 pr-3 text-gray-400 max-w-[200px] truncate">{row.cells[6]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

export default async function RadarPage() {
  const [tradeLog, scorecard, dashboard] = await Promise.all([
    fetchRadarStatus(),
    fetchRadarScorecard(),
    fetchRadarDashboard(),
  ]);

  if (!dashboard) {
    return (
      <div className="text-center py-20 text-gray-500 animate-fade-in">
        <div className="text-3xl font-mono mb-2">--</div>
        <div>RADAR dashboard data not available yet.</div>
        <div className="text-xs mt-1">Run the RADAR trading loop to generate dashboard data.</div>
      </div>
    );
  }

  const meta = parseDashboardMeta(dashboard);
  const execSummaryLines = parseExecSummary(dashboard);
  const equityData = parseEquityData(dashboard);
  const pead = parseMarkdownTable(extractSection(dashboard, 'PEAD'));
  const momentum = parseMarkdownTable(extractSection(dashboard, 'Momentum'));
  const btd = parseMarkdownTable(extractSection(dashboard, 'BTD'));
  const strategies = scorecard ? parseMarkdownTable(extractSection(scorecard, 'Master Scorecard')) : [];

  const constitutionRows = parseMarkdownTable(extractSection(dashboard, 'Constitution Status'));
  const gateRows = parseMarkdownTable(extractSection(dashboard, 'Gate Progress'));

  const pnlValue = meta['Daily P/L'] || '$0.00';
  const isPositive = !pnlValue.includes('-') && pnlValue !== '$0.00';
  const isNegative = pnlValue.includes('-');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <StatusDot status={meta['Phase'] === 'Paper' ? 'warn' : 'good'} size="lg" />
          <div>
            <div className="text-lg font-semibold text-gray-900">RADAR Trading System</div>
            <div className="text-xs text-gray-500">
              Systematic capital compounder | Constitution enforced | All trades logged
            </div>
          </div>
        </div>
        <SignalPill
          label={meta['Phase'] === 'Paper' ? 'PAPER MODE' : 'LIVE'}
          tone={meta['Phase'] === 'Paper' ? 'warning' : 'success'}
        />
      </div>

      {/* Exec Summary */}
      {execSummaryLines.length > 0 && (
        <SectionCard title="Executive Summary" className="mb-6">
          <div className="space-y-1.5">
            {execSummaryLines.map((line, i) => (
              <p key={i} className="text-sm text-gray-500 leading-relaxed">{line}</p>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Hero MetricCards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard label="Equity" value={meta['Equity'] || '--'} trend="up" />
        <MetricCard label="Cash" value={meta['Cash'] || '--'} trend="flat" />
        <MetricCard
          label="Daily P/L"
          value={pnlValue}
          trend={isPositive ? 'up' : isNegative ? 'down' : 'flat'}
        />
        <MetricCard label="Positions" value={meta['Positions'] || '0'} />
        <MetricCard label="Deployed" value={meta['Deployed'] || '0%'} subtitle={`Reserve: ${meta['Reserve'] || '100%'}`} />
      </div>

      {/* Performance stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard label="Win Rate" value={meta['Win Rate'] || '--'} />
        <MetricCard label="Sharpe" value={meta['Sharpe'] || '--'} />
        <MetricCard label="Phase" value={meta['Phase'] || '--'} />
        <MetricCard label="Reserve" value={meta['Reserve'] || '--'} />
      </div>

      {/* Recharts Equity Chart */}
      <SectionCard title="Equity Curve" className="mb-4">
        <RechartsEquityChart data={equityData} />
      </SectionCard>

      {/* Positions Table */}
      <PositionsTable content={dashboard} />

      {/* Signal Feeds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { title: 'PEAD (Earnings)', rows: pead },
          { title: 'Momentum (Trend)', rows: momentum },
          { title: 'BTD (Mean Reversion)', rows: btd },
        ].map((feed) => (
          <SectionCard key={feed.title} title={feed.title}>
            <div className="space-y-2">
              {feed.rows.map((row, i) => (
                <div key={i} className="flex justify-between items-center text-xs gap-2">
                  <span className="text-gray-500 shrink-0">{row.cells[0]}</span>
                  <SignalPill
                    label={row.cells[1]}
                    tone={
                      row.cells[1]?.toLowerCase().includes('buy') || row.cells[1]?.toLowerCase().includes('strong')
                        ? 'success'
                        : row.cells[1]?.toLowerCase().includes('sell') || row.cells[1]?.toLowerCase().includes('weak')
                        ? 'error'
                        : 'neutral'
                    }
                  />
                </div>
              ))}
              {feed.rows.length === 0 && <div className="text-xs text-gray-400">No data</div>}
            </div>
          </SectionCard>
        ))}
      </div>

      {/* Constitution + Gate */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Constitution -- 10 Trading Laws">
          <div className="space-y-2.5">
            {constitutionRows.map((row, i) => {
              const passed = row.cells[1]?.includes('PASS') || row.cells[1]?.includes('pass');
              const warned = row.cells[1]?.includes('WARN') || row.cells[1]?.includes('warn');
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-base ${passed ? 'text-green-600' : warned ? 'text-amber-500' : 'text-red-600'}`}>
                      {passed ? '\u2713' : warned ? '!' : '\u2717'}
                    </span>
                    <span className="text-gray-500">{row.cells[0]}</span>
                  </div>
                  <SignalPill
                    label={passed ? 'PASS' : warned ? 'WARN' : row.cells[1] || '?'}
                    tone={passed ? 'success' : warned ? 'warning' : 'error'}
                  />
                </div>
              );
            })}
            {constitutionRows.length === 0 && <div className="text-xs text-gray-400">Constitution data not available</div>}
          </div>
        </SectionCard>
        <SectionCard title="Paper to Live Gate Progress">
          <div className="space-y-3">
            {gateRows.map((row, i) => {
              const [criterion, target, current, status] = row.cells;
              const met = status?.includes('PASS') || status?.includes('pass') || status?.includes('Met') || status?.includes('met');
              const pending = status?.includes('Pending') || status?.includes('pending') || status?.includes('WIP');
              const pct = met ? 100 : pending ? 10 : 50;
              return (
                <HealthRow
                  key={i}
                  label={criterion}
                  value={`${current || '--'} / ${target}`}
                  status={met ? 'good' : pending ? 'warn' : 'bad'}
                  bar={pct}
                />
              );
            })}
            {gateRows.length === 0 && <div className="text-xs text-gray-400">Gate criteria not available</div>}
          </div>
        </SectionCard>
      </div>

      {/* Trade History */}
      <TradeHistory tradeLog={tradeLog} />

      {/* Strategy Scorecard */}
      {strategies.length > 0 && (
        <SectionCard title="Strategy Scorecard">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100 bg-gray-50">
                  <th className="text-left py-2.5 pr-2 pl-3">#</th>
                  <th className="text-left py-2.5 px-2">Strategy</th>
                  <th className="text-center py-2.5 px-1">Signal</th>
                  <th className="text-center py-2.5 px-1">Data</th>
                  <th className="text-center py-2.5 px-1">Auto</th>
                  <th className="text-center py-2.5 px-1">Indep</th>
                  <th className="text-center py-2.5 px-1">Fit</th>
                  <th className="text-center py-2.5 px-1 font-bold">Total</th>
                  <th className="text-center py-2.5 pl-2 pr-3">Tier</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((row, i) => {
                  const total = parseInt(row.cells[7]?.replace(/[^0-9]/g, '') || '0');
                  const tierTone = total >= 21 ? 'success' as const : total >= 18 ? 'warning' as const : 'neutral' as const;
                  return (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-gray-50/50' : ''} hover:bg-blue-50/50 transition-colors`}>
                      <td className="py-2 pr-2 pl-3 text-gray-400 font-mono">{row.cells[0]}</td>
                      <td className="py-2 px-2 text-gray-700 font-medium">{row.cells[1]}</td>
                      <td className="py-2 px-1 text-center font-mono text-gray-600">{row.cells[2]}</td>
                      <td className="py-2 px-1 text-center font-mono text-gray-600">{row.cells[3]}</td>
                      <td className="py-2 px-1 text-center font-mono text-gray-600">{row.cells[4]}</td>
                      <td className="py-2 px-1 text-center font-mono text-gray-600">{row.cells[5]}</td>
                      <td className="py-2 px-1 text-center font-mono text-gray-600">{row.cells[6]}</td>
                      <td className="py-2 px-1 text-center font-mono font-bold">
                        <SignalPill label={row.cells[7]} tone={tierTone} />
                      </td>
                      <td className="py-2 pl-2 pr-3 text-center font-mono text-gray-600">{row.cells[8]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
