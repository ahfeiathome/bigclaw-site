export const dynamic = 'force-dynamic';

import { ProductPage } from '@/components/product-page';
import { fetchPrdChecklist } from '@/lib/github';
import { parsePrdItems } from '@/lib/prd-parser';

export default async function FatfrogmodelsProductPage() {
  const prdContent = await fetchPrdChecklist('fatfrogmodels');
  const prdItems = prdContent ? parsePrdItems(prdContent) : [];

  return ProductPage({
    slug: 'fatfrogmodels',
    name: 'fatfrogmodels',
    company: 'Axiom',
    pdlcStage: 'S7 LAUNCH',
    status: 'launched',
    productionUrl: 'https://fatfrogmodels.vercel.app',
    repoSlug: 'fatfrogmodels',
    description: "Scale model e-commerce for a friend's brand.",
    nextGate: "S8 GROW — DNS cutover pending friend's decision",
    revenueModel: 'Stripe',
    prdItems,
  });
}
