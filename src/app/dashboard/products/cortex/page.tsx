import { ProductPage } from '@/components/product-page';

export default async function CortexProductPage() {
  return ProductPage({
    name: 'CORTEX',
    company: 'Axiom',
    pdlcStage: 'S4 BUILD',
    status: 'active',
    repoSlug: 'cortex',
    description: 'Visual capture + OCR. Photo/whiteboard lane — AI extracts, organizes, and makes it searchable.',
    nextGate: 'CP-003 iOS Share Sheet + CP-004 Bulk Photo Import',
    revenueModel: 'Apple IAP',
    previewUrl: 'https://cortex-bigclaw.vercel.app',
  });
}
