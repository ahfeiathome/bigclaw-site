import { fetchSDLCProcess } from '@/lib/github';
import { SectionCard } from '@/components/dashboard';
import { parseMarkdownTable, extractSection } from '../helpers';

export default async function SDLCProcessPage() {
  const processMd = await fetchSDLCProcess();

  const stages = processMd
    ? parseMarkdownTable(extractSection(processMd, '8-Stage Pipeline \\(every code change\\)'))
    : [];
  const violationCodes = processMd
    ? parseMarkdownTable(extractSection(processMd, 'Violation Codes'))
    : [];

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>SDLC — Process</h1>
      <p className="text-sm text-muted-foreground mb-6">8-stage pipeline for every code change</p>

      {stages.length > 0 && (
        <SectionCard title="Pipeline Stages" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2.5 pl-3 pr-2">Stage</th>
                  <th className="text-left py-2.5 px-2">Who</th>
                  <th className="text-left py-2.5 px-2">Gate</th>
                  <th className="text-left py-2.5 pl-2 pr-3">Enforced By</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((row, i) => (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2.5 pl-3 pr-2 font-medium text-foreground">{row.cells[0]}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{row.cells[1]}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{row.cells[2]}</td>
                    <td className="py-2.5 pl-2 pr-3 text-muted-foreground font-mono text-[10px]">{row.cells[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {violationCodes.length > 0 && (
        <SectionCard title="Violation Codes" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2.5 pl-3 pr-2">Code</th>
                  <th className="text-left py-2.5 px-2">Name</th>
                  <th className="text-left py-2.5 px-2">Severity</th>
                  <th className="text-left py-2.5 pl-2 pr-3">Example</th>
                </tr>
              </thead>
              <tbody>
                {violationCodes.map((row, i) => {
                  const severity = row.cells[2] || '';
                  const style = severity === 'Critical' ? 'bg-red-500/20 text-red-400' : severity === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-yellow-500/20 text-yellow-400';
                  return (
                    <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                      <td className="py-2.5 pl-3 pr-2 font-mono font-semibold text-primary">{row.cells[0]}</td>
                      <td className="py-2.5 px-2 text-foreground">{row.cells[1]}</td>
                      <td className="py-2.5 px-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${style}`}>{severity}</span></td>
                      <td className="py-2.5 pl-2 pr-3 text-muted-foreground">{row.cells[3]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {!processMd && <p className="text-sm text-muted-foreground">SDLC process data not available.</p>}
    </div>
  );
}
