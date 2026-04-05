import { fetchAllIssues } from '@/lib/github';
import { StatusDot, SignalPill, SectionCard } from '@/components/dashboard';
import { ALL_PRODUCTS } from '@/lib/content';
import Link from 'next/link';

// Product metadata with PDLC info
const PRODUCT_META: Record<string, { company: string; companyColor: string; revenueModel: string; pdlcStage: string; description: string; url?: string; repo?: string }> = {
  grovakid:      { company: 'Forge', companyColor: 'green', revenueModel: 'Deferred', pdlcStage: 'S4 BUILD', description: 'K-5 AI worksheet generator', url: 'https://learnie-ai-ten.vercel.app', repo: 'learnie-ai' },
  radar:         { company: 'Axiom', companyColor: 'blue', revenueModel: 'Alpaca', pdlcStage: 'Paper trading', description: 'Algorithmic trading engine', repo: 'the-firm' },
  fatfrogmodels: { company: 'Axiom', companyColor: 'blue', revenueModel: 'Stripe', pdlcStage: 'Launched', description: 'Scale model e-commerce', url: 'https://fatfrogmodels.vercel.app', repo: 'fatfrogmodels' },
  fairconnect:   { company: 'Axiom', companyColor: 'blue', revenueModel: 'Apple IAP', pdlcStage: 'S2 DEFINE', description: 'Fair & event social connector (iOS)', repo: 'fairconnect' },
  keeptrack:     { company: 'Axiom', companyColor: 'blue', revenueModel: 'Apple IAP', pdlcStage: 'S2 DEFINE', description: 'Personal inventory tracker (iOS)', repo: 'keeptrack' },
  subcheck:      { company: 'Axiom', companyColor: 'blue', revenueModel: 'Apple IAP', pdlcStage: 'S1 DONE', description: 'Subscription audit & cancellation (iOS)', repo: 'subcheck' },
  'iris-studio': { company: 'Axiom', companyColor: 'blue', revenueModel: 'Stripe', pdlcStage: 'Pre-build', description: 'AI art studio & marketplace' },
};

function statusBadge(status: string) {
  switch (status) {
    case 'LIVE': return <SignalPill label="LIVE" tone="success" />;
    case 'PAPER': return <SignalPill label="PAPER" tone="warning" />;
    case 'BUILD': return <SignalPill label="BUILD" tone="info" />;
    case 'SETUP': return <SignalPill label="SETUP" tone="neutral" />;
    default: return <SignalPill label={status} tone="neutral" />;
  }
}

export default async function ProductsPage() {
  const allIssues = await fetchAllIssues();

  // Build active projects from P0/P1 issues
  const activeProjects = allIssues
    .filter(i => i.labels.includes('P0') || i.labels.includes('P1'))
    .slice(0, 15);

  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground mt-1">All products across Forge and Axiom companies</p>
      </div>

      {/* ── Section 1: PDLC Stage Summary ─────────────────────────── */}
      <SectionCard title="Product Summary — PDLC Stage" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2.5 pl-3 pr-2">Product</th>
                <th className="text-left py-2.5 px-2">Company</th>
                <th className="text-left py-2.5 px-2">PDLC Stage</th>
                <th className="text-left py-2.5 px-2">Revenue Model</th>
                <th className="text-center py-2.5 px-2">Status</th>
                <th className="text-right py-2.5 pl-2 pr-3">Issues</th>
              </tr>
            </thead>
            <tbody>
              {ALL_PRODUCTS.map((product, i) => {
                const meta = PRODUCT_META[product.slug];
                const issueCount = meta?.repo ? allIssues.filter(issue => issue.repo === meta.repo).length : 0;
                const p0Count = meta?.repo ? allIssues.filter(issue => issue.repo === meta.repo && issue.labels.includes('P0')).length : 0;
                return (
                  <tr key={product.slug} className={`border-b border-border ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2 pl-3 pr-2">
                      <Link href={product.href} className="text-foreground font-medium no-underline hover:text-primary">{product.name}</Link>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${meta?.companyColor === 'green' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {meta?.company}
                      </span>
                    </td>
                    <td className="py-2 px-2 font-mono text-muted-foreground">{meta?.pdlcStage}</td>
                    <td className="py-2 px-2 text-muted-foreground">{meta?.revenueModel}</td>
                    <td className="py-2 px-2 text-center">{statusBadge(product.status)}</td>
                    <td className="py-2 pl-2 pr-3 text-right font-mono">
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
              {/* BigClaw Dashboard */}
              <tr className={`border-b border-border ${ALL_PRODUCTS.length % 2 === 1 ? 'bg-muted/50' : ''}`}>
                <td className="py-2 pl-3 pr-2 text-foreground font-medium">BigClaw Dashboard</td>
                <td className="py-2 px-2"><span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-purple-500/10 text-purple-400">BigClaw AI</span></td>
                <td className="py-2 px-2 font-mono text-muted-foreground">Active</td>
                <td className="py-2 px-2 text-muted-foreground">Internal</td>
                <td className="py-2 px-2 text-center"><SignalPill label="LIVE" tone="success" /></td>
                <td className="py-2 pl-2 pr-3 text-right font-mono text-muted-foreground">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* ── Section 2: Active Projects (P0/P1 work items) ─────────── */}
      <SectionCard title="Active Projects — P0/P1 Work Items" className="mb-6">
        {activeProjects.length === 0 ? (
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
                {activeProjects.map((issue, i) => {
                  const priority = issue.labels.includes('P0') ? 'P0' : 'P1';
                  return (
                    <tr key={`${issue.repo}-${issue.number}`} className={`border-b border-border ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                      <td className="py-2 pl-3 pr-2 text-foreground">{issue.title.slice(0, 60)}</td>
                      <td className="py-2 px-2 font-mono text-muted-foreground">{issue.repo}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priority === 'P0' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                          {priority}
                        </span>
                      </td>
                      <td className="py-2 pl-2 pr-3 text-right">
                        <a href={issue.url} target="_blank" rel="noopener noreferrer" className="text-primary no-underline hover:underline font-mono">
                          #{issue.number}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ── Section 3: Product Detail Cards ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ALL_PRODUCTS.map((product) => {
          const meta = PRODUCT_META[product.slug];
          const issueCount = meta?.repo ? allIssues.filter(i => i.repo === meta.repo).length : 0;
          const borderColor = meta?.companyColor === 'green' ? 'border-green-500/30' : 'border-blue-500/30';

          return (
            <Link
              key={product.slug}
              href={product.href}
              className={`rounded-xl border ${borderColor} bg-card p-5 hover:border-primary/30 transition-all no-underline group`}
            >
              <div className="flex items-center gap-2 mb-2">
                <StatusDot status={product.status === 'LIVE' ? 'good' : product.status === 'PAPER' ? 'warn' : 'neutral'} size="sm" />
                <span className="text-sm font-bold text-foreground">{product.name}</span>
                {statusBadge(product.status)}
                <span className="text-[10px] text-muted-foreground ml-auto group-hover:text-primary transition-colors">detail →</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{meta?.description}</p>
              <div className="flex items-center gap-3 text-[10px]">
                <span className={`px-1.5 py-0.5 rounded font-mono ${meta?.companyColor === 'green' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>{meta?.company}</span>
                <span className="text-muted-foreground">{meta?.pdlcStage}</span>
                {issueCount > 0 && <span className="text-muted-foreground">{issueCount} issues</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
