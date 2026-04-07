import { ProductPage } from '@/components/product-page';

export default async function KeepTrackProductPage() {
  return ProductPage({
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
  });
}
