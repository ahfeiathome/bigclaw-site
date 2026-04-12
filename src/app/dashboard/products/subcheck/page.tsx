export const dynamic = 'force-dynamic';

import { ProductPage } from '@/components/product-page';

export default async function SubCheckProductPage() {
  return ProductPage({
    slug: 'subcheck',
    name: 'SubCheck',
    company: 'Axiom',
    pdlcStage: 'S1 DONE',
    status: 'active',
    previewUrl: 'https://subcheck-bigclaw.vercel.app',
    repoSlug: 'subcheck',
    description: 'Subscription auditor and cancellation assistant.',
    nextGate: 'S2 DEFINE — after FairConnect + KeepTrack reach TestFlight',
    revenueModel: 'Apple IAP',
  });
}
