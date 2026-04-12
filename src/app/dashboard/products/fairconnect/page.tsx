export const dynamic = 'force-dynamic';

import { ProductPage } from '@/components/product-page';
import { fetchPrdChecklist } from '@/lib/github';
import { parsePrdItems } from '@/lib/prd-parser';

export default async function FairConnectProductPage() {
  const prdContent = await fetchPrdChecklist('fairconnect');
  const prdItems = prdContent ? parsePrdItems(prdContent) : [];

  return ProductPage({
    slug: 'fairconnect',
    name: 'FairConnect',
    company: 'Axiom',
    pdlcStage: 'S4 BUILD',
    status: 'active',
    previewUrl: 'https://fairconnect.vercel.app',
    repoSlug: 'fairconnect',
    description: "Maker's CRM for solo artists and craft fair vendors. PRD complete, data model live on Neon.",
    nextGate: 'S5 HARDEN — Complete CRUD, add tests',
    revenueModel: 'Apple IAP',
    prdItems,
  });
}
