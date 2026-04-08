import { fetchAllIssues, fetchRecentClosedIssues, fetchSDLCViolations } from '@/lib/github';
import { fetchProductBySlug } from '@/lib/content';
import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';
import { IssueTrendChart } from '@/components/issues-trend-chart';
import { parseMarkdownTable, extractSection } from '@/app/dashboard/sdlc/helpers';
import { notFound } from 'next/navigation';

// Map slugs to repo names for issue filtering
const SLUG_TO_REPO: Record<string, string> = {
  grovakid: 'learnie-ai',
  'iris-studio': 'iris-studio',
  fatfrogmodels: 'fatfrogmodels',
  fairconnect: 'fairconnect',
  keeptrack: 'keeptrack',
  subcheck: 'subcheck',
  cortex: 'cortex',
  rehearsal: 'the-firm',
  radar: 'the-firm',
};

export default async function EngineeringProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) return notFound();

  const repo = SLUG_TO_REPO[slug] || product.repo;
  const [allIssues, closedIssues, violationsMd] = await Promise.all([
    fetchAllIssues(),
    fetchRecentClosedIssues(90),
    fetchSDLCViolations(),
  ]);

  const productIssues = allIssues.filter(i => i.repo === repo);
  const productClosed = closedIssues.filter(i => i.repo === repo);
  const p0Count = productIssues.filter(i => i.labels.includes('P0')).length;
  const p1Count = productIssues.filter(i => i.labels.includes('P1')).length;

  // Filter violations for this product
  const allViolations = violationsMd ? parseMarkdownTable(extractSection(violationsMd, 'Raw Violations Log')) : [];
  const productViolations = allViolations.filter(r => r.cells[1]?.toLowerCase().includes(slug) || r.cells[1]?.toLowerCase().includes(product.name.toLowerCase()));

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Engineering — {product.name}</h1>
      <p className="text-sm text-muted-foreground mb-6">Quality metrics for {product.name} ({repo})</p>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Open Issues</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{productIssues.length}</div>
          <div className="flex gap-2 mt-1">
            {p0Count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">{p0Count} P0</span>}
            {p1Count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">{p1Count} P1</span>}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Closed (90d)</div>
          <div className="text-2xl font-bold font-mono text-green-400 mt-1">{productClosed.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Violations</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{productViolations.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Stage</div>
          <div className="mt-1"><SignalPill label={product.stage} tone={product.stage.includes('S1') || product.stage.includes('S2') || product.stage.includes('S3') ? 'info' : product.stage.includes('S4') || product.stage.includes('S5') ? 'warning' : 'success'} /></div>
        </div>
      </div>

      {/* Issues Trend Chart */}
      <SectionCard title="Issues Trend (90 days)" className="mb-6">
        <IssueTrendChart openIssues={productIssues} closedIssues={productClosed} days={90} />
        <div className="flex items-center gap-4 text-xs mt-3">
          <span className="text-muted-foreground">Open: <span className="text-foreground font-mono">{productIssues.length}</span></span>
          <span className="text-muted-foreground">Closed (90d): <span className="text-foreground font-mono">{productClosed.length}</span></span>
        </div>
      </SectionCard>

      {/* Open Issues */}
      {productIssues.length > 0 && (
        <SectionCard title={`Open Issues (${productIssues.length})`} className="mb-6">
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {productIssues.map((issue, i) => {
              const priority = issue.labels.includes('P0') ? 'P0' : issue.labels.includes('P1') ? 'P1' : '';
              return (
                <a key={i} href={issue.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs no-underline hover:bg-muted/50 rounded p-1">
                  <span className="text-muted-foreground font-mono">#{issue.number}</span>
                  {priority && <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${priority === 'P0' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{priority}</span>}
                  <span className="text-foreground truncate">{issue.title}</span>
                </a>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* Recently Closed */}
      {productClosed.length > 0 && (
        <SectionCard title={`Recently Closed (${productClosed.length})`} className="mb-6">
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {productClosed.slice(0, 10).map((issue, i) => (
              <a key={i} href={issue.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs no-underline hover:bg-muted/50 rounded p-1">
                <StatusDot status="good" size="sm" />
                <span className="text-foreground">#{issue.number} {issue.title}</span>
              </a>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Violations */}
      {productViolations.length > 0 && (
        <SectionCard title={`Violations (${productViolations.length})`} className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3 pr-2">Date</th>
                  <th className="text-left py-2 px-2">Code</th>
                  <th className="text-left py-2 px-2">Severity</th>
                  <th className="text-left py-2 pl-2 pr-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {productViolations.map((row, i) => (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2 pl-3 pr-2 font-mono text-muted-foreground">{row.cells[0]}</td>
                    <td className="py-2 px-2 font-mono text-primary">{row.cells[2]}</td>
                    <td className="py-2 px-2"><span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${row.cells[3] === 'Critical' ? 'bg-red-500/20 text-red-400' : row.cells[3] === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{row.cells[3]}</span></td>
                    <td className="py-2 pl-2 pr-3 text-muted-foreground">{row.cells[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {productIssues.length === 0 && productClosed.length === 0 && productViolations.length === 0 && (
        <p className="text-sm text-muted-foreground">No engineering data available for {product.name}.</p>
      )}
    </div>
  );
}
