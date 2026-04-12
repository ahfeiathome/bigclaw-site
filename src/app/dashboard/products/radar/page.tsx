export const dynamic = 'force-dynamic';

import { ProductPage } from '@/components/product-page';
import { fetchPrdChecklist } from '@/lib/github';
import { parsePrdItems } from '@/lib/prd-parser';

export default async function RadarProductPage() {
  const prdContent = await fetchPrdChecklist('the-firm', 'scripts/radar/docs/product/PRD_CHECKLIST.md');
  const prdItems = prdContent ? parsePrdItems(prdContent) : [];

  return ProductPage({
    slug: 'radar',
    name: 'RADAR',
    company: 'BigClaw AI',
    pdlcStage: 'S4 BUILD',
    status: 'active',
    previewUrl: 'https://radar-bigclaw.vercel.app',
    repoSlug: 'the-firm',
    description: 'Autonomous AI trading engine. Dual-account paper + live. Rex (CFO) holds trade authority.',
    nextGate: 'Phase 0 gate April 18 (🧠) — then S3 PRD',
    blocker: 'Phase 0 gate review (🧠)',
    revenueModel: 'Personal brokerage',
    prdItems,
  });
}
