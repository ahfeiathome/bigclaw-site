export const dynamic = 'force-dynamic';

import { ProductPage } from '@/components/product-page';
import { fetchPrdChecklist } from '@/lib/github';
import { parsePrdItems } from '@/lib/prd-parser';

export default async function RehearsalProductPage() {
  const prdContent = await fetchPrdChecklist('axiom', 'rehearsal/docs/product/PRD_CHECKLIST.md');
  const prdItems = prdContent ? parsePrdItems(prdContent) : [];

  return ProductPage({
    slug: 'rehearsal',
    name: 'REHEARSAL',
    company: 'Forge',
    pdlcStage: 'S3 DESIGN',
    status: 'active',
    description: 'Voice-first AI mock interview + verbal delivery feedback. Career prep — Education & Career sector.',
    nextGate: 'S4 BUILD — Code writes PRD, creates repo, scaffolds Expo/RN',
    revenueModel: 'Apple IAP',
    prdItems,
  });
}
