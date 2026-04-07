import { fetchSDLCViolations } from '@/lib/github';
import { SectionCard } from '@/components/dashboard';
import { parseMarkdownTable, extractSection } from '../helpers';

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-400',
  High: 'bg-amber-500/20 text-amber-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
};

function statusCell(text: string) {
  const color = text.includes('✅') ? 'text-green-400' : text.includes('⚠') ? 'text-amber-400' : text.includes('❌') ? 'text-red-400' : 'text-muted-foreground';
  return <span className={`${color} font-mono`}>{text}</span>;
}

export default async function SDLCViolationsPage() {
  const violationsMd = await fetchSDLCViolations();

  const summaryRows = violationsMd ? parseMarkdownTable(extractSection(violationsMd, 'Bug Type Summary \\(auto-calculated by dashboard\\)')) : [];
  const enforcementRows = violationsMd ? parseMarkdownTable(extractSection(violationsMd, 'Enforcement Tracker')) : [];
  const rawRows = violationsMd ? parseMarkdownTable(extractSection(violationsMd, 'Raw Violations Log')) : [];

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>SDLC — Violations</h1>
      <p className="text-sm text-muted-foreground mb-6">Bug trend tracking and enforcement effectiveness</p>

      {summaryRows.length > 0 && (
        <SectionCard title="Bug Type Summary" className="mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2.5 pl-3 pr-2">Bug Type</th>
                  <th className="text-left py-2.5 px-2">Count</th>
                  <th className="text-left py-2.5 px-2">Enforcement</th>
                  <th className="text-left py-2.5 px-2">Last Occurrence</th>
                  <th className="text-left py-2.5 pl-2 pr-3">Trend</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row, i) => (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2 pl-3 pr-2 text-foreground font-medium">{row.cells[0]}</td>
                    <td className="py-2 px-2 font-mono text-foreground">{row.cells[1]}</td>
                    <td className="py-2 px-2 text-muted-foreground">{row.cells[2]}</td>
                    <td className="py-2 px-2 font-mono text-muted-foreground">{row.cells[3]}</td>
                    <td className="py-2 pl-2 pr-3">{statusCell(row.cells[4] || '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {enforcementRows.length > 0 && (
        <SectionCard title="Enforcement Tracker" className="mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2.5 pl-3 pr-2">Enforcement</th>
                  <th className="text-left py-2.5 px-2">Type</th>
                  <th className="text-left py-2.5 px-2">Status</th>
                  <th className="text-left py-2.5 pl-2 pr-3">Protects Against</th>
                </tr>
              </thead>
              <tbody>
                {enforcementRows.map((row, i) => (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2 pl-3 pr-2 text-foreground">{row.cells[0]}</td>
                    <td className="py-2 px-2 text-muted-foreground font-mono text-[10px]">{row.cells[1]}</td>
                    <td className="py-2 px-2">{statusCell(row.cells[2] || '')}</td>
                    <td className="py-2 pl-2 pr-3 font-mono text-muted-foreground">{row.cells[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {rawRows.length > 0 && (
        <SectionCard title={`Raw Violations Log (${rawRows.length})`} className="mb-4">
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
                {rawRows.map((row, i) => (
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
      )}

      {!violationsMd && <p className="text-sm text-muted-foreground">Violations data not available.</p>}
    </div>
  );
}
