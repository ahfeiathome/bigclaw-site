import { fetchPatrolReport, fetchBandwidth } from '@/lib/github';
import { SectionCard, SignalPill, StatusDot, HealthRow } from '@/components/dashboard';

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

export default async function OperationsPage() {
  const [patrolMd, bandwidthMd] = await Promise.all([
    fetchPatrolReport(),
    fetchBandwidth(),
  ]);

  // Parse patrol report sections
  const meta = patrolMd ? parseMarkdownTable(extractSection(patrolMd, 'Meta')) : [];
  const metaMap: Record<string, string> = {};
  for (const row of meta) {
    if (row.cells.length >= 2) metaMap[row.cells[0]] = row.cells[1];
  }

  const alerts = patrolMd ? parseMarkdownTable(extractSection(patrolMd, 'Alerts')) : [];
  const financial = patrolMd ? parseMarkdownTable(extractSection(patrolMd, 'Financial')) : [];
  const infra = patrolMd ? parseMarkdownTable(extractSection(patrolMd, 'Infrastructure')) : [];

  // Parse agent bandwidth
  const agentRows = bandwidthMd ? parseMarkdownTable(extractSection(bandwidthMd, 'Current Agent Load')) : [];
  const pi5Rows = bandwidthMd ? parseMarkdownTable(extractSection(bandwidthMd, 'Pi5 Infrastructure')) : [];

  const patrolStatus = metaMap['Status'] || 'UNKNOWN';
  const statusTone = patrolStatus === 'HEALTHY' ? 'success' as const
    : patrolStatus.includes('CRITICAL') ? 'error' as const
    : 'warning' as const;

  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Operations</h1>
            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">Mika (COO)</span>
          </div>
          <SignalPill label={patrolStatus} tone={statusTone} />
        </div>
        <p className="text-sm text-muted-foreground">
          Daily briefs, agent dispatch, patrol reports · Last patrol: {metaMap['Timestamp'] || 'unknown'}
        </p>
      </div>

      {/* Agent Status */}
      <SectionCard title="Agent Status" className="mb-6">
        <div className="space-y-2">
          {agentRows.map((row, i) => (
            <div key={i} className="flex items-center gap-3 text-sm py-1 border-b border-border last:border-0">
              <StatusDot status={row.cells[3]?.toLowerCase() === 'busy' ? 'good' : 'neutral'} size="sm" />
              <span className="text-foreground font-medium w-20">{row.cells[0]}</span>
              <span className="text-muted-foreground text-xs flex-1">{row.cells[1]}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{row.cells[2]}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${row.cells[3]?.toLowerCase() === 'busy' ? 'bg-green-500/20 text-green-400' : 'bg-muted text-muted-foreground'}`}>{row.cells[3]}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{row.cells[4]} sessions</span>
            </div>
          ))}
          {agentRows.length === 0 && <p className="text-sm text-muted-foreground">No agent data available</p>}
        </div>
      </SectionCard>

      {/* Pi5 Infrastructure */}
      {pi5Rows.length > 0 && (
        <SectionCard title="Pi5 Infrastructure" className="mb-6">
          <div className="space-y-2">
            {pi5Rows.map((row, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{row.cells[0]}</span>
                <span className="text-muted-foreground font-mono text-xs">{row.cells[1]}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Patrol Alerts */}
        <SectionCard title="Alerts">
          {alerts.length === 0 || (alerts.length === 1 && alerts[0].cells[0] === '\u2014') ? (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <StatusDot status="good" size="sm" />
              No alerts
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((row, i) => (
                <div key={i} className="text-sm border-l-2 border-red-200 pl-3 py-1">
                  <span className="text-foreground/80">{row.cells[1] || row.cells[0]}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Financial Summary from patrol */}
        <SectionCard title="Financial Summary (Patrol)">
          {financial.length === 0 ? (
            <p className="text-sm text-muted-foreground">No financial data in patrol report</p>
          ) : (
            <div className="space-y-2">
              {financial.map((row, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{row.cells[0]}</span>
                  <span className="font-mono text-muted-foreground">{row.cells[1]}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Infrastructure Health from patrol */}
      {infra.length > 0 && (
        <SectionCard title="Infrastructure Health" className="mb-6">
          <div className="space-y-3">
            {infra.map((row, i) => {
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
      )}
    </div>
  );
}
