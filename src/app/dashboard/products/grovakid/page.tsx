import { ProductPage } from '@/components/product-page';
import { fetchPrdChecklist } from '@/lib/github';
import type { PrdItem } from '@/components/prd-checklist';

function parsePrdItems(content: string): PrdItem[] {
  const items: PrdItem[] = [];
  const lines = content.split('\n');
  let currentPriority = 'P0';

  for (const line of lines) {
    // Track priority section headers
    const priorityMatch = line.match(/^## (P\d)/);
    if (priorityMatch) {
      currentPriority = priorityMatch[1];
      continue;
    }

    // Parse table rows: | ID | Item | Category | Status | Owner | Target | GitHub |
    if (!line.startsWith('|') || line.match(/^\|[\s-:|]+\|$/) || line.includes('| ID ')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 5 || !cells[0].startsWith('PRD-')) continue;

    const statusRaw = cells[3].replace(/\*\*/g, '').trim();
    const status = (['Done', 'In Progress', 'Not Started', 'Deferred'].find(
      s => statusRaw.toLowerCase() === s.toLowerCase()
    ) || 'Not Started') as PrdItem['status'];

    const githubRaw = cells[6]?.trim() || '';
    const github = githubRaw.match(/#\d+/) ? githubRaw : undefined;

    items.push({
      id: cells[0],
      item: cells[1],
      category: cells[2],
      status,
      owner: cells[4],
      priority: currentPriority,
      github,
    });
  }

  return items;
}

export default async function GrovakidProductPage() {
  const prdContent = await fetchPrdChecklist();
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
