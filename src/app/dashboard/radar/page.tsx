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

      {/* Portfolio Summary — full width hero */}
      <PortfolioSummary meta={meta} />

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
