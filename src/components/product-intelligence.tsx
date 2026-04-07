import type { ProductIntel } from '@/lib/product-intel';

function StageCheck({ exists, date, label }: { exists: boolean; date: string | null; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={exists ? 'text-green-400' : 'text-red-400'}>{exists ? '✅' : '❌'}</span>
      <span className="text-foreground">{label}:</span>
      <span className="text-muted-foreground">
        {exists ? (date ? `Complete (${date})` : 'Complete') : 'Missing'}
      </span>
    </div>
  );
}

function StalenessIndicator({ staleness }: { staleness: ProductIntel['staleness'] }) {
  const styles: Record<string, { label: string; color: string }> = {
    current: { label: '✅ Current', color: 'text-green-400' },
    stale: { label: '⚠️ Stale — needs refresh', color: 'text-amber-400' },
    outdated: { label: '🔴 Outdated — flag to Sage', color: 'text-red-400' },
    missing: { label: '🔴 Missing — needs S1 research', color: 'text-red-400' },
  };
  const s = styles[staleness];
  return <span className={`text-xs font-mono ${s.color}`}>{s.label}</span>;
}

export function ProductIntelligencePanel({ intel }: { intel: ProductIntel }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground/70 mb-3">Product Intelligence</div>

      <div className="space-y-1.5 mb-3">
        <StageCheck exists={intel.s1Exists} date={intel.s1Date} label="S1 Research" />
        <StageCheck exists={intel.s2Exists} date={intel.s2Date} label="S2 MRD" />
        <div className="flex items-center gap-2 text-xs">
          <span className={intel.s3Exists ? 'text-green-400' : 'text-red-400'}>{intel.s3Exists ? '✅' : '❌'}</span>
          <span className="text-foreground">S3 PRD:</span>
          <span className="text-muted-foreground">
            {intel.s3Exists
              ? intel.s3Completion
                ? `${Math.round((intel.s3Completion.done / intel.s3Completion.total) * 100)}% complete (${intel.s3Completion.done}/${intel.s3Completion.total} items)`
                : (intel.s3Date ? `Complete (${intel.s3Date})` : 'Complete')
              : 'Missing'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs mb-3">
        <span className="text-muted-foreground">Last competitive refresh:</span>
        {intel.lastCompetitiveRefresh
          ? <span className="font-mono text-foreground">{intel.lastCompetitiveRefresh}</span>
          : <span className="text-red-400 font-mono">Never</span>}
        <span className="ml-1"><StalenessIndicator staleness={intel.staleness} /></span>
      </div>

      {intel.recentChanges.length > 0 && (
        <div className="border-t border-border/30 pt-2 mt-2">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Recent competitive changes</div>
          <ul className="space-y-0.5">
            {intel.recentChanges.map((change, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {change}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function ProductIntelSummaryTable({ allIntel }: { allIntel: ProductIntel[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-muted-foreground border-b border-border bg-muted">
            <th className="text-left py-2.5 pl-3 pr-2">Product</th>
            <th className="text-center py-2.5 px-2">S1</th>
            <th className="text-center py-2.5 px-2">S2</th>
            <th className="text-center py-2.5 px-2">S3</th>
            <th className="text-left py-2.5 px-2">Last Refresh</th>
            <th className="text-left py-2.5 pl-2 pr-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {allIntel.map((intel, i) => (
            <tr key={intel.product} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
              <td className="py-2 pl-3 pr-2 text-foreground font-medium">{intel.product}</td>
              <td className="py-2 px-2 text-center">{intel.s1Exists ? '✅' : '❌'}</td>
              <td className="py-2 px-2 text-center">{intel.s2Exists ? '✅' : '❌'}</td>
              <td className="py-2 px-2 text-center">
                {intel.s3Exists
                  ? intel.s3Completion
                    ? `${Math.round((intel.s3Completion.done / intel.s3Completion.total) * 100)}%`
                    : '✅'
                  : '❌'}
              </td>
              <td className="py-2 px-2 font-mono text-muted-foreground">{intel.lastCompetitiveRefresh || '—'}</td>
              <td className="py-2 pl-2 pr-3"><StalenessIndicator staleness={intel.staleness} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
