import { fetchAllIssues, fetchPDLCRegistry, fetchPortfolioSummary } from '@/lib/github';
import { StatusDot, SignalPill, SectionCard } from '@/components/dashboard';
import { ProductIntelSummaryTable } from '@/components/product-intelligence';
import { fetchAllProductIntel } from '@/lib/product-intel';
import Link from 'next/link';

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

// Map product names to dashboard routes
const PRODUCT_ROUTES: Record<string, string> = {
  GrovaKid: '/dashboard/products/grovakid',
  'iris-studio': '/dashboard/products/iris-studio',
  fatfrogmodels: '/dashboard/products/fatfrogmodels',
  RADAR: '/dashboard/products/radar',
  CORTEX: '/dashboard/products/cortex',
  REHEARSAL: '/dashboard/products/rehearsal',
  'BigClaw Dashboard': '/dashboard/mission-control',
  FairConnect: '/dashboard/products/fairconnect',
  KeepTrack: '/dashboard/products/keeptrack',
  SubCheck: '/dashboard/products/subcheck',
};

// Map product names to repo slugs for issue counts
const PRODUCT_REPOS: Record<string, string> = {
  GrovaKid: 'learnie-ai',
  'iris-studio': 'iris-studio',
  fatfrogmodels: 'fatfrogmodels',
  RADAR: 'radar-site',
  CORTEX: 'cortex',
  REHEARSAL: 'rehearsal',
  FairConnect: 'fairconnect',
  KeepTrack: 'keeptrack',
  SubCheck: 'subcheck',
};

function stageTone(stage: string): 'neutral' | 'info' | 'warning' | 'success' {
  if (stage.includes('S1') || stage.includes('S2') || stage.includes('S3')) return 'info';
  if (stage.includes('S4') || stage.includes('S5')) return 'warning';
  if (stage.includes('S6') || stage.includes('S7') || stage.includes('S8')) return 'success';
  return 'neutral';
}

function companyColor(company: string): string {
  if (company.includes('Forge')) return 'bg-green-500/10 text-green-400';
  if (company.includes('BigClaw')) return 'bg-purple-500/10 text-purple-400';
  if (company.includes('Nexus')) return 'bg-purple-500/10 text-purple-400';
  return 'bg-blue-500/10 text-blue-400';
}

export default async function ProductsPage() {
  const [allIssues, pdlcMd, allIntel, portfolioMd] = await Promise.all([
    fetchAllIssues(),
    fetchPDLCRegistry(),
    fetchAllProductIntel(),
    fetchPortfolioSummary(),
  ]);

  // Product summaries
  const summaryRows = portfolioMd ? parseMarkdownTable(extractSection(portfolioMd, 'Product Summaries')) : [];
  // PDLC gate status
  const gateRows = portfolioMd ? parseMarkdownTable(extractSection(portfolioMd, 'PDLC Gate Status')) : [];

  const activeProducts = pdlcMd ? parseMarkdownTable(extractSection(pdlcMd, 'Active Products')) : [];
  const foundryProducts = pdlcMd ? parseMarkdownTable(extractSection(pdlcMd, 'Foundry Pipeline \\(Axiom — Apple IAP\\)')) : [];

  // P0/P1 work items
  const priorityIssues = allIssues
    .filter(i => i.labels.includes('P0') || i.labels.includes('P1'))
    .slice(0, 15);

  return (
    <div className="-mx-4 sm:-mx-6 px-4 sm:px-6" style={{ maxWidth: 'none' }}>
      <div className="mb-6 animate-fade-in">
        <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Product Lineup</h1>
        <p className="text-sm text-muted-foreground mt-1">All products across Forge, Axiom, and Nexus</p>
      </div>

      {/* ── Product Summaries (from PORTFOLIO_SUMMARY.md) ──── */}
      {summaryRows.length > 0 && (
        <SectionCard title={`Product Summaries (${summaryRows.length})`} className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2.5 pl-3 pr-2">Product</th>
                  <th className="text-left py-2.5 px-2">Problem</th>
                  <th className="text-left py-2.5 pl-2 pr-3">Positioning</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((row, i) => {
                  const name = row.cells[0] || '';
                  const slug = name.toLowerCase().replace(/\s+/g, '-');
                  const href = PRODUCT_ROUTES[name] || `/dashboard/products/${slug}`;
                  return (
                    <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                      <td className="py-2 pl-3 pr-2 font-medium whitespace-nowrap">
                        <Link href={href} className="text-foreground no-underline hover:text-primary">{name}</Link>
                      </td>
                      <td className="py-2 px-2 text-muted-foreground max-w-[300px]">{row.cells[1]}</td>
                      <td className="py-2 pl-2 pr-3 text-muted-foreground max-w-[300px]">{row.cells[3]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── Active Products (from PDLC registry) ───────────── */}
      <SectionCard title={`Active Products (${activeProducts.length})`} className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2.5 pl-3 pr-2">Product</th>
                <th className="text-left py-2.5 px-2">Company</th>
                <th className="text-left py-2.5 px-2">Stage</th>
                <th className="text-left py-2.5 px-2">Revenue</th>
                <th className="text-left py-2.5 px-2">Status</th>
                <th className="text-right py-2.5 pl-2 pr-3">Issues</th>
              </tr>
            </thead>
            <tbody>
              {activeProducts.map((row, i) => {
                const name = row.cells[0] || '';
                const repo = PRODUCT_REPOS[name];
                const issueCount = repo ? allIssues.filter(issue => issue.repo === repo).length : 0;
                const p0Count = repo ? allIssues.filter(issue => issue.repo === repo && issue.labels.includes('P0')).length : 0;
                const href = PRODUCT_ROUTES[name] || '/dashboard/products';
                return (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2.5 pl-3 pr-2">
                      <Link href={href} className="text-foreground font-medium no-underline hover:text-primary">{name}</Link>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${companyColor(row.cells[1] || '')}`}>{row.cells[1]}</span>
                    </td>
                    <td className="py-2.5 px-2"><SignalPill label={row.cells[2] || ''} tone={stageTone(row.cells[2] || '')} /></td>
                    <td className="py-2.5 px-2 text-muted-foreground font-mono text-[10px]">{row.cells[6]}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{row.cells[3]}</td>
                    <td className="py-2.5 pl-2 pr-3 text-right font-mono">
                      {issueCount > 0 ? (
                        <span className="text-muted-foreground">
                          {issueCount}
                          {p0Count > 0 && <span className="text-red-400 font-bold ml-1">({p0Count} P0)</span>}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Market Intelligence ──────────────────────────────── */}
      {allIntel.length > 0 && (
        <SectionCard title="Market Intelligence" className="mb-6">
          <ProductIntelSummaryTable allIntel={allIntel} />
          {allIntel.some(i => i.staleness === 'outdated' || i.staleness === 'missing') && (
            <div className="mt-2 px-2 py-1.5 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              Products with missing or outdated research need attention before GTM decisions.
            </div>
          )}
        </SectionCard>
      )}

      {/* ── PDLC Gate Status ──────────────────────────────── */}
      {gateRows.length > 0 && (
        <SectionCard title="PDLC Gate Status" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3 pr-2">Product</th>
                  {['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'].map(s => (
                    <th key={s} className="text-center py-2 px-1.5 font-mono">{s}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gateRows.map((row, i) => {
                  const name = row.cells[0] || '';
                  const slug = name.toLowerCase().replace(/\s+/g, '-');
                  const href = PRODUCT_ROUTES[name] || `/dashboard/products/${slug}`;
                  return (
                    <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                      <td className="py-2 pl-3 pr-2 font-medium whitespace-nowrap">
                        <Link href={href} className="text-foreground no-underline hover:text-primary">{name}</Link>
                      </td>
                      {row.cells.slice(1, 9).map((cell, ci) => {
                        const isPass = cell.includes('✅');
                        const isCurrent = cell.includes('🔄');
                        const color = isPass ? 'text-green-400' : isCurrent ? 'text-amber-400' : 'text-muted-foreground/30';
                        return (
                          <td key={ci} className={`py-2 px-1.5 text-center ${color}`}>
                            {isPass ? '●' : isCurrent ? '◐' : '○'}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground px-1">
            <span><span className="text-green-400">●</span> Passed</span>
            <span><span className="text-amber-400">◐</span> Current</span>
            <span><span className="text-muted-foreground/30">○</span> Not started</span>
          </div>
        </SectionCard>
      )}

      {/* ── P0/P1 Work Items ────────────────────────────────── */}
      <SectionCard title="Active Projects — P0/P1 Work Items" className="mb-6">
        {priorityIssues.length === 0 ? (
          <p className="text-sm text-muted-foreground">No P0/P1 issues across products</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2.5 pl-3 pr-2">Project</th>
                  <th className="text-left py-2.5 px-2">Product</th>
                  <th className="text-center py-2.5 px-2">Priority</th>
                  <th className="text-right py-2.5 pl-2 pr-3">Issue</th>
                </tr>
              </thead>
              <tbody>
                {priorityIssues.map((issue, i) => {
                  const priority = issue.labels.includes('P0') ? 'P0' : 'P1';
                  return (
                    <tr key={`${issue.repo}-${issue.number}`} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                      <td className="py-2 pl-3 pr-2 text-foreground">{issue.title.slice(0, 60)}</td>
                      <td className="py-2 px-2 font-mono text-muted-foreground">{issue.repo}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priority === 'P0' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{priority}</span>
                      </td>
                      <td className="py-2 pl-2 pr-3 text-right">
                        <a href={issue.url} target="_blank" rel="noopener noreferrer" className="text-primary no-underline hover:underline font-mono">#{issue.number}</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
