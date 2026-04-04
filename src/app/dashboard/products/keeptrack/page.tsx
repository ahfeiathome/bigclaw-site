import { fetchAllIssues, fetchRepoFile } from '@/lib/github';
import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';

export default async function KeepTrackPage() {
  const [allIssues, mrdMd] = await Promise.all([
    fetchAllIssues(),
    fetchRepoFile('keeptrack', 'docs/product/MRD.md'),
  ]);

  const issues = allIssues.filter(i => i.repo === 'keeptrack');

  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">KeepTrack</h1>
          <SignalPill label="SETUP" tone="neutral" />
        </div>
        <p className="text-sm text-muted-foreground">Personal inventory tracker — iOS app via Apple IAP</p>
        <p className="text-xs text-muted-foreground mt-1">Company: Axiom · Stage: MRD</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="PDLC Stage">
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Market Requirements Document</span>
              <span className="font-mono">Stage 1 of 5</span>
            </div>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
              <div className="bg-blue-500" style={{ width: '20%' }} />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            {['MRD', 'Design', 'Development', 'Testing', 'Launch'].map((stage, i) => (
              <div key={stage} className="flex items-center gap-2">
                <StatusDot status={i === 0 ? 'warn' : 'neutral'} size="sm" />
                <span className={i === 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}>{stage}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Dependencies">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <StatusDot status="warn" size="sm" />
              <span className="text-foreground">Apple Developer Account</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono ml-auto">💳 Pending</span>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Open Issues" className="mb-6">
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open issues</p>
        ) : (
          <div className="space-y-2">
            {issues.slice(0, 10).map(issue => (
              <a key={issue.number} href={issue.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm no-underline hover:bg-muted rounded p-1.5 transition-colors">
                <StatusDot status={issue.labels.includes('P0') ? 'bad' : 'neutral'} size="sm" />
                <span className="text-foreground">#{issue.number} {issue.title}</span>
              </a>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
