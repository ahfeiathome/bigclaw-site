import { fetchAllIssues, fetchLearnieHealth, FORGE_REPOS, AXIOM_REPOS } from '@/lib/github';
import { StatusDot, SignalPill } from '@/components/dashboard';
import Link from 'next/link';

const PRODUCTS = [
  { slug: 'grovakid', name: 'GrovaKid', company: 'Forge', status: 'LIVE', stage: 'S4 BUILD', url: 'https://learnie-ai-ten.vercel.app', repo: 'learnie-ai', description: 'K-5 AI worksheet generator' },
  { slug: 'fairconnect', name: 'FairConnect', company: 'Axiom', status: 'SETUP', stage: 'MRD', repo: 'fairconnect', description: 'Fair & event social connector (iOS)' },
  { slug: 'keeptrack', name: 'KeepTrack', company: 'Axiom', status: 'SETUP', stage: 'MRD', repo: 'keeptrack', description: 'Personal inventory tracker (iOS)' },
  { slug: 'subcheck', name: 'SubCheck', company: 'Axiom', status: 'SETUP', stage: 'MRD', repo: 'subcheck', description: 'Subscription audit & cancellation (iOS)' },
  { slug: 'iris-studio', name: 'iris-studio', company: 'Axiom', status: 'SPEC', stage: 'Launch prep', description: 'AI art studio & marketplace' },
  { slug: 'fatfrogmodels', name: 'fatfrogmodels', company: 'Axiom', status: 'LIVE', stage: 'Launched', url: 'https://fatfrogmodels.vercel.app', description: 'Scale model e-commerce' },
];

export default async function ProductsPage() {
  const [allIssues, health] = await Promise.all([
    fetchAllIssues(),
    fetchLearnieHealth(),
  ]);

  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Products</h1>
        <p className="text-sm text-muted-foreground mt-1">All products across Forge and Axiom companies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRODUCTS.map((product) => {
          const issueCount = allIssues.filter(i => i.repo === product.repo).length;
          const p0Count = allIssues.filter(i => i.repo === product.repo && i.labels.includes('P0')).length;
          const isLive = product.status === 'LIVE';
          const borderColor = product.company === 'Forge' ? 'border-green-500/30' : 'border-blue-500/30';

          return (
            <Link
              key={product.slug}
              href={`/dashboard/products/${product.slug}`}
              className={`rounded-xl border ${borderColor} bg-card p-5 hover:border-primary/30 transition-all no-underline group`}
            >
              <div className="flex items-center gap-2 mb-2">
                <StatusDot status={isLive ? 'good' : 'neutral'} size="sm" />
                <span className="text-sm font-bold text-foreground">{product.name}</span>
                <SignalPill label={product.status} tone={isLive ? 'success' : product.status === 'SETUP' ? 'neutral' : 'info'} />
                <span className="text-[10px] text-muted-foreground ml-auto group-hover:text-primary transition-colors">→ detail</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{product.description}</p>
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-muted-foreground">{product.company}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">{product.stage}</span>
                {issueCount > 0 && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{issueCount} issues</span>
                  </>
                )}
                {p0Count > 0 && (
                  <span className="font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">P0: {p0Count}</span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
