export const dynamic = 'force-dynamic';

import { ProductPage } from '@/components/product-page';
import { fetchPrdChecklist } from '@/lib/github';
import { parsePrdItems } from '@/lib/prd-parser';
import type { VmGroup } from '@/components/vm-group-checklist';

// Phone review grouped by user flow — Michael walks through the app once
const VM_GROUPS: VmGroup[] = [
  { area: 'Sign Up & Onboarding',  ids: ['PRD-028', 'PRD-006'],                              whatToTest: 'Create account → onboarding wizard → first-run feel' },
  { area: 'Add Child & COPPA',     ids: ['PRD-016', 'PRD-018'],                              whatToTest: 'Add child → consent checkbox required → parental consent text' },
  { area: 'Generate Worksheet',    ids: ['PRD-001', 'PRD-003', 'PRD-004', 'PRD-011', 'PRD-013'], whatToTest: 'Pick subject → generate → within 5 sec? → age-appropriate?' },
  { area: 'Worksheet Output',      ids: ['PRD-014', 'PRD-015'],                              whatToTest: 'Download PDF → answer key → print test (ink/margins)' },
  { area: 'Scan & Grade',          ids: ['PRD-010', 'PRD-039'],                              whatToTest: 'Scan worksheet → QR code → AI grades' },
  { area: 'Dashboard & Progress',  ids: ['PRD-027', 'PRD-040'],                              whatToTest: 'Per-child progress → subject breakdown' },
  { area: 'Library & Favorites',   ids: ['PRD-038'],                                         whatToTest: 'Past worksheets → star favorites' },
  { area: 'Settings & Account',    ids: ['PRD-037', 'PRD-023'],                              whatToTest: 'Change name → delete account → 30-day warning' },
  { area: 'Safety & Content',      ids: ['PRD-020', 'PRD-012'],                              whatToTest: 'Try unsafe interest → rejected? → no inappropriate content' },
  { area: 'Personalization',       ids: ['PRD-026'],                                         whatToTest: 'Interests picker → select/deselect' },
  { area: 'Accessibility',         ids: ['PRD-041'],                                         whatToTest: 'Toggle dyslexia font → text changes' },
  { area: 'Marketing Site',        ids: ['PRD-031', 'PRD-036'],                              whatToTest: 'Landing page renders → share link → preview card shows' },
  { area: 'Auth',                  ids: ['PRD-032'],                                         whatToTest: 'Login → Google SSO option → session persists' },
];

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
    vmGroups: VM_GROUPS,
  });
}
