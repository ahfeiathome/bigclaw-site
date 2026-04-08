import { ProductPage } from '@/components/product-page';
import { fetchPrdChecklist } from '@/lib/github';
import { parsePrdItems } from '@/lib/prd-parser';

export default async function IrisStudioProductPage() {
  const prdContent = await fetchPrdChecklist('iris-studio');
  const prdItems = prdContent ? parsePrdItems(prdContent) : [];

  return ProductPage({
    slug: 'iris-studio',
    name: 'iris-studio',
    company: 'Axiom',
    pdlcStage: 'S4 BUILD',
    status: 'active',
    previewUrl: 'https://iris-studio.vercel.app',
    repoSlug: 'iris-studio',
    description: 'Iris Chiu art portfolio and shop. Migrated from Wix.',
    nextGate: 'S6 PILOT — DNS cutover + Stripe keys',
    blocker: 'Stripe keys (💳) + DNS cutover (💳)',
    revenueModel: 'Stripe per-txn',
    prdItems,
  });
}
