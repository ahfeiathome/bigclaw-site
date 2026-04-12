export const dynamic = 'force-dynamic';

import { ProductPage } from '@/components/product-page';
import { fetchPrdChecklist } from '@/lib/github';
import { parsePrdItems } from '@/lib/prd-parser';

export default async function CortexProductPage() {
  const prdContent = await fetchPrdChecklist('cortex');
  const prdItems = prdContent ? parsePrdItems(prdContent) : [];

  return ProductPage({
    slug: 'cortex',
    name: 'CORTEX',
    company: 'Axiom',
    pdlcStage: 'S4 BUILD',
    status: 'active',
    previewUrl: 'https://cortex-bigclaw.vercel.app',
    repoSlug: 'cortex',
    description: 'Visual capture + OCR. Photo/whiteboard lane — share images, bulk camera roll import, AI extraction.',
    nextGate: 'S5 HARDEN — real device testing (Share Sheet + Media Library)',
    revenueModel: 'Freemium + Apple IAP',
    prdItems,
  });
}
