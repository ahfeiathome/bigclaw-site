import { ProductPage } from '@/components/product-page';

export default async function KeepTrackProductPage() {
  return ProductPage({
    name: 'KeepTrack',
    company: 'Axiom',
    pdlcStage: 'S2 DEFINE',
    status: 'active',
    previewUrl: 'https://keeptrack-bigclaw.vercel.app',
    repoSlug: 'keeptrack',
    description: 'Warranty and return tracker. Reuses OCR from VAULT.',
    nextGate: 'S3 PRD',
    revenueModel: 'Apple IAP',
  });
}
