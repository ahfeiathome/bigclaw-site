import { ProductPageTemplate } from '@/components/product-page-template';

export default function IrisStudioPage() {
  return (
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
      projectStatus={{
        issues: [],
      }}
    />
  );
}
