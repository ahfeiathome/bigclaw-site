export const dynamic = 'force-dynamic';

import { fetchRepoIssues } from '@/lib/github';
import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';

interface ProductSection {
  name: string;
  stage: string;
  status: string;
  description: string;
  previewUrl: string;
  repoSlug: string;
  nextGate: string;
  blocker: string;
  revenueModel: string;
}

const PRODUCTS: ProductSection[] = [
  {
    name: 'iris-studio',
    stage: 'S4 BUILD',
    status: 'Build active',
    description: 'Iris Chiu art portfolio and shop. Migrated from Wix.',
    previewUrl: 'https://iris-studio.vercel.app',
    repoSlug: 'iris-studio',
    nextGate: 'S6 PILOT — DNS cutover + Stripe keys',
    blocker: 'Stripe keys (💳) + DNS cutover (💳)',
    revenueModel: 'Stripe per-txn',
  },
  {
    name: 'fatfrogmodels',
    stage: 'S7 LAUNCH',
    status: 'Live',
    description: 'Scale model e-commerce for a friend\'s brand.',
    previewUrl: 'https://fatfrogmodels.vercel.app',
    repoSlug: 'fatfrogmodels',
    nextGate: 'S8 GROW — DNS cutover pending',
    blocker: '',
    revenueModel: 'Stripe',
  },
];

function stageTone(stage: string): 'info' | 'warning' | 'success' | 'neutral' {
  if (stage.includes('S1') || stage.includes('S2') || stage.includes('S3')) return 'info';
  if (stage.includes('S4') || stage.includes('S5')) return 'warning';
  if (stage.includes('S6') || stage.includes('S7') || stage.includes('S8')) return 'success';
  return 'neutral';
}

function hasGate(text: string): boolean {
  return text.includes('💳') || text.includes('⚖️') || text.includes('🧠');
}

export default async function EcommercePage() {
  const [irisIssues, fatfrogIssues] = await Promise.all([
    fetchRepoIssues('iris-studio'),
    fetchRepoIssues('fatfrogmodels'),
  ]);
  const issuesByRepo: Record<string, typeof irisIssues> = {
    'iris-studio': irisIssues,
    'fatfrogmodels': fatfrogIssues,
  };

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>E-Commerce</h1>
      <p className="text-sm text-muted-foreground mb-6">Art portfolio + scale model shop</p>

      <div className="space-y-8">
        {PRODUCTS.map((product) => {
          const issues = issuesByRepo[product.repoSlug] || [];
          const p0Count = issues.filter(i => i.labels.includes('P0')).length;

          return (
            <div key={product.name}>
              {/* Section header */}
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-lg font-bold text-foreground">{product.name}</h2>
                <SignalPill label={product.stage} tone={stageTone(product.stage)} />
                <span className="text-xs text-muted-foreground">{product.status}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                {/* KPIs */}
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue Model</div>
                  <div className="text-sm font-mono text-foreground mt-1">{product.revenueModel}</div>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Open Issues</div>
                  <div className="text-sm font-mono text-foreground mt-1">
                    {issues.length}
                    {p0Count > 0 && <span className="ml-2 text-red-400 text-xs">{p0Count} P0</span>}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Live URL</div>
                  <div className="mt-1">
                    <a href={product.previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary no-underline hover:underline font-mono">{product.previewUrl.replace('https://', '')}</a>
                  </div>
                </div>
              </div>

              {/* Gate / Blocker */}
              {(product.nextGate || product.blocker) && (
                <div className={`rounded-xl border p-3 mb-3 ${product.blocker && hasGate(product.blocker) ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-card'}`}>
                  {product.nextGate && <div className="text-xs text-foreground"><span className="text-muted-foreground">Next gate:</span> {product.nextGate}</div>}
                  {product.blocker && <div className={`text-xs mt-1 ${hasGate(product.blocker) ? 'text-amber-400' : 'text-muted-foreground'}`}><span className="text-muted-foreground">Blocker:</span> {product.blocker}</div>}
                </div>
              )}

              <p className="text-xs text-muted-foreground">{product.description}</p>

              {/* Visual separator */}
              <div className="border-b border-border/30 mt-6" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
