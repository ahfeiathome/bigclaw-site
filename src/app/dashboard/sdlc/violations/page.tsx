import { fetchSDLCViolations } from '@/lib/github';
import { SectionCard } from '@/components/dashboard';
import { parseMarkdownTable } from '../helpers';

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-400',
  High: 'bg-amber-500/20 text-amber-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
};

export default async function SDLCViolationsPage() {
  const violationsMd = await fetchSDLCViolations();
  const rows = violationsMd ? parseMarkdownTable(violationsMd) : [];

  const criticalCount = rows.filter(r => r.cells[3] === 'Critical').length;
  const highCount = rows.filter(r => r.cells[3] === 'High').length;
  const mediumCount = rows.filter(r => r.cells[3] === 'Medium').length;

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>SDLC — Violations</h1>
      <p className="text-sm text-muted-foreground mb-6">All logged process violations, most recent first</p>

      <div className="flex items-center gap-4 mb-6 text-xs">
        {criticalCount > 0 && <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 font-mono font-semibold">{criticalCount} Critical</span>}
        {highCount > 0 && <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 font-mono font-semibold">{highCount} High</span>}
        {mediumCount > 0 && <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 font-mono font-semibold">{mediumCount} Medium</span>}
        <span className="text-muted-foreground">{rows.length} total</span>
      </div>

      {rows.length > 0 ? (
        <SectionCard title={`${rows.length} Violations Logged`}>
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
                {rows.map((row, i) => (
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
      ) : (
        <p className="text-sm text-muted-foreground">No violations data available.</p>
      )}
    </div>
  );
}
