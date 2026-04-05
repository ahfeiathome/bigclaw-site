import { fetchAllIssues, fetchRecentClosedIssues } from '@/lib/github';
import { ProductPageTemplate } from '@/components/product-page-template';

export default async function FatfrogmodelsPage() {
  const [allIssues, closedIssues] = await Promise.all([
    fetchAllIssues(),
    fetchRecentClosedIssues(14),
  ]);

  const issues = allIssues.filter(i => i.repo === 'fatfrogmodels');
  const recentClosed = closedIssues.filter(i => i.repo === 'fatfrogmodels');

  return (
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
          p0: issues.filter(i => i.labels.includes('P0')).length,
          p1: issues.filter(i => i.labels.includes('P1')).length,
          p2: issues.filter(i => i.labels.includes('P2')).length,
          total: issues.length,
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
        issues,
        recentClosed,
      }}
    />
  );
}
