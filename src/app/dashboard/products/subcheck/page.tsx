import { ProductPage } from '@/components/product-page';

export default async function SubCheckProductPage() {
  return ProductPage({
    name: 'SubCheck',
    company: 'Axiom',
    pdlcStage: 'S1 DONE',
    status: 'active',
    repoSlug: 'subcheck',
    description: 'Subscription auditor and cancellation assistant.',
    nextGate: 'S2 DEFINE — after FairConnect + KeepTrack reach TestFlight',
    revenueModel: 'Apple IAP',
    previewUrl: 'https://subcheck-sage.vercel.app',
  });
}
