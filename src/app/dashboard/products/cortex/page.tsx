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
    pdlcStage: 'RETIRED',
    status: 'shelved',
    repoSlug: 'cortex',
    description: 'Visual capture + OCR. Photo/whiteboard lane — share images, bulk camera roll import, AI extraction. Retired: Readwise covers the text lane; visual OCR pivot had no clear monetization path.',
    shelvedReason: 'Readwise dominates the text/URL capture lane. Visual OCR pivot lacked clear monetization path.',
    revivalCondition: 'Clear monetization angle (B2B OCR API, vertical-specific use case) with paying customer interest.',
    revenueModel: 'Freemium + Apple IAP',
    prdItems,
  });
}
