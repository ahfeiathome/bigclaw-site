import { fetchAllIssues, fetchPDLCRegistry } from '@/lib/github';
import { SectionCard, SignalPill } from '@/components/dashboard';

interface TableRow { cells: string[] }

function parseMarkdownTable(content: string): TableRow[] {
  const lines = content.split('\n').filter(l => l.includes('|') && !l.match(/^\|[\s-:|]+\|$/));
  if (lines.length <= 1) return [];
  return lines.slice(1).map(line => ({
    cells: line.split('|').map(c => c.trim()).filter(Boolean),
  }));
}

function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`^## ${heading}`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^## /)) { end = i; break; }
  }
  return lines.slice(0, end).join('\n');
}

function stageTone(stage: string): 'neutral' | 'info' | 'warning' | 'success' {
  if (stage.includes('S1')) return 'neutral';
  if (stage.includes('S2') || stage.includes('S3')) return 'info';
  if (stage.includes('S4') || stage.includes('S5')) return 'warning';
  return 'success';
}

const PRODUCT_REPOS: Record<string, string> = {
  FairConnect: 'fairconnect',
  KeepTrack: 'keeptrack',
  SubCheck: 'subcheck',
};

export default async function FoundryPage() {
  const [allIssues, pdlcMd] = await Promise.all([
    fetchAllIssues(),
    fetchPDLCRegistry(),
  ]);

  const foundrySection = pdlcMd ? extractSection(pdlcMd, 'Foundry Pipeline \\(Axiom — Apple IAP\\)') : '';
  const apps = parseMarkdownTable(foundrySection);
  const sharedBlocker = foundrySection.split('\n').find(l => l.startsWith('**Shared blocker'));

  // Group by stage
  const s2Apps = apps.filter(a => a.cells[1]?.includes('S2'));
  const s1Apps = apps.filter(a => a.cells[1]?.includes('S1'));
  const otherApps = apps.filter(a => !a.cells[1]?.includes('S1') && !a.cells[1]?.includes('S2'));

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Foundry — App Portfolio</h1>
      <p className="text-sm text-muted-foreground mb-6">Apple IAP apps — grouped by development stage</p>

      {sharedBlocker && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-6 text-xs text-amber-400">
          {sharedBlocker.replace(/\*\*/g, '')}
        </div>
      )}

      {/* S2 DEFINE */}
      {s2Apps.length > 0 && (
        <SectionCard title={`S2 DEFINE (${s2Apps.length} apps)`} className="mb-4">
          <div className="space-y-3">
            {s2Apps.map((app, i) => {
              const name = app.cells[0] || '';
              const repo = PRODUCT_REPOS[name];
              const p0 = repo ? allIssues.filter(issue => issue.repo === repo && issue.labels.includes('P0')).length : 0;
              return (
                <div key={i} className="flex items-start gap-3 border-l-2 border-blue-500/40 pl-3 py-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{name}</span>
                      <SignalPill label={app.cells[2] || ''} tone="info" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>Status: {app.cells[2]}</span>
                      <span>P0: {p0}</span>
                      {app.cells[4] && app.cells[4] !== 'None' && <span className="text-amber-400">Blocker: {app.cells[4]}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* S1 DONE / DISCOVER */}
      {s1Apps.length > 0 && (
        <SectionCard title={`S1 (${s1Apps.length} apps)`} className="mb-4">
          <div className="space-y-3">
            {s1Apps.map((app, i) => (
              <div key={i} className="flex items-start gap-3 border-l-2 border-muted pl-3 py-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{app.cells[0]}</span>
                    <SignalPill label={app.cells[1] || ''} tone="neutral" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Status: {app.cells[2]} | Next: {app.cells[3]}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Other stages */}
      {otherApps.length > 0 && (
        <SectionCard title="Other" className="mb-4">
          <div className="space-y-3">
            {otherApps.map((app, i) => (
              <div key={i} className="flex items-start gap-3 border-l-2 border-muted pl-3 py-1">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{app.cells[0]}</span>
                    <SignalPill label={app.cells[1] || ''} tone={stageTone(app.cells[1] || '')} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{app.cells[2]}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {apps.length === 0 && (
        <SectionCard title="Future" className="mb-4">
          <p className="text-xs text-muted-foreground">New apps appear here when added to PDLC_REGISTRY.md</p>
        </SectionCard>
      )}
    </div>
  );
}
