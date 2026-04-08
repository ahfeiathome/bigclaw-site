import type { PrdItem } from '@/components/prd-checklist';

/**
 * Parse PRD_CHECKLIST.md content into PrdItem array.
 * Expects table rows: | ID | Item | Category | Status | Owner | Target | GitHub |
 * Tracks P0/P1/P2 section headers for priority assignment.
 */
export function parsePrdItems(content: string): PrdItem[] {
  const items: PrdItem[] = [];
  const lines = content.split('\n');
  let currentPriority = 'P0';

  for (const line of lines) {
    const priorityMatch = line.match(/^## (P\d)/);
    if (priorityMatch) {
      currentPriority = priorityMatch[1];
      continue;
    }

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
