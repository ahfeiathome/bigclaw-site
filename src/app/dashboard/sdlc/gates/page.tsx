import { fetchSDLCGatesMatrix } from '@/lib/github';
import { SectionCard, SignalPill } from '@/components/dashboard';
import { parseMarkdownTable, extractSection } from '../helpers';

const GATE_NAMES = [
  { key: 'Gate 1: Coding Guidelines \\(loaded every session\\)', title: 'Gate 1: Coding Guidelines' },
  { key: 'Gate 2: Code Review', title: 'Gate 2: Code Review' },
  { key: 'Gate 3: Testing', title: 'Gate 3: Testing' },
  { key: 'Gate 4: Push → Review → Approval → Production', title: 'Gate 4: Push → Review → Approval → Production' },
];

function statusTone(text: string): 'success' | 'warning' | 'error' | 'neutral' {
  if (text.includes('✅')) return 'success';
  if (text.includes('⚠️') || text.includes('⚠')) return 'warning';
  if (text.includes('❌') || text.includes('🔴')) return 'error';
  return 'neutral';
}

function statusCell(text: string) {
  const tone = statusTone(text);
  const color = tone === 'success' ? 'text-green-400' : tone === 'warning' ? 'text-amber-400' : tone === 'error' ? 'text-red-400' : 'text-muted-foreground';
  return <span className={`${color} font-mono`}>{text}</span>;
}

export default async function SDLCGatesPage() {
  const gatesMd = await fetchSDLCGatesMatrix();

  if (!gatesMd) {
    return (
      <div>
        <h1 className="mb-6" style={{ fontSize: '28px', fontWeight: 700 }}>SDLC — Gates Matrix</h1>
        <p className="text-sm text-muted-foreground">Gates matrix data not available.</p>
      </div>
    );
  }

  // Extract status notes for each gate
  const gateStatuses = GATE_NAMES.map(g => {
    const section = extractSection(gatesMd, g.key);
    const statusMatch = section.match(/### Status:\s*(.+)/);
    return statusMatch?.[1]?.trim() || '';
  });

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>SDLC — Gates Matrix</h1>
      <p className="text-sm text-muted-foreground mb-6">Quality gates across all projects</p>

      {GATE_NAMES.map((gate, gi) => {
        const section = extractSection(gatesMd, gate.key);
        const rows = parseMarkdownTable(section);
        if (rows.length === 0) return null;

        const headers = section.split('\n').find(l => l.includes('|') && !l.match(/^\|[\s-:|]+\|$/));
        const headerCells = headers?.split('|').map(c => c.trim()).filter(Boolean) || [];

        return (
          <SectionCard key={gi} title={gate.title} className="mb-6">
            {gateStatuses[gi] && (
              <div className="mb-3">
                <SignalPill
                  label={gateStatuses[gi].replace(/[⚠️🔴✅]/g, '').trim()}
                  tone={statusTone(gateStatuses[gi]) === 'error' ? 'error' : statusTone(gateStatuses[gi]) === 'warning' ? 'warning' : 'success'}
                />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border bg-muted">
                    {headerCells.map((h, i) => (
                      <th key={i} className="text-left py-2.5 px-2 first:pl-3 last:pr-3">{h}</th>
                    ))}
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
  );
}
