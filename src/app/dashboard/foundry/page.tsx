import { fetchAllIssues } from '@/lib/github';
import { SectionCard, StatusDot, SignalPill } from '@/components/dashboard';

interface AppInfo {
  name: string;
  tagline: string;
  stage: string;
  pdlc: string;
  p0: number;
  blocker: string;
  repo?: string;
}

export default async function FoundryPage() {
  const allIssues = await fetchAllIssues();

  const apps: AppInfo[] = [
    {
      name: 'FairConnect',
      tagline: "Maker's CRM",
      stage: 'S2 DEFINE',
      pdlc: 'MRD in progress',
      p0: allIssues.filter(i => i.repo === 'fairconnect' && i.labels.includes('P0')).length,
      blocker: 'Market research',
      repo: 'fairconnect',
    },
    {
      name: 'KeepTrack',
      tagline: 'Warranty Tracker',
      stage: 'S2 DEFINE',
      pdlc: 'MRD starting',
      p0: allIssues.filter(i => i.repo === 'keeptrack' && i.labels.includes('P0')).length,
      blocker: 'None',
      repo: 'keeptrack',
    },
    {
      name: 'SubCheck',
      tagline: 'Subscription Auditor',
      stage: 'S1 DONE',
      pdlc: 'Queued',
      p0: 0,
      blocker: 'Waiting for top 2',
    },
  ];

  const s2Apps = apps.filter(a => a.stage === 'S2 DEFINE');
  const s1Apps = apps.filter(a => a.stage === 'S1 DONE');

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Foundry — App Portfolio</h1>
      <p className="text-sm text-muted-foreground mb-6">Apple IAP apps — grouped by development stage</p>

      {/* S2 DEFINE */}
      {s2Apps.length > 0 && (
        <SectionCard title={`S2 DEFINE (${s2Apps.length} apps)`} className="mb-4">
          <div className="space-y-3">
            {s2Apps.map(app => (
              <div key={app.name} className="flex items-start gap-3 border-l-2 border-blue-500/40 pl-3 py-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{app.name}</span>
                    <span className="text-xs text-muted-foreground">— {app.tagline}</span>
                    <SignalPill label={app.pdlc} tone="info" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span>Status: {app.pdlc}</span>
                    <span>P0: {app.p0}</span>
                    {app.blocker !== 'None' && <span className="text-amber-400">Blocker: {app.blocker}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* S1 DONE */}
      {s1Apps.length > 0 && (
        <SectionCard title={`S1 DONE (${s1Apps.length} app)`} className="mb-4">
          <div className="space-y-3">
            {s1Apps.map(app => (
              <div key={app.name} className="flex items-start gap-3 border-l-2 border-muted pl-3 py-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{app.name}</span>
                    <span className="text-xs text-muted-foreground">— {app.tagline}</span>
                    <SignalPill label="Queued" tone="neutral" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Status: {app.pdlc} | P0: {app.p0}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Future */}
      <SectionCard title="Future" className="mb-4">
        <p className="text-xs text-muted-foreground">New apps appear here when added to REGISTRY</p>
      </SectionCard>
    </div>
  );
}
