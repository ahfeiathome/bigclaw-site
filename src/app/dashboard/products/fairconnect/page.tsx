import { ProductPage } from '@/components/product-page';

export default async function FairConnectProductPage() {
  return ProductPage({
    name: 'FairConnect',
    company: 'Axiom',
    pdlcStage: 'S2 DEFINE',
    status: 'active',
    repoSlug: 'fairconnect',
    description: "Maker's CRM for solo artists and craft fair vendors.",
    nextGate: 'S3 PRD — Code writes after MRD approved',
    revenueModel: 'Apple IAP',
  });
}
