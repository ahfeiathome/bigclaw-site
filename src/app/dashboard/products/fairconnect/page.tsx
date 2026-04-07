import { ProductPage } from '@/components/product-page';

export default async function FairConnectProductPage() {
  return ProductPage({
    name: 'FairConnect',
    company: 'Axiom',
    pdlcStage: 'S4 BUILD',
    status: 'active',
    previewUrl: 'https://fairconnect.vercel.app',
    repoSlug: 'fairconnect',
    description: "Maker's CRM for solo artists and craft fair vendors. PRD complete, data model live on Neon.",
    nextGate: 'S5 HARDEN — Complete CRUD, add tests',
    revenueModel: 'Apple IAP',
  });
}
