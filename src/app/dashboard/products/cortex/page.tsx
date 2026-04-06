import { ProductPage } from '@/components/product-page';

export default async function CortexProductPage() {
  return ProductPage({
    name: 'CORTEX',
    company: 'Axiom',
    pdlcStage: 'S1 DISCOVER (re-entry)',
    status: 'shelved',
    repoSlug: 'cortex',
    description: 'Visual capture + OCR. Pivoted from text/URL lane (Readwise covers it) to photo/whiteboard lane.',
    shelvedReason: 'Text/URL lane taken by Readwise. Pivoting to visual/OCR.',
    revivalCondition: 'FOUNDRY revenue unlocks. Then deploy cortex-bigclaw.vercel.app.',
  });
}
