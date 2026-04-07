import { ProductPage } from '@/components/product-page';

export default async function IrisStudioProductPage() {
  return ProductPage({
    slug: 'iris-studio',
    name: 'iris-studio',
    company: 'Axiom',
    pdlcStage: 'S4 BUILD',
    status: 'active',
    previewUrl: 'https://iris-studio.vercel.app',
    description: 'Iris Chiu art portfolio and shop. Migrated from Wix.',
    nextGate: 'S6 PILOT — DNS cutover + Stripe keys',
    blocker: 'Stripe keys (💳) + DNS cutover (💳)',
    revenueModel: 'Stripe per-txn',
  });
}
