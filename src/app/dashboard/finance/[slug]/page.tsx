import { fetchDailyCosts } from '@/lib/github';
import { fetchProductBySlug } from '@/lib/content';
import { SectionCard, SignalPill } from '@/components/dashboard';
import { notFound } from 'next/navigation';

interface TableRow { cells: string[] }

function parseMarkdownTable(content: string): TableRow[] {
  const lines = content.split('\n').filter(l => l.includes('|') && !l.match(/^\|[\s-:|]+\|$/));
  if (lines.length <= 1) return [];
  return lines.slice(1).map(line => ({ cells: line.split('|').map(c => c.trim()).filter(Boolean) }));
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

export default async function FinanceProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) return notFound();

  const dailyCostsMd = await fetchDailyCosts();

  // Try to find per-product section in DAILY_COSTS.md
  const perProductSection = dailyCostsMd ? extractSection(dailyCostsMd, 'Per-Product Cost Breakdown') : '';
  const perProductRows = perProductSection ? parseMarkdownTable(perProductSection) : [];
  const productCostRow = perProductRows.find(r => r.cells[0]?.toLowerCase().includes(slug) || r.cells[0]?.toLowerCase().includes(product.name.toLowerCase()));

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Finance — {product.name}</h1>
      <p className="text-sm text-muted-foreground mb-6">Cost and revenue data for {product.name}</p>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue Model</div>
          <div className="text-sm font-mono text-foreground mt-1">{product.revenue || '—'}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Monthly Cost</div>
          <div className="text-sm font-mono text-foreground mt-1">
            {productCostRow ? productCostRow.cells[5] || productCostRow.cells[4] || '—' : 'No data yet'}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Stage</div>
          <div className="mt-1"><SignalPill label={product.stage} tone={product.stage.includes('S7') || product.stage.includes('S8') ? 'success' : 'warning'} /></div>
        </div>
      </div>

      {/* Cost Breakdown */}
      {productCostRow ? (
        <SectionCard title="Cost Breakdown" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3 pr-2">Category</th>
                  <th className="text-right py-2 pl-2 pr-3">Amount</th>
                </tr>
              </thead>
              <tbody>
                {['LLM API', 'Hosting', 'Database', 'Other'].map((cat, i) => (
                  <tr key={cat} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2 pl-3 pr-2 text-foreground">{cat}</td>
                    <td className="py-2 pl-2 pr-3 text-right font-mono text-muted-foreground">{productCostRow.cells[i + 1] || '—'}</td>
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <td className="py-2 pl-3 pr-2 text-foreground font-semibold">Total</td>
                  <td className="py-2 pl-2 pr-3 text-right font-mono font-semibold text-foreground">{productCostRow.cells[5] || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </SectionCard>
      ) : (
        <SectionCard title="Cost Breakdown" className="mb-6">
          <p className="text-sm text-muted-foreground">No per-product cost data yet. Rex (CFO) will populate <code className="text-xs font-mono text-primary">ops/DAILY_COSTS.md</code> with per-product breakdown.</p>
        </SectionCard>
      )}

      {/* Revenue */}
      <SectionCard title="Revenue" className="mb-6">
        {product.revenue && product.revenue !== 'Internal' ? (
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground">Model:</span> {product.revenue}
            <div className="mt-1 text-xs">Current MRR: <span className="font-mono text-foreground">$0</span> (pre-revenue)</div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Internal tool — no external revenue.</p>
        )}
      </SectionCard>
    </div>
  );
}
