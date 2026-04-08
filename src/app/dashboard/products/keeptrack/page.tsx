import { ProductPage } from '@/components/product-page';
import { fetchPrdChecklist } from '@/lib/github';
import { parsePrdItems } from '@/lib/prd-parser';

export default async function KeepTrackProductPage() {
  const prdContent = await fetchPrdChecklist('keeptrack');
  const prdItems = prdContent ? parsePrdItems(prdContent) : [];

  return ProductPage({
    slug: 'keeptrack',
    name: 'KeepTrack',
    company: 'Axiom',
    pdlcStage: 'S5 HARDEN',
    status: 'active',
    previewUrl: 'https://keeptrack-bigclaw.vercel.app',
    repoSlug: 'keeptrack',
    description: 'Warranty and return tracker with OCR. All S7 features built. Archive ready for TestFlight.',
    nextGate: 'S6 PILOT — TestFlight upload (blocked: Apple Developer $99 💳)',
    blocker: 'Apple Developer ($99 💳)',
    revenueModel: 'Apple IAP',
    prdItems,
  });
}
