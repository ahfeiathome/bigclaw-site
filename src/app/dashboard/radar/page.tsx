import {
  fetchRadarStatus,
  fetchRadarScorecard,
  fetchRadarConstitution,
  fetchRadarDashboard,
} from '@/lib/github';
import Link from 'next/link';

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

function EquityChart({ content }: { content: string }) {
  const section = extractSection(content, 'Equity History');
  const rows = parseMarkdownTable(section);

  if (rows.length < 2) {
    return (
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-3">
          Equity Curve
        </div>
        <div className="h-40 flex items-center justify-center text-xs text-muted">
          Chart will appear after 2+ days of trading data
        </div>
      </div>
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

  // Build SVG path for equity line
  const points = dataPoints.map((d, i) => {
    const x = (i / (dataPoints.length - 1)) * chartW;
    const y = chartH - ((d.equity - minE) / range) * chartH;
    return `${x},${y}`;
  });
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${chartW},${chartH} L 0,${chartH} Z`;

  // P&L bars
  const maxAbsPnl = Math.max(...dataPoints.map((d) => Math.abs(d.pnl)), 1);
  const barW = Math.max(chartW / dataPoints.length - 2, 4);

  return (
    <div className="border border-border rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
          Equity Curve
        </div>
        <div className="text-[10px] text-muted font-mono">
          ${minE.toLocaleString()} — ${maxE.toLocaleString()}
        </div>
      </div>

      {/* Equity line chart */}
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-36" preserveAspectRatio="none">
        <defs>
          <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(34,211,238)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(34,211,238)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((pct) => (
          <line key={pct} x1="0" y1={chartH * pct} x2={chartW} y2={chartH * pct}
            stroke="rgb(63,63,70)" strokeWidth="0.5" strokeDasharray="4" />
        ))}
        {/* Area fill */}
        <path d={areaPath} fill="url(#eqGrad)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="rgb(34,211,238)" strokeWidth="2" />
        {/* Data points */}
        {dataPoints.map((d, i) => {
          const x = (i / (dataPoints.length - 1)) * chartW;
          const y = chartH - ((d.equity - minE) / range) * chartH;
          return <circle key={i} cx={x} cy={y} r="3" fill="rgb(34,211,238)" />;
        })}
      </svg>

      {/* P&L bar chart */}
      <div className="mt-4">
        <div className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
          Daily P/L
        </div>
        <svg viewBox={`0 0 ${chartW} 60`} className="w-full h-14" preserveAspectRatio="none">
          {/* Zero line */}
          <line x1="0" y1="30" x2={chartW} y2="30" stroke="rgb(63,63,70)" strokeWidth="0.5" />
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
        <div className="flex justify-between text-[9px] text-muted font-mono mt-1">
          {dataPoints.length > 0 && <span>{dataPoints[0].date}</span>}
          {dataPoints.length > 1 && <span>{dataPoints[dataPoints.length - 1].date}</span>}
        </div>
      </div>
    </div>
  );
}

function PortfolioSummary({ meta }: { meta: Record<string, string> }) {
  const pnlValue = meta['Daily P/L'] || '$0.00';
  const isPositive = !pnlValue.includes('-') && pnlValue !== '$0.00';
  const isNegative = pnlValue.includes('-');

  return (
    <div className="border border-border rounded-lg p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">
          Portfolio Overview
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            meta['Phase'] === 'Paper' ? 'bg-amber-400' : 'bg-green-400'
          }`} />
          <span className="text-[10px] font-mono text-muted uppercase">
            {meta['Phase'] || 'Paper'} Trading
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div>
          <div className="text-[10px] text-muted uppercase tracking-wide mb-1">Equity</div>
          <div className="text-xl font-mono font-bold">{meta['Equity'] || '—'}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted uppercase tracking-wide mb-1">Cash</div>
          <div className="text-xl font-mono">{meta['Cash'] || '—'}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted uppercase tracking-wide mb-1">Daily P/L</div>
          <div className={`text-xl font-mono font-bold ${
            isPositive ? 'text-green-400' : isNegative ? 'text-red-400' : 'text-foreground/60'
          }`}>
            {pnlValue}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted uppercase tracking-wide mb-1">Positions</div>
          <div className="text-xl font-mono">{meta['Positions'] || '0'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 pt-4 border-t border-border">
        <div>
          <div className="text-[10px] text-muted uppercase">Deployed</div>
          <div className="text-sm font-mono">{meta['Deployed'] || '0%'}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted uppercase">Reserve</div>
          <div className="text-sm font-mono">{meta['Reserve'] || '100%'}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted uppercase">Win Rate</div>
          <div className="text-sm font-mono">{meta['Win Rate'] || '—'}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted uppercase">Sharpe</div>
          <div className="text-sm font-mono">{meta['Sharpe'] || '—'}</div>
        </div>
      </div>
    </div>
  );
}

function PositionsTable({ content }: { content: string }) {
  const section = extractSection(content, 'Positions');
  const rows = parseMarkdownTable(section);

  return (
    <div className="border border-border rounded-lg p-4 mb-4">
      <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-3">
        Open Positions
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-muted py-4 text-center">No open positions</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted border-b border-border">
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
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-mono font-semibold">{row.cells[0]}</td>
                    <td className="py-2 px-2 text-right font-mono">{row.cells[1]}</td>
                    <td className="py-2 px-2 text-right font-mono">{row.cells[2]}</td>
                    <td className="py-2 px-2 text-right font-mono">{row.cells[3]}</td>
                    <td className={`py-2 px-2 text-right font-mono ${isPos ? 'text-green-400' : isNeg ? 'text-red-400' : ''}`}>
                      {row.cells[4]}
                    </td>
                    <td className={`py-2 px-2 text-right font-mono ${isPos ? 'text-green-400' : isNeg ? 'text-red-400' : ''}`}>
                      {pnlPct}
                    </td>
                    <td className="py-2 pl-2 text-right font-mono text-red-400/60">{row.cells[6]}</td>
                    <td className="py-2 pl-2 text-right font-mono text-green-400/60">{row.cells[7]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TradeHistory({ tradeLog }: { tradeLog: string | null }) {
  if (!tradeLog) return null;
  const rows = parseMarkdownTable(tradeLog);

  return (
    <div className="border border-border rounded-lg p-4 mb-4">
      <div className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-3">
        Trade History
      </div>
      {rows.length === 0 ? (
        <div className="text-xs text-muted py-4 text-center">No trades yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted border-b border-border">
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
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 pr-3 font-mono text-muted">{row.cells[0]?.slice(0, 10)}</td>
                  <td className={`py-2 px-2 font-mono font-semibold ${
                    row.cells[1] === 'BUY' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {row.cells[1]}
                  </td>
                  <td className="py-2 px-2 font-mono">{row.cells[2]}</td>
                  <td className="py-2 px-2 text-right font-mono">{row.cells[3]}</td>
                  <td className="py-2 px-2 text-right font-mono">{row.cells[4]}</td>
                  <td className="py-2 px-2 text-right font-mono">{row.cells[5]}</td>
                  <td className="py-2 pl-2 text-muted max-w-[200px] truncate">{row.cells[6]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SignalFeedCard({ title, color, rows }: { title: string; color: string; rows: TableRow[] }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className={`text-xs font-semibold ${color} uppercase tracking-wide mb-3`}>
        {title}
      </div>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between items-center text-xs gap-2">
            <span className="text-muted shrink-0">{row.cells[0]}</span>
            <span className="font-mono text-foreground/80">{row.cells[1]}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-xs text-muted">No data</div>
        )}
      </div>
    </div>
  );
}

function ConstitutionStatus({ content }: { content: string }) {
  const section = extractSection(content, 'Constitution Status');
  const rows = parseMarkdownTable(section);

  return (
    <div className="border border-border rounded-lg p-4 mb-4">
      <div className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-3">
        Constitution — 10 Trading Laws
      </div>
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className={`shrink-0 ${
              row.cells[1]?.includes('✅') ? 'text-green-400' :
              row.cells[1]?.includes('⚠️') ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {row.cells[1]?.includes('✅') ? '✓' : row.cells[1]?.includes('⚠️') ? '!' : '✗'}
            </span>
            <span className="text-foreground/80">{row.cells[0]}</span>
            <span className="text-muted text-[10px] ml-auto font-mono">{row.cells[1]}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-xs text-muted">Constitution data not available</div>
        )}
      </div>
    </div>
  );
}

function GateProgress({ content }: { content: string }) {
  const section = extractSection(content, 'Gate Progress');
  const rows = parseMarkdownTable(section);

  return (
    <div className="border border-border rounded-lg p-4 mb-4">
      <div className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-3">
        Paper → Live Gate Progress
      </div>
      <div className="space-y-2">
        {rows.map((row, i) => {
          const [criterion, target, current, status] = row.cells;
          const met = status?.includes('✅');
          const pending = status?.includes('⏳');
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-foreground/80">{criterion}</span>
                <span className={`font-mono text-[10px] ${met ? 'text-green-400' : pending ? 'text-muted' : 'text-red-400'}`}>
                  {current || '—'} / {target}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1">
                <div
                  className={`h-1 rounded-full ${met ? 'bg-green-400' : pending ? 'bg-zinc-600' : 'bg-red-400'}`}
                  style={{ width: met ? '100%' : pending ? '10%' : '50%' }}
                />
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="text-xs text-muted">Gate criteria not available</div>
        )}
      </div>
    </div>
  );
}

function parseExecSummary(content: string): string[] {
  const section = extractSection(content, 'Exec Summary');
  if (!section) return [];
  const lines = section.split('\n')
    .filter(l => l.startsWith('- ') || l.startsWith('* '))
    .map(l => l.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean);
  // If no bullet points, try plain text lines (skip the heading)
  if (lines.length === 0) {
    return section.split('\n')
      .slice(1)
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('#'));
  }
  return lines;
}

function RadarExecSummaryCard({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className="border border-border rounded-lg p-5 mb-6 bg-zinc-900/50">
      <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-3">Executive Summary</div>
      <div className="space-y-1.5">
        {lines.map((line, i) => (
          <p key={i} className="text-xs text-foreground/80 leading-relaxed">{line}</p>
        ))}
      </div>
    </div>
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
      <div className="text-center py-20 text-muted">
        <div className="text-2xl mb-2">📈</div>
        <div>RADAR dashboard data not available yet.</div>
        <div className="text-xs mt-1">Run the RADAR trading loop to generate dashboard data.</div>
      </div>
    );
  }

  const meta = parseDashboardMeta(dashboard);
  const execSummaryLines = parseExecSummary(dashboard);

  // Parse signal feed sections
  const pead = parseMarkdownTable(extractSection(dashboard, 'PEAD'));
  const momentum = parseMarkdownTable(extractSection(dashboard, 'Momentum'));
  const btd = parseMarkdownTable(extractSection(dashboard, 'BTD'));

  // Parse strategies from scorecard
  const strategies = scorecard ? parseMarkdownTable(extractSection(scorecard, 'Master Scorecard')) : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm font-medium">RADAR Trading System</div>
          <div className="text-[10px] text-muted">
            Systematic capital compounder · Constitution enforced · All trades logged
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${
            meta['Phase'] === 'Paper' ? 'bg-amber-400 animate-pulse' : 'bg-green-400 animate-pulse'
          }`} />
          <span className="text-xs font-mono text-muted">
            {meta['Phase'] === 'Paper' ? 'PAPER MODE' : 'LIVE'}
          </span>
        </div>
      </div>

      {/* Exec Summary */}
      <RadarExecSummaryCard lines={execSummaryLines} />

      {/* Portfolio Summary — full width hero */}
      <PortfolioSummary meta={meta} />

      {/* Charts */}
      <EquityChart content={dashboard} />

      {/* Positions Table */}
      <PositionsTable content={dashboard} />

      {/* Signal Feeds — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <SignalFeedCard title="📊 PEAD (Earnings)" color="text-cyan-400" rows={pead} />
        <SignalFeedCard title="📈 Momentum (Trend)" color="text-blue-400" rows={momentum} />
        <SignalFeedCard title="🔄 BTD (Mean Reversion)" color="text-emerald-400" rows={btd} />
      </div>

      {/* Constitution + Gate — 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ConstitutionStatus content={dashboard} />
        <GateProgress content={dashboard} />
      </div>

      {/* Trade History */}
      <TradeHistory tradeLog={tradeLog} />

      {/* Strategy Scorecard */}
      {strategies.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs font-semibold text-purple-400 uppercase tracking-wide mb-3">
            Strategy Scorecard
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted border-b border-border">
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
                  const tierColor = total >= 21 ? 'text-green-400' : total >= 18 ? 'text-amber-400' : 'text-muted';
                  return (
                    <tr key={i} className="border-b border-border/50">
                      <td className="py-1.5 pr-2 text-muted">{row.cells[0]}</td>
                      <td className="py-1.5 px-2">{row.cells[1]}</td>
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
        </div>
      )}
    </div>
  );
}
