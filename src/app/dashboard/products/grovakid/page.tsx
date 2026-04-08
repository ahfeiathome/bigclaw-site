import { ProductPage } from '@/components/product-page';
import { fetchPrdChecklist } from '@/lib/github';
import { parsePrdItems } from '@/lib/prd-parser';

export default async function GrovakidProductPage() {
  const prdContent = await fetchPrdChecklist('learnie-ai');
  const prdItems = prdContent ? parsePrdItems(prdContent) : [];

  return ProductPage({
    slug: 'grovakid',
    name: 'GrovaKid',
    company: 'Forge',
    pdlcStage: 'S4 BUILD',
    status: 'active',
    previewUrl: 'https://learnie-ai-ten.vercel.app',
    productionUrl: 'https://learnie-ai-ten.vercel.app',
    repoSlug: 'learnie-ai',
    description: 'K-5 AI worksheet generator. Personalized practice, progress tracking, Common Core aligned.',
    nextGate: 'S5 HARDEN — UI polish + on-device review',
    blocker: 'Co-founder agreement (⚖️)',
    revenueModel: '$19.99/mo (deferred)',
    prdItems,
  });
}
