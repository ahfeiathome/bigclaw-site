import { fetchAllIssues } from '@/lib/github';
import { SectionCard, SignalPill } from '@/components/dashboard';

interface FoundryApp {
  name: string;
  tagline: string;
  stage: string;
  status: string;
  nextGate: string;
  blocker: string;
  repoSlug: string;
  href: string;
}

const APPS: FoundryApp[] = [
  {
    name: 'FairConnect',
    tagline: "Maker's CRM for solo artists and craft fair vendors",
    stage: 'S2 DEFINE',
    status: 'MRD in progress',
    nextGate: 'S3 PRD — Code writes after MRD approved',
    blocker: 'Market research',
    repoSlug: 'fairconnect',
    href: '/dashboard/products/fairconnect',
  },
  {
    name: 'KeepTrack',
    tagline: 'Warranty and return tracker with OCR',
    stage: 'S2 DEFINE',
    status: 'Archive ready, TestFlight blocked',
    nextGate: 'S3 PRD',
    blocker: 'Apple Developer ($99 💳)',
    repoSlug: 'keeptrack',
    href: '/dashboard/products/keeptrack',
  },
  {
    name: 'SubCheck',
    tagline: 'Subscription auditor and cancellation assistant',
    stage: 'S1 DONE',
    status: 'Queued after top 2',
    nextGate: 'S2 DEFINE — after FairConnect + KeepTrack reach TestFlight',
    blocker: '',
    repoSlug: 'subcheck',
    href: '/dashboard/products/subcheck',
  },
];

function stageGroup(stage: string): string {
  if (stage.includes('S1')) return 'S1 DONE';
  if (stage.includes('S2')) return 'S2 DEFINE';
  if (stage.includes('S3')) return 'S3 DESIGN';
  return stage;
}

function stageTone(stage: string): 'info' | 'warning' | 'success' | 'neutral' {
  if (stage.includes('S1') || stage.includes('S2') || stage.includes('S3')) return 'info';
  if (stage.includes('S4') || stage.includes('S5')) return 'warning';
  if (stage.includes('S6') || stage.includes('S7') || stage.includes('S8')) return 'success';
  return 'neutral';
}

function hasGate(text: string): boolean {
  return text.includes('💳') || text.includes('⚖️') || text.includes('🧠');
}

export default async function FoundryPage() {
  const allIssues = await fetchAllIssues();

  // Group apps by stage
  const groups = new Map<string, FoundryApp[]>();
  for (const app of APPS) {
    const key = stageGroup(app.stage);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(app);
  }

  // Sort groups: highest stage first (S2 before S1)
  const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
    const stageNum = (s: string) => parseInt(s.match(/S(\d)/)?.[1] || '0');
    return stageNum(b[0]) - stageNum(a[0]);
  });

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Foundry — App Portfolio</h1>
      <p className="text-sm text-muted-foreground mb-2">Apple IAP apps grouped by development stage</p>
      <p className="text-[10px] text-amber-400/80 mb-6">Shared blocker: Apple Developer account ($99 💳 Michael) — required for all apps at S6 PILOT</p>

      <div className="space-y-6">
        {sortedGroups.map(([stageName, apps]) => (
          <div key={stageName}>
            <div className="flex items-center gap-2 mb-3">
              <SignalPill label={stageName} tone={stageTone(stageName)} />
              <span className="text-xs text-muted-foreground">({apps.length} app{apps.length > 1 ? 's' : ''})</span>
            </div>

            <div className="space-y-3">
              {apps.map((app) => {
                const issues = allIssues.filter(i => i.repo === app.repoSlug);
                const p0Count = issues.filter(i => i.labels.includes('P0')).length;

                return (
                  <SectionCard key={app.name} title="">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <a href={app.href} className="text-sm font-bold text-foreground no-underline hover:text-primary">{app.name}</a>
                          <span className="text-xs text-muted-foreground">— {app.tagline}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">Status: {app.status}</div>
                        {app.nextGate && <div className="text-xs text-muted-foreground">Next: {app.nextGate}</div>}
                        {app.blocker && (
                          <div className={`text-xs mt-1 ${hasGate(app.blocker) ? 'text-amber-400' : 'text-muted-foreground'}`}>
                            Blocker: {app.blocker}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-muted-foreground">Issues</div>
                        <div className="text-sm font-mono text-foreground">
                          {issues.length > 0 ? issues.length : '—'}
                          {p0Count > 0 && <span className="ml-1 text-red-400 text-xs">{p0Count} P0</span>}
                        </div>
                      </div>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          </div>
        ))}

        {/* Future section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground/50 px-2 py-0.5 rounded border border-border/30">FUTURE</span>
          </div>
          <div className="text-xs text-muted-foreground px-1">New apps appear here when added to REGISTRY.md</div>
        </div>
      </div>
    </div>
  );
}
