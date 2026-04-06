import { ProductPage } from '@/components/product-page';

export default async function FatfrogmodelsProductPage() {
  return ProductPage({
    name: 'fatfrogmodels',
    company: 'Axiom',
    pdlcStage: 'S7 LAUNCH',
    status: 'launched',
    productionUrl: 'https://fatfrogmodels.vercel.app',
    repoSlug: 'fatfrogmodels',
    description: "Scale model e-commerce for a friend's brand.",
    nextGate: "S8 GROW — DNS cutover pending friend's decision",
    revenueModel: 'Stripe',
  });
}
