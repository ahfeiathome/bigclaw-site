import { SectionCard, SignalPill } from './dashboard';

export interface GateRow {
  gate: string;
  status: string;
  details: string;
}

export interface BugEntry {
  id: string;
  title: string;
  severity: string;
  date: string;
}

interface Props {
  productName: string;
  gates: GateRow[];
  openBugs: number;
  closedThisWeek: number;
  recentBugs: BugEntry[];
}

function statusIcon(status: string) {
  if (status.includes('✅')) return <span className="text-green-400">✅</span>;
  if (status.includes('⚠') || status.includes('⚠️')) return <span className="text-amber-400">⚠️</span>;
  if (status.includes('🔴') || status.includes('❌')) return <span className="text-red-400">🔴</span>;
  return <span className="text-muted-foreground">—</span>;
}

export function ProductQualityGates({ productName, gates, openBugs, closedThisWeek, recentBugs }: Props) {
  const trend = openBugs > closedThisWeek ? '↗ increasing' : openBugs < closedThisWeek ? '↘ decreasing' : '→ stable';
  const trendColor = openBugs > closedThisWeek ? 'text-red-400' : openBugs < closedThisWeek ? 'text-green-400' : 'text-muted-foreground';

  return (
    <div className="space-y-4">
      <SectionCard title={`${productName} — Quality Gates`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2.5 pl-3 pr-2">Gate</th>
                <th className="text-center py-2.5 px-2">Status</th>
                <th className="text-left py-2.5 pl-2 pr-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {gates.map((g, i) => (
                <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-2 pl-3 pr-2 text-foreground font-medium">{g.gate}</td>
                  <td className="py-2 px-2 text-center">{statusIcon(g.status)}</td>
                  <td className="py-2 pl-2 pr-3 text-muted-foreground">{g.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Bug Burn Rate">
        <div className="flex items-center gap-6 text-sm mb-3">
          <div>
            <span className="text-muted-foreground">Open: </span>
            <span className="font-mono font-bold text-foreground">{openBugs}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Closed this week: </span>
            <span className="font-mono font-bold text-foreground">{closedThisWeek}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Trend: </span>
            <span className={`font-mono font-bold ${trendColor}`}>{trend}</span>
          </div>
        </div>

        {recentBugs.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Recent Bugs</div>
            {recentBugs.map((bug, i) => {
              const sevStyle = bug.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : bug.severity === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground';
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-primary">{bug.id}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sevStyle}`}>{bug.severity}</span>
                  <span className="text-foreground flex-1">{bug.title}</span>
                  <span className="text-muted-foreground font-mono">{bug.date}</span>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
