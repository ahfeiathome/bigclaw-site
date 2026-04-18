export const dynamic = 'force-dynamic';

import { ProductPage } from '@/components/product-page';

export default async function SubCheckProductPage() {
  return ProductPage({
    slug: 'subcheck',
    name: 'SubCheck',
    company: 'Axiom',
    pdlcStage: 'ARCHIVED',
    status: 'shelved',
    previewUrl: 'https://subcheck-bigclaw.vercel.app',
    repoSlug: 'subcheck',
    description: 'Subscription auditor and cancellation assistant. Subscription tracking absorbed into KeepTrack Lane 3. Repo frozen.',
    shelvedReason: 'Merged into KeepTrack Lane 3 (KT-013–018). No new development.',
    revenueModel: 'Apple IAP',
  });
}
