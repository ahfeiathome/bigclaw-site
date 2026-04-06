import { fetchSDLCGatesMatrix, fetchSDLCViolations, fetchLearnings, fetchLessonsLearned } from '@/lib/github';
import { CollapsibleSection } from '@/components/collapsible-section';
import { SectionCard, SignalPill } from '@/components/dashboard';
import { parseMarkdownTable, extractSection, parseLearningsEntries } from '@/app/dashboard/sdlc/helpers';

const GATE_NAMES = [
  { key: 'Gate 1: Coding Guidelines \\(loaded every session\\)', title: 'Gate 1: Coding Guidelines' },
  { key: 'Gate 2: Code Review', title: 'Gate 2: Code Review' },
  { key: 'Gate 3: Testing', title: 'Gate 3: Testing' },
  { key: 'Gate 4: Push → Review → Approval → Production', title: 'Gate 4: Push → Review → Approval → Production' },
];

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-400',
  High: 'bg-amber-500/20 text-amber-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
};

function statusCell(text: string) {
  const color = text.includes('✅') ? 'text-green-400' : text.includes('⚠') ? 'text-amber-400' : text.includes('❌') || text.includes('🔴') ? 'text-red-400' : 'text-muted-foreground';
  return <span className={`${color} font-mono`}>{text}</span>;
}

export default async function ProductHealthPage() {
  const [gatesMd, violationsMd, learningsMd, lessonsMd] = await Promise.all([
    fetchSDLCGatesMatrix(),
    fetchSDLCViolations(),
    fetchLearnings(),
    fetchLessonsLearned(),
  ]);

  const violationRows = violationsMd ? parseMarkdownTable(violationsMd) : [];
  const devEntries = learningsMd ? parseLearningsEntries(learningsMd) : [];

  // Parse actions from gates matrix
  const actions: { priority: string; text: string }[] = [];
  if (gatesMd) {
    const section = extractSection(gatesMd, 'Priority Actions');
    for (const line of section.split('\n')) {
      const match = line.match(/^\d+\.\s+\*\*(P\d):\*\*\s+(.+)/);
      if (match) actions.push({ priority: match[1], text: match[2] });
    }
  }

  // Parse lessons
  const lessonSections: { date: string; content: string }[] = [];
  if (lessonsMd) {
    const lines = lessonsMd.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^## (\d{4}-\d{2}-\d{2})/);
      if (match) {
        let end = lines.length;
        for (let j = i + 1; j < lines.length; j++) { if (lines[j].match(/^## /)) { end = j; break; } }
        lessonSections.push({ date: match[1], content: lines.slice(i + 1, end).join('\n').trim() });
      }
    }
  }

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Product Health</h1>
      <p className="text-sm text-muted-foreground mb-6">Gates, violations, bugs, and improvement actions across all products</p>

      {/* A. Gates Matrix */}
      {gatesMd && (
        <div className="mb-4">
          <CollapsibleSection title="Gates Matrix" defaultOpen={true}>
            <div className="space-y-4">
              {GATE_NAMES.map((gate, gi) => {
                const section = extractSection(gatesMd, gate.key);
                const rows = parseMarkdownTable(section);
                if (rows.length === 0) return null;
                const headers = section.split('\n').find(l => l.includes('|') && !l.match(/^\|[\s-:|]+\|$/));
                const headerCells = headers?.split('|').map(c => c.trim()).filter(Boolean) || [];
                return (
                  <SectionCard key={gi} title={gate.title}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border bg-muted">
                            {headerCells.map((h, i) => <th key={i} className="text-left py-2 px-2 first:pl-3 last:pr-3">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                              {row.cells.map((cell, ci) => (
                                <td key={ci} className={`py-2 px-2 first:pl-3 last:pr-3 ${ci === 0 ? 'text-foreground font-medium' : ''}`}>
                                  {ci === 0 ? cell : statusCell(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </SectionCard>
                );
              })}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* B. Violations */}
      {violationRows.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title={`Violations (${violationRows.length})`} defaultOpen={true}>
            <SectionCard title="">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border bg-muted">
                      <th className="text-left py-2.5 pl-3 pr-2">Date</th>
                      <th className="text-left py-2.5 px-2">Project</th>
                      <th className="text-left py-2.5 px-2">Code</th>
                      <th className="text-left py-2.5 px-2">Severity</th>
                      <th className="text-left py-2.5 pl-2 pr-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {violationRows.map((row, i) => (
                      <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                        <td className="py-2 pl-3 pr-2 font-mono text-muted-foreground whitespace-nowrap">{row.cells[0]}</td>
                        <td className="py-2 px-2 text-foreground font-medium">{row.cells[1]}</td>
                        <td className="py-2 px-2 font-mono text-primary">{row.cells[2]}</td>
                        <td className="py-2 px-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SEVERITY_STYLES[row.cells[3]] || 'bg-muted text-muted-foreground'}`}>{row.cells[3]}</span>
                        </td>
                        <td className="py-2 pl-2 pr-3 text-muted-foreground max-w-[400px]">{row.cells[4]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          </CollapsibleSection>
        </div>
      )}

      {/* C. Bug RCA */}
      {devEntries.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title={`Bug Root Cause Analysis (${devEntries.length})`} defaultOpen={false}>
            <div className="space-y-3">
              {devEntries.map(entry => (
                <SectionCard key={entry.id} title="">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono font-bold text-primary text-sm">{entry.id}</span>
                    {entry.company && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">{entry.company}</span>}
                    {entry.date && <span className="text-xs text-muted-foreground font-mono">{entry.date}</span>}
                  </div>
                  <div className="text-sm text-foreground font-medium mb-2">{entry.project}{entry.title ? ` — ${entry.title}` : ''}</div>
                  {entry.problem && <div className="text-xs text-muted-foreground mb-1"><span className="text-red-400 font-semibold">Problem:</span> {entry.problem}</div>}
                  {entry.rootCause && <div className="text-xs text-muted-foreground mb-1"><span className="text-amber-400 font-semibold">Root Cause:</span> {entry.rootCause}</div>}
                  {entry.prevention && <div className="text-xs text-muted-foreground mb-1"><span className="text-green-400 font-semibold">Prevention:</span> {entry.prevention}</div>}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">#{tag}</span>)}
                    </div>
                  )}
                </SectionCard>
              ))}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* D. Improvement Actions */}
      {actions.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title={`Improvement Actions (${actions.length})`} defaultOpen={false}>
            <SectionCard title="">
              <div className="space-y-3">
                {actions.map((action, i) => {
                  const tone = action.priority === 'P0' ? 'error' as const : action.priority === 'P1' ? 'warning' as const : 'neutral' as const;
                  return (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                      <SignalPill label={action.priority} tone={tone} />
                      <span className="text-sm text-foreground">{action.text}</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </CollapsibleSection>
        </div>
      )}

      {/* E. Lessons Learned */}
      <div className="mb-4">
        <CollapsibleSection title="Lessons Learned" defaultOpen={false}>
          {lessonSections.length > 0 ? (
            <div className="space-y-4">
              {lessonSections.map((sec, i) => (
                <SectionCard key={i} title={sec.date}>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">{sec.content || 'No lessons for this day.'}</div>
                </SectionCard>
              ))}
            </div>
          ) : (
            <SectionCard title="">
              <p className="text-sm text-muted-foreground">No lessons extracted yet. Run sessions to populate.</p>
            </SectionCard>
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
}
