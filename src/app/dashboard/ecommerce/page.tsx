import { fetchAllIssues, fetchRecentClosedIssues } from '@/lib/github';
import { ProductPageTemplate } from '@/components/product-page-template';

export default async function ECommercePage() {
  const [allIssues, closedIssues] = await Promise.all([
    fetchAllIssues(),
    fetchRecentClosedIssues(14),
  ]);

  const fatfrogIssues = allIssues.filter(i => i.repo === 'fatfrogmodels');
  const fatfrogClosed = closedIssues.filter(i => i.repo === 'fatfrogmodels');

  return (
    <div>
      <h1 className="mb-6" style={{ fontSize: '28px', fontWeight: 700 }}>E-Commerce</h1>

      {/* ── Section 1: iris-studio ───────────────────────────────── */}
      <div className="mb-8">
        <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
          iris-studio
        </div>
        <ProductPageTemplate
          name="iris-studio"
          description="AI art studio & marketplace — Stripe payments"
          kpis={{
            pdlcStage: 'Pre-build',
            company: 'Axiom',
            companyColor: 'blue',
            revenueModel: 'Stripe',
            openIssues: { p0: 0, p1: 0, p2: 0, total: 0 },
          }}
          productStatus={{
            launchChecklist: [
              { item: 'Stripe connected', done: false },
              { item: 'DNS pointed', done: false },
              { item: 'Product catalog', done: false },
              { item: 'Payment flow tested', done: false },
              { item: 'Landing page live', done: false },
            ],
          }}
          projectStatus={{ issues: [] }}
        />
      </div>

      {/* ── Separator ───────────────────────────────────────────── */}
      <div className="border-t border-border my-8" />

      {/* ── Section 2: fatfrogmodels ─────────────────────────────── */}
      <div>
        <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
          fatfrogmodels
        </div>
        <ProductPageTemplate
          name="fatfrogmodels"
          description="Scale model e-commerce — Stripe payments"
          kpis={{
            pdlcStage: 'Launched',
            company: 'Axiom',
            companyColor: 'blue',
            revenueModel: 'Stripe',
            liveStatus: { online: true, url: 'https://fatfrogmodels.vercel.app' },
            openIssues: {
              p0: fatfrogIssues.filter(i => i.labels.includes('P0')).length,
              p1: fatfrogIssues.filter(i => i.labels.includes('P1')).length,
              p2: fatfrogIssues.filter(i => i.labels.includes('P2')).length,
              total: fatfrogIssues.length,
            },
          }}
          productStatus={{
            launchChecklist: [
              { item: 'Stripe connected', done: true },
              { item: 'DNS pointed', done: true },
              { item: 'Product catalog', done: true },
              { item: 'Payment flow tested', done: true },
              { item: 'Landing page live', done: true },
            ],
          }}
          projectStatus={{
            issues: fatfrogIssues,
            recentClosed: fatfrogClosed,
          }}
        />
      </div>
    </div>
  );
}
