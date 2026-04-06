import { fetchPDLCRegistry } from '@/lib/github';
import { SectionCard, SignalPill } from '@/components/dashboard';
import { CollapsibleSection } from '@/components/collapsible-section';

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
  if (stage.includes('S1') || stage.includes('S2') || stage.includes('S3')) return 'info';
  if (stage.includes('S4') || stage.includes('S5')) return 'warning';
  if (stage.includes('S6') || stage.includes('S7') || stage.includes('S8')) return 'success';
  return 'neutral';
}

function hasGate(text: string): boolean {
  return text.includes('💳') || text.includes('⚖️') || text.includes('🧠');
}

export default async function PDLCPage() {
  const pdlcMd = await fetchPDLCRegistry();

  if (!pdlcMd) {
    return (
      <div>
        <h1 className="mb-6" style={{ fontSize: '28px', fontWeight: 700 }}>PDLC</h1>
        <p className="text-sm text-muted-foreground">PDLC registry data not available.</p>
      </div>
    );
  }

  const stageRef = parseMarkdownTable(extractSection(pdlcMd, 'Stage Reference'));
  const activeProducts = parseMarkdownTable(extractSection(pdlcMd, 'Active Products'));
  const foundryPipeline = parseMarkdownTable(extractSection(pdlcMd, 'Foundry Pipeline \\(Axiom — Apple IAP\\)'));
  const shelved = parseMarkdownTable(extractSection(pdlcMd, 'Shelved Products'));

  // Extract shared blocker note
  const foundrySection = extractSection(pdlcMd, 'Foundry Pipeline \\(Axiom — Apple IAP\\)');
  const sharedBlocker = foundrySection.split('\n').find(l => l.startsWith('**Shared blocker'));

  // Sort active products by stage descending
  const stagePriority: Record<string, number> = { S8: 8, S7: 7, S6: 6, S5: 5, S4: 4, S3: 3, S2: 2, S1: 1 };
  const sortedActive = [...activeProducts].sort((a, b) => {
    const aStage = a.cells[2]?.match(/S(\d)/)?.[0] || 'S0';
    const bStage = b.cells[2]?.match(/S(\d)/)?.[0] || 'S0';
    return (stagePriority[bStage] || 0) - (stagePriority[aStage] || 0);
  });

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>PDLC</h1>
      <p className="text-sm text-muted-foreground mb-6">Product Development Lifecycle — all products, all companies</p>

      {/* ── Section A: Stage Reference (collapsed) ─────────── */}
      {stageRef.length > 0 && (
        <div className="mb-6">
          <CollapsibleSection title="Stage Reference" defaultOpen={false}>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border bg-muted">
                      <th className="text-left py-2 pl-3 pr-2">Stage</th>
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 pl-2 pr-3">Key Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stageRef.map((row, i) => (
                      <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                        <td className="py-2 pl-3 pr-2 font-mono font-bold text-primary">{row.cells[0]}</td>
                        <td className="py-2 px-2 text-foreground font-medium">{row.cells[1]}</td>
                        <td className="py-2 pl-2 pr-3 text-muted-foreground">{row.cells[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ── Section B: Active Products ──────────────────────── */}
      <SectionCard title={`Active Products (${sortedActive.length})`} className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2.5 pl-3 pr-2">Product</th>
                <th className="text-left py-2.5 px-2">Company</th>
                <th className="text-left py-2.5 px-2">Stage</th>
                <th className="text-left py-2.5 px-2">Status</th>
                <th className="text-left py-2.5 px-2">Next Gate</th>
                <th className="text-left py-2.5 px-2">Blocker</th>
                <th className="text-left py-2.5 pl-2 pr-3">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {sortedActive.map((row, i) => {
                const stage = row.cells[2] || '';
                const blocker = row.cells[5] || '';
                const blockerHighlight = hasGate(blocker);
                const companyColor = row.cells[1]?.includes('Forge') ? 'bg-green-500/10 text-green-400'
                  : row.cells[1]?.includes('OpenClaw') ? 'bg-purple-500/10 text-purple-400'
                  : 'bg-blue-500/10 text-blue-400';
                return (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2.5 pl-3 pr-2 text-foreground font-medium">{row.cells[0]}</td>
                    <td className="py-2.5 px-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${companyColor}`}>{row.cells[1]}</span>
                    </td>
                    <td className="py-2.5 px-2">
                      <SignalPill label={stage} tone={stageTone(stage)} />
                    </td>
                    <td className="py-2.5 px-2 text-muted-foreground">{row.cells[3]}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{row.cells[4]}</td>
                    <td className={`py-2.5 px-2 ${blockerHighlight ? 'text-amber-400' : 'text-muted-foreground'}`}>
                      {blocker || 'None'}
                    </td>
                    <td className="py-2.5 pl-2 pr-3 text-muted-foreground font-mono text-[10px]">{row.cells[6]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Section C: Foundry Pipeline ─────────────────────── */}
      <SectionCard title={`Foundry Pipeline (${foundryPipeline.length} apps)`} className="mb-6">
        {sharedBlocker && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-4 text-xs text-amber-400">
            {sharedBlocker.replace(/\*\*/g, '')}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2.5 pl-3 pr-2">Product</th>
                <th className="text-left py-2.5 px-2">Stage</th>
                <th className="text-left py-2.5 px-2">Status</th>
                <th className="text-left py-2.5 px-2">Next Gate</th>
                <th className="text-left py-2.5 pl-2 pr-3">Blocker</th>
              </tr>
            </thead>
            <tbody>
              {foundryPipeline.map((row, i) => (
                <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-2.5 pl-3 pr-2 text-foreground font-medium">{row.cells[0]}</td>
                  <td className="py-2.5 px-2"><SignalPill label={row.cells[1] || ''} tone={stageTone(row.cells[1] || '')} /></td>
                  <td className="py-2.5 px-2 text-muted-foreground">{row.cells[2]}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">{row.cells[3]}</td>
                  <td className={`py-2.5 pl-2 pr-3 ${hasGate(row.cells[4] || '') ? 'text-amber-400' : 'text-muted-foreground'}`}>{row.cells[4] || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Section D: Shelved Products (collapsed) ────────── */}
      {shelved.length > 0 && (
        <div className="mb-6">
          <CollapsibleSection title={`Shelved Products (${shelved.length})`} defaultOpen={false}>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border bg-muted">
                      <th className="text-left py-2 pl-3 pr-2">Product</th>
                      <th className="text-left py-2 px-2">Company</th>
                      <th className="text-left py-2 px-2">Last Stage</th>
                      <th className="text-left py-2 px-2">Reason</th>
                      <th className="text-left py-2 pl-2 pr-3">Revival Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shelved.map((row, i) => (
                      <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''} opacity-60`}>
                        <td className="py-2 pl-3 pr-2 text-foreground">{row.cells[0]}</td>
                        <td className="py-2 px-2 text-muted-foreground">{row.cells[1]}</td>
                        <td className="py-2 px-2 text-muted-foreground font-mono">{row.cells[2]}</td>
                        <td className="py-2 px-2 text-muted-foreground">{row.cells[3]}</td>
                        <td className="py-2 pl-2 pr-3 text-muted-foreground">{row.cells[4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}
