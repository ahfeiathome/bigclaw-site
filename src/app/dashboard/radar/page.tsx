import {
  fetchRadarStatus,
  fetchRadarScorecard,
  fetchRadarDashboard,
} from '@/lib/github';
import { MetricCard, HealthRow, SignalPill, SectionCard } from '@/components/dashboard';

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

function EquityChart({ content }: { content: string }) {
  const section = extractSection(content, 'Equity History');
  const rows = parseMarkdownTable(section);

  if (rows.length < 2) {
    return (
      <SectionCard title="Equity Curve" accent="cyan" className="mb-4">
        <div className="h-40 flex items-center justify-center text-xs text-slate-400">
          Chart will appear after 2+ days of trading data
        </div>
      </SectionCard>
    );
  }

  const dataPoints = rows.map((row) => {
    const equity = parseFloat(row.cells[1]?.replace(/[$,]/g, '') || '0');
    const pnl = parseFloat(row.cells[2]?.replace(/[$,]/g, '') || '0');
    return { date: row.cells[0] || '', equity, pnl };
  });

  const equities = dataPoints.map((d) => d.equity);
  const minE = Math.min(...equities) * 0.999;
  const maxE = Math.max(...equities) * 1.001;
  const range = maxE - minE || 1;
  const chartW = 600;
  const chartH = 140;

  const points = dataPoints.map((d, i) => {
    const x = (i / (dataPoints.length - 1)) * chartW;
    const y = chartH - ((d.equity - minE) / range) * chartH;
    return `${x},${y}`;
  });
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${chartW},${chartH} L 0,${chartH} Z`;
  const maxAbsPnl = Math.max(...dataPoints.map((d) => Math.abs(d.pnl)), 1);
  const barW = Math.max(chartW / dataPoints.length - 2, 4);

  return (
    <SectionCard title="Equity Curve" accent="cyan" className="mb-4">
      <div className="flex justify-end mb-2">
        <span className="text-[10px] text-slate-400 font-mono">
          ${minE.toLocaleString()} -- ${maxE.toLocaleString()}
        </span>
      </div>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-36" preserveAspectRatio="none">
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(6,182,212)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="rgb(6,182,212)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((pct) => (
          <line key={pct} x1="0" y1={chartH * pct} x2={chartW} y2={chartH * pct}
            stroke="rgb(226,232,240)" strokeWidth="0.5" strokeDasharray="4" />
        ))}
        <path d={areaPath} fill="url(#eqGrad)" />
        <path d={linePath} fill="none" stroke="rgb(6,182,212)" strokeWidth="2" />
        {dataPoints.map((d, i) => {
          const x = (i / (dataPoints.length - 1)) * chartW;
          const y = chartH - ((d.equity - minE) / range) * chartH;
          return <circle key={i} cx={x} cy={y} r="3" fill="rgb(6,182,212)" />;
        })}
      </svg>

      <div className="mt-4">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Daily P/L</div>
        <svg viewBox={`0 0 ${chartW} 60`} className="w-full h-14" preserveAspectRatio="none">
          <line x1="0" y1="30" x2={chartW} y2="30" stroke="rgb(226,232,240)" strokeWidth="0.5" />
          {dataPoints.map((d, i) => {
            const x = (i / dataPoints.length) * chartW + barW / 2;
            const barH = (Math.abs(d.pnl) / maxAbsPnl) * 28;
            const y = d.pnl >= 0 ? 30 - barH : 30;
            const color = d.pnl >= 0 ? 'rgb(74,222,128)' : 'rgb(248,113,113)';
            return (
              <rect key={i} x={x} y={y} width={barW} height={barH || 1}
                fill={color} rx="1" opacity="0.8" />
            );
          })}
        </svg>
        <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
          {dataPoints.length > 0 && <span>{dataPoints[0].date}</span>}
          {dataPoints.length > 1 && <span>{dataPoints[dataPoints.length - 1].date}</span>}
        </div>
      </div>
    </SectionCard>
  );
}

function PositionsTable({ content }: { content: string }) {
  const section = extractSection(content, 'Positions');
  const rows = parseMarkdownTable(section);

  return (
    <SectionCard title="Open Positions" accent="green" className="mb-4">
      {rows.length === 0 ? (
        <div className="text-xs text-slate-400 py-4 text-center">No open positions</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-200">
                <th className="text-left py-2 pr-4">Symbol</th>
                <th className="text-right py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Entry</th>
                <th className="text-right py-2 px-2">Current</th>
                <th className="text-right py-2 px-2">P/L</th>
                <th className="text-right py-2 px-2">P/L %</th>
                <th className="text-right py-2 pl-2">Stop</th>
                <th className="text-right py-2 pl-2">Target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const pnlPct = row.cells[5] || '';
                const isPos = !pnlPct.includes('-') && pnlPct !== '0%';
                const isNeg = pnlPct.includes('-');
                return (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-mono font-semibold text-slate-800">{row.cells[0]}</td>
                    <td className="py-2 px-2 text-right font-mono">{row.cells[1]}</td>
                    <td className="py-2 px-2 text-right font-mono">{row.cells[2]}</td>
                    <td className="py-2 px-2 text-right font-mono">{row.cells[3]}</td>
                    <td className={`py-2 px-2 text-right font-mono ${isPos ? 'text-green-600' : isNeg ? 'text-red-600' : ''}`}>
                      {row.cells[4]}
                    </td>
                    <td className={`py-2 px-2 text-right font-mono ${isPos ? 'text-green-600' : isNeg ? 'text-red-600' : ''}`}>
                      {pnlPct}
                    </td>
                    <td className="py-2 pl-2 text-right font-mono text-red-600/60">{row.cells[6]}</td>
                    <td className="py-2 pl-2 text-right font-mono text-green-600/60">{row.cells[7]}</td>
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
    <SectionCard title="Trade History" accent="blue" className="mb-4">
      {rows.length === 0 ? (
        <div className="text-xs text-slate-400 py-4 text-center">No trades yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-200">
                <th className="text-left py-2 pr-3">Date</th>
                <th className="text-left py-2 px-2">Action</th>
                <th className="text-left py-2 px-2">Symbol</th>
                <th className="text-right py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Price</th>
                <th className="text-right py-2 px-2">Amount</th>
                <th className="text-left py-2 pl-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-mono text-slate-400">{row.cells[0]?.slice(0, 10)}</td>
                  <td className={`py-2 px-2 font-mono font-semibold ${
                    row.cells[1] === 'BUY' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {row.cells[1]}
                  </td>
                  <td className="py-2 px-2 font-mono">{row.cells[2]}</td>
                  <td className="py-2 px-2 text-right font-mono">{row.cells[3]}</td>
                  <td className="py-2 px-2 text-right font-mono">{row.cells[4]}</td>
                  <td className="py-2 px-2 text-right font-mono">{row.cells[5]}</td>
                  <td className="py-2 pl-2 text-slate-400 max-w-[200px] truncate">{row.cells[6]}</td>
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
      <div className="text-center py-20 text-slate-400">
        <div className="text-2xl mb-2">--</div>
        <div>RADAR dashboard data not available yet.</div>
        <div className="text-xs mt-1">Run the RADAR trading loop to generate dashboard data.</div>
      </div>
    );
  }

  const meta = parseDashboardMeta(dashboard);
  const execSummaryLines = parseExecSummary(dashboard);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-base font-medium text-slate-800">RADAR Trading System</div>
          <div className="text-xs text-slate-400">
            Systematic capital compounder | Constitution enforced | All trades logged
          </div>
        </div>
        <SignalPill
          label={meta['Phase'] === 'Paper' ? 'PAPER MODE' : 'LIVE'}
          tone={meta['Phase'] === 'Paper' ? 'warning' : 'success'}
        />
      </div>

      {/* Exec Summary */}
      {execSummaryLines.length > 0 && (
        <SectionCard title="Executive Summary" accent="cyan" className="mb-6 bg-gradient-to-r from-slate-50 to-white">
          <div className="space-y-1.5">
            {execSummaryLines.map((line, i) => (
              <p key={i} className="text-sm text-slate-600 leading-relaxed">{line}</p>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Hero MetricCards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard label="Equity" value={meta['Equity'] || '--'} color="blue" />
        <MetricCard label="Cash" value={meta['Cash'] || '--'} color="green" />
        <MetricCard
          label="Daily P/L"
          value={pnlValue}
          color={isPositive ? 'green' : isNegative ? 'red' : 'blue'}
        />
        <MetricCard label="Positions" value={meta['Positions'] || '0'} color="purple" />
        <MetricCard label="Deployed" value={meta['Deployed'] || '0%'} color="amber" subtitle={`Reserve: ${meta['Reserve'] || '100%'}`} />
      </div>

      {/* Performance stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 shadow-md bg-white p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Win Rate</div>
          <div className="text-lg font-mono font-semibold text-slate-800">{meta['Win Rate'] || '--'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 shadow-md bg-white p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sharpe</div>
          <div className="text-lg font-mono font-semibold text-slate-800">{meta['Sharpe'] || '--'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 shadow-md bg-white p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phase</div>
          <div className="text-lg font-mono font-semibold text-slate-800">{meta['Phase'] || '--'}</div>
        </div>
        <div className="rounded-xl border border-slate-200 shadow-md bg-white p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Reserve</div>
          <div className="text-lg font-mono font-semibold text-slate-800">{meta['Reserve'] || '--'}</div>
        </div>
      </div>

      {/* Charts */}
      <EquityChart content={dashboard} />

      {/* Positions Table */}
      <PositionsTable content={dashboard} />

      {/* Signal Feeds */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { title: 'PEAD (Earnings)', rows: pead, accent: 'cyan' as const },
          { title: 'Momentum (Trend)', rows: momentum, accent: 'blue' as const },
          { title: 'BTD (Mean Reversion)', rows: btd, accent: 'green' as const },
        ].map((feed) => (
          <SectionCard key={feed.title} title={feed.title} accent={feed.accent}>
            <div className="space-y-2">
              {feed.rows.map((row, i) => (
                <div key={i} className="flex justify-between items-center text-xs gap-2">
                  <span className="text-slate-500 shrink-0">{row.cells[0]}</span>
                  <span className="font-mono text-slate-700">{row.cells[1]}</span>
                </div>
              ))}
              {feed.rows.length === 0 && <div className="text-xs text-slate-400">No data</div>}
            </div>
          </SectionCard>
        ))}
      </div>

      {/* Constitution + Gate as HealthRows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Constitution -- 10 Trading Laws" accent="amber">
          <div className="space-y-2.5">
            {constitutionRows.map((row, i) => {
              const passed = row.cells[1]?.includes('PASS') || row.cells[1]?.includes('pass');
              const warned = row.cells[1]?.includes('WARN') || row.cells[1]?.includes('warn');
              return (
                <HealthRow
                  key={i}
                  label={row.cells[0]}
                  value={passed ? 'PASS' : warned ? 'WARN' : row.cells[1] || '?'}
                  status={passed ? 'good' : warned ? 'warn' : 'bad'}
                  icon={<span className="text-xs">{passed ? '>' : warned ? '!' : 'x'}</span>}
                />
              );
            })}
            {constitutionRows.length === 0 && <div className="text-xs text-slate-400">Constitution data not available</div>}
          </div>
        </SectionCard>
        <SectionCard title="Paper to Live Gate Progress" accent="purple">
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
            {gateRows.length === 0 && <div className="text-xs text-slate-400">Gate criteria not available</div>}
          </div>
        </SectionCard>
      </div>

      {/* Trade History */}
      <TradeHistory tradeLog={tradeLog} />

      {/* Strategy Scorecard */}
      {strategies.length > 0 && (
        <SectionCard title="Strategy Scorecard" accent="purple">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-200">
                  <th className="text-left py-2 pr-2">#</th>
                  <th className="text-left py-2 px-2">Strategy</th>
                  <th className="text-center py-2 px-1">Signal</th>
                  <th className="text-center py-2 px-1">Data</th>
                  <th className="text-center py-2 px-1">Auto</th>
                  <th className="text-center py-2 px-1">Indep</th>
                  <th className="text-center py-2 px-1">Fit</th>
                  <th className="text-center py-2 px-1 font-bold">Total</th>
                  <th className="text-center py-2 pl-2">Tier</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((row, i) => {
                  const total = parseInt(row.cells[7]?.replace(/[^0-9]/g, '') || '0');
                  const tierColor = total >= 21 ? 'text-green-600' : total >= 18 ? 'text-amber-600' : 'text-slate-500';
                  return (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-1.5 pr-2 text-slate-400">{row.cells[0]}</td>
                      <td className="py-1.5 px-2 text-slate-700">{row.cells[1]}</td>
                      <td className="py-1.5 px-1 text-center font-mono">{row.cells[2]}</td>
                      <td className="py-1.5 px-1 text-center font-mono">{row.cells[3]}</td>
                      <td className="py-1.5 px-1 text-center font-mono">{row.cells[4]}</td>
                      <td className="py-1.5 px-1 text-center font-mono">{row.cells[5]}</td>
                      <td className="py-1.5 px-1 text-center font-mono">{row.cells[6]}</td>
                      <td className={`py-1.5 px-1 text-center font-mono font-bold ${tierColor}`}>{row.cells[7]}</td>
                      <td className="py-1.5 pl-2 text-center">{row.cells[8]}</td>
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
