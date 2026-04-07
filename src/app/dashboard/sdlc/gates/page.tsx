import { fetchSDLCGatesMatrix } from '@/lib/github';
import { SectionCard } from '@/components/dashboard';
import { parseMarkdownTable, extractSection } from '../helpers';

const GATE_NAMES = [
  { key: 'Gate 1: Coding Guidelines \\(loaded every session\\)', title: 'Gate 1: Coding Guidelines' },
  { key: 'Gate 2: Code Review', title: 'Gate 2: Code Review' },
  { key: 'Gate 3: Testing', title: 'Gate 3: Testing' },
  { key: 'Gate 4: Push → Review → Approval → Production', title: 'Gate 4: Push → Review → Approval' },
];

function statusCell(text: string) {
  const color = text.includes('✅') ? 'text-green-400' : text.includes('⚠') ? 'text-amber-400' : text.includes('❌') || text.includes('🔴') ? 'text-red-400' : 'text-muted-foreground';
  return <span className={`${color} font-mono`}>{text}</span>;
}

export default async function SDLCGatesPage() {
  const gatesMd = await fetchSDLCGatesMatrix();

  const alignmentRows = gatesMd ? parseMarkdownTable(extractSection(gatesMd, 'Alignment with Official Claude Code Best Practices')) : [];

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>SDLC — Gates Matrix</h1>
      <p className="text-sm text-muted-foreground mb-6">Quality gates across all projects and sessions</p>

      {gatesMd ? (
        <div className="space-y-4">
          {GATE_NAMES.map((gate, gi) => {
            const section = extractSection(gatesMd, gate.key);
            const rows = parseMarkdownTable(section);
            if (rows.length === 0) return null;
            const headers = section.split('\n').find(l => l.includes('|') && !l.match(/^\|[\s-:|]+\|$/));
            const headerCells = headers?.split('|').map(c => c.trim()).filter(Boolean) || [];
            const statusMatch = section.match(/### Status:\s*(.+)/);
            const statusText = statusMatch?.[1] || '';
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
                {statusText && (
                  <p className="text-[11px] mt-2 px-1 text-muted-foreground">{statusText}</p>
                )}
              </SectionCard>
            );
          })}

          {alignmentRows.length > 0 && (
            <SectionCard title="Alignment with Claude Code Best Practices">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border bg-muted">
                      <th className="text-left py-2 pl-3 pr-2">Recommendation</th>
                      <th className="text-left py-2 px-2">Status</th>
                      <th className="text-left py-2 pl-2 pr-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alignmentRows.map((row, i) => (
                      <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                        <td className="py-2 pl-3 pr-2 text-foreground">{row.cells[0]}</td>
                        <td className="py-2 px-2">{statusCell(row.cells[1] || '')}</td>
                        <td className="py-2 pl-2 pr-3 text-muted-foreground">{row.cells[2]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Gates matrix data not available.</p>
      )}
    </div>
  );
}
