import {
  fetchRadarStatus,
  fetchRadarScorecard,
  fetchRadarDashboard,
} from '@/lib/github';
import { MetricCard, HealthRow, SignalPill, SectionCard, StatusDot } from '@/components/dashboard';
import { RechartsEquityChart } from '@/components/radar-charts';
import { CollapsibleSection } from '@/components/collapsible-section';

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

function parseEquityData(content: string): Array<{ date: string; equity: number; pnl: number }> {
  const section = extractSection(content, 'Equity History');
  const rows = parseMarkdownTable(section);
  return rows.map((row) => {
    const equity = parseFloat(row.cells[1]?.replace(/[$,]/g, '') || '0');
    const pnl = parseFloat(row.cells[2]?.replace(/[$,+]/g, '') || '0');
    return { date: row.cells[0] || '', equity, pnl };
  });
}

function parseAlerts(content: string): string[] {
  const section = extractSection(content, 'Exec Summary');
  if (!section) return [];
  return section.split('\n')
    .filter(l => l.startsWith('- ') && (l.includes('STOP-LOSS') || l.includes('WARNING') || l.includes('EXIT')))
    .map(l => l.replace(/^-\s+/, '').trim());
}

function parseMarketContext(content: string): { regime: string; vix: string; outlook: string; sectorOverweight: string; sectorUnderweight: string; macroPhase: string; macroConfidence: string } {
  const section = extractSection(content, 'Exec Summary');
  const regimeMatch = section.match(/Market Regime:\s*(\w+)/);
  const vixMatch = section.match(/VIX\s+([\d.]+)/);
  const outlookMatch = section.match(/Macro Outlook:\s*(\w+)/);
  const cycleMatch = section.match(/Economic Cycle:\s*(\w+)/);
  const confMatch = section.match(/confidence:\s*(\d+%)/);

  const sectorSection = extractSection(content, 'Sector Rotation');
  const sectorMeta: Record<string, string> = {};
  for (const row of parseMarkdownTable(sectorSection)) {
    if (row.cells.length >= 2) sectorMeta[row.cells[0]] = row.cells[1];
  }

  return {
    regime: regimeMatch?.[1] || 'Unknown',
    vix: vixMatch?.[1] || '--',
    outlook: outlookMatch?.[1] || '--',
    sectorOverweight: sectorMeta['Overweight'] || '--',
    sectorUnderweight: sectorMeta['Underweight'] || '--',
    macroPhase: cycleMatch?.[1] || '--',
    macroConfidence: confMatch?.[1] || '--',
  };
}

export default async function RadarPage() {
  const [tradeLog, scorecard, dashboard] = await Promise.all([
    fetchRadarStatus(),
    fetchRadarScorecard(),
    fetchRadarDashboard(),
  ]);

  if (!dashboard) {
    return (
      <div className="text-center py-20 text-muted-foreground animate-fade-in">
        <div className="text-3xl font-mono mb-2">--</div>
        <div>RADAR dashboard data not available yet.</div>
        <div className="text-xs mt-1">Run the RADAR trading loop to generate dashboard data.</div>
      </div>
    );
  }

  const meta = parseDashboardMeta(dashboard);
  const market = parseMarketContext(dashboard);
  const equityData = parseEquityData(dashboard);
  const alerts = parseAlerts(dashboard);
  const strategyRows = parseMarkdownTable(extractSection(dashboard, 'Strategy Status'));
  const constitutionRows = parseMarkdownTable(extractSection(dashboard, 'Constitution Status'));
  const gateRows = parseMarkdownTable(extractSection(dashboard, 'Gate Progress'));
  const positionRows = parseMarkdownTable(extractSection(dashboard, 'Positions'));
  const tradeRows = tradeLog ? parseMarkdownTable(tradeLog) : [];
  const strategies = scorecard ? parseMarkdownTable(extractSection(scorecard, 'Master Scorecard')) : [];

  const pnlValue = meta['Daily P/L'] || '$0.00';
  const isPositive = !pnlValue.includes('-') && pnlValue !== '$0.00';
  const isNegative = pnlValue.includes('-');

  const regimeTone = market.regime === 'FEAR' ? 'danger' : market.regime === 'GREED' ? 'success' : undefined;

  return (
    <div>
      {/* ── ZONE 1: Header + Market Condition ──────────────────────── */}

      <div className="flex items-center justify-between mb-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <StatusDot status={market.regime === 'FEAR' ? 'warn' : 'good'} size="lg" />
          <div>
            <div className="text-lg font-semibold text-foreground">RADAR Trading System</div>
            <div className="text-xs text-muted-foreground font-mono">
              Last loop: {meta['Last Loop'] || 'unknown'} | Gate review: {meta['Gate Review'] || 'TBD'}
            </div>
          </div>
        </div>
        <SignalPill
          label={meta['Phase'] === 'Paper' ? 'PAPER TRADING' : 'LIVE'}
          tone={meta['Phase'] === 'Paper' ? 'warning' : 'success'}
        />
      </div>

      {/* Market Condition bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className={`rounded-xl border p-3 ${market.regime === 'FEAR' ? 'border-red-500/30 bg-red-500/5' : market.regime === 'GREED' ? 'border-green-500/30 bg-green-500/5' : 'border-border bg-card'}`}>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Regime</div>
          <div className={`text-xl font-bold font-mono ${market.regime === 'FEAR' ? 'text-red-400' : market.regime === 'GREED' ? 'text-green-400' : 'text-foreground'}`}>{market.regime}</div>
        </div>
        <div className="rounded-xl border border-border p-3 bg-card">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">VIX</div>
          <div className={`text-xl font-bold font-mono ${parseFloat(market.vix) > 25 ? 'text-red-400' : parseFloat(market.vix) > 18 ? 'text-amber-400' : 'text-green-400'}`}>{market.vix}</div>
        </div>
        <div className="rounded-xl border border-border p-3 bg-card">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Macro</div>
          <div className="text-xl font-bold font-mono text-foreground">{market.outlook}</div>
          <div className="text-[10px] text-muted-foreground">{market.macroPhase} ({market.macroConfidence})</div>
        </div>
        <div className="rounded-xl border border-border p-3 bg-card">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Sectors</div>
          <div className="text-xs font-mono text-green-400 mt-1">OW: {market.sectorOverweight}</div>
          <div className="text-xs font-mono text-red-400">UW: {market.sectorUnderweight}</div>
        </div>
      </div>

      {/* ── ZONE 2: Account Health Cards ───────────────────────────── */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <MetricCard label="Equity" value={meta['Equity'] || '--'} trend={isNegative ? 'down' : 'up'} semantic={isNegative ? 'danger' : 'success'} />
        <MetricCard label="Cash" value={meta['Cash'] || '--'} trend="flat" />
        <MetricCard
          label="Daily P/L (PAPER)"
          value={pnlValue}
          trend={isPositive ? 'up' : isNegative ? 'down' : 'flat'}
          semantic={isPositive ? 'success' : isNegative ? 'danger' : undefined}
        />
        <MetricCard label="Positions" value={meta['Positions'] || '0'} />
        <MetricCard label="Deployed" value={meta['Deployed'] || '0%'} subtitle={`Reserve: ${meta['Reserve'] || '100%'}`} />
      </div>

      {/* ── ZONE 3: Risk Alerts (red box if any) ──────────────────── */}

      {alerts.length > 0 && (
        <div className="rounded-xl border-2 border-red-500/40 bg-red-500/5 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <StatusDot status="bad" size="md" />
            <span className="text-sm font-semibold text-red-400 uppercase tracking-wide">Risk Alerts — {alerts.length} active</span>
          </div>
          <div className="space-y-2">
            {alerts.map((alert, i) => {
              const isStop = alert.includes('STOP-LOSS');
              return (
                <div key={i} className="flex items-start gap-2.5 text-sm">
                  <span className={`shrink-0 mt-0.5 font-mono text-xs ${isStop ? 'text-red-500' : 'text-amber-400'}`}>
                    {isStop ? '🔴' : '⚠️'}
                  </span>
                  <span className="text-foreground/80 font-mono text-xs">{alert}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ZONE 4: Strategy Status (structured table) ─────────────── */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Strategy Status">
          <div className="space-y-3">
            {strategyRows.map((row, i) => {
              const status = row.cells[1] || '';
              const isDormant = status.toLowerCase().includes('dormant') || status.toLowerCase().includes('suspended') || status.toLowerCase().includes('skipped');
              const isActive = status.toLowerCase().includes('active') || status.toLowerCase().includes('signal') || status.toLowerCase().includes('scanning');
              return (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-foreground font-medium">{row.cells[0]}</span>
                  <div className="flex items-center gap-2">
                    <SignalPill
                      label={isDormant ? 'Suspended' : isActive ? 'Active' : status.slice(0, 20)}
                      tone={isDormant ? 'neutral' : isActive ? 'success' : 'warning'}
                    />
                  </div>
                </div>
              );
            })}
            {strategyRows.length === 0 && <div className="text-xs text-muted-foreground">No strategy data</div>}
          </div>
          {/* Regime guidance */}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Regime Guidance</div>
            {strategyRows.map((row, i) => (
              row.cells[2] && (
                <div key={i} className="text-xs text-muted-foreground mb-1">
                  <span className="font-medium text-foreground/70">{row.cells[0]}:</span> {row.cells[2]}
                </div>
              )
            ))}
          </div>
        </SectionCard>

        {/* Constitution */}
        <SectionCard title="Constitution — 10 Trading Laws">
          <div className="space-y-2.5">
            {constitutionRows.map((row, i) => {
              const passed = row.cells[1]?.includes('Enforced') || row.cells[1]?.includes('PASS');
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${passed ? 'text-green-500' : 'text-red-500'}`}>
                      {passed ? '✓' : '✗'}
                    </span>
                    <span className="text-muted-foreground text-xs">{row.cells[0]}</span>
                  </div>
                </div>
              );
            })}
            {constitutionRows.length === 0 && <div className="text-xs text-muted-foreground">No data</div>}
          </div>
        </SectionCard>
      </div>

      {/* ── ZONE 5: Equity Curve ───────────────────────────────────── */}

      <SectionCard title="Equity Curve" className="mb-6">
        <RechartsEquityChart data={equityData} />
      </SectionCard>

      {/* ── ZONE 6: Gate Progress ──────────────────────────────────── */}

      <SectionCard title="Paper → Live Gate Progress" className="mb-6">
        <div className="space-y-3">
          {gateRows.map((row, i) => {
            const [criterion, target, current, status] = row.cells;
            const met = status?.includes('✅');
            const pending = status?.includes('⏳');
            return (
              <HealthRow
                key={i}
                label={criterion}
                value={`${current || '--'} / ${target}`}
                status={met ? 'good' : 'warn'}
                bar={met ? 100 : pending ? Math.min(90, Math.max(5, (parseFloat(current || '0') / parseFloat(target || '100')) * 100)) : 50}
              />
            );
          })}
          {gateRows.length === 0 && <div className="text-xs text-muted-foreground">No gate data</div>}
        </div>
      </SectionCard>

      {/* ── ZONE 7: Positions (collapsible) ────────────────────────── */}

      <div className="mb-6">
        <CollapsibleSection
          title={`All Positions (${positionRows.length})`}
          defaultOpen={false}
          badge={
            <span className="text-[10px] text-muted-foreground font-mono ml-1">
              {positionRows.filter(r => r.cells[4]?.includes('-')).length} red / {positionRows.filter(r => !r.cells[4]?.includes('-') && r.cells[4] !== '0%').length} green
            </span>
          }
        >
          {positionRows.length === 0 ? (
            <div className="text-xs text-muted-foreground py-4 text-center">No open positions</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border bg-muted">
                    <th className="text-left py-2.5 pr-4 pl-3">Symbol</th>
                    <th className="text-right py-2.5 px-2">Qty</th>
                    <th className="text-right py-2.5 px-2">Entry</th>
                    <th className="text-right py-2.5 px-2">Current</th>
                    <th className="text-right py-2.5 px-2">P/L %</th>
                  </tr>
                </thead>
                <tbody>
                  {positionRows.map((row, i) => {
                    const pnl = row.cells[4] || '';
                    const isNeg = pnl.includes('-');
                    const isPos = !isNeg && pnl !== '0%' && pnl !== '$0.1%';
                    return (
                      <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                        <td className="py-2 pr-4 pl-3 font-mono font-semibold text-foreground">{row.cells[0]}</td>
                        <td className="py-2 px-2 text-right font-mono text-muted-foreground">{row.cells[1]}</td>
                        <td className="py-2 px-2 text-right font-mono text-muted-foreground">{row.cells[2]}</td>
                        <td className="py-2 px-2 text-right font-mono text-muted-foreground">{row.cells[3]}</td>
                        <td className={`py-2 px-2 text-right font-mono font-semibold ${isPos ? 'text-green-500' : isNeg ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {pnl}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CollapsibleSection>
      </div>

      {/* ── ZONE 8: Trade History (collapsible) ────────────────────── */}

      {tradeRows.length > 0 && (
        <div className="mb-6">
          <CollapsibleSection title={`Trade History (${tradeRows.length})`} defaultOpen={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border bg-muted">
                    <th className="text-left py-2.5 pr-3 pl-3">Date</th>
                    <th className="text-left py-2.5 px-2">Action</th>
                    <th className="text-left py-2.5 px-2">Symbol</th>
                    <th className="text-right py-2.5 px-2">Qty</th>
                    <th className="text-right py-2.5 px-2">Price</th>
                    <th className="text-left py-2.5 pl-2 pr-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {tradeRows.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                      <td className="py-2 pr-3 pl-3 font-mono text-muted-foreground">{row.cells[0]?.slice(0, 10)}</td>
                      <td className={`py-2 px-2 font-mono font-semibold ${row.cells[1] === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>{row.cells[1]}</td>
                      <td className="py-2 px-2 font-mono font-semibold text-foreground">{row.cells[2]}</td>
                      <td className="py-2 px-2 text-right font-mono text-muted-foreground">{row.cells[3]}</td>
                      <td className="py-2 px-2 text-right font-mono text-muted-foreground">{row.cells[4]}</td>
                      <td className="py-2 pl-2 pr-3 text-muted-foreground max-w-[200px] truncate">{row.cells[6] || row.cells[5]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ── ZONE 9: Strategy Scorecard (collapsible) ───────────────── */}

      {strategies.length > 0 && (
        <CollapsibleSection title="Strategy Scorecard" defaultOpen={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
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
                    <tr key={i} className={`border-b border-gray-50 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                      <td className="py-2 pr-2 pl-3 text-muted-foreground font-mono">{row.cells[0]}</td>
                      <td className="py-2 px-2 text-foreground/80 font-medium">{row.cells[1]}</td>
                      <td className="py-2 px-1 text-center font-mono text-muted-foreground">{row.cells[2]}</td>
                      <td className="py-2 px-1 text-center font-mono text-muted-foreground">{row.cells[3]}</td>
                      <td className="py-2 px-1 text-center font-mono text-muted-foreground">{row.cells[4]}</td>
                      <td className="py-2 px-1 text-center font-mono text-muted-foreground">{row.cells[5]}</td>
                      <td className="py-2 px-1 text-center font-mono text-muted-foreground">{row.cells[6]}</td>
                      <td className="py-2 px-1 text-center font-mono font-bold">
                        <SignalPill label={row.cells[7]} tone={tierTone} />
                      </td>
                      <td className="py-2 pl-2 pr-3 text-center font-mono text-muted-foreground">{row.cells[8]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
