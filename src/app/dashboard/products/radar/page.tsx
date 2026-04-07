import { ProductPage } from '@/components/product-page';

export default async function RadarProductPage() {
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
  });
}
