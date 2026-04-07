import { ProductPage } from '@/components/product-page';

export default async function RehearsalProductPage() {
  return ProductPage({
    slug: 'rehearsal',
    name: 'REHEARSAL',
    company: 'Forge',
    pdlcStage: 'S3 DESIGN',
    status: 'active',
    description: 'Voice-first AI mock interview + verbal delivery feedback. Career prep — Education & Career sector.',
    nextGate: 'S4 BUILD — Code writes PRD, creates repo, scaffolds Expo/RN',
    revenueModel: 'Apple IAP',
  });
}
