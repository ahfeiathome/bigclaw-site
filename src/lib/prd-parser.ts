import type { PrdItem, VerifyValue } from '@/components/prd-checklist';

/**
 * Parse PRD_CHECKLIST.md content into PrdItem array.
 * Supports two column schemas:
 *   - 9-col: | ID | Item | Category | Status | Owner | Target | GitHub | Verified | Verified By |
 *   - 10-col: | ID | Item | Category | Status | Owner | Target | GitHub | V-G | V-C | V-M |
 * Tracks P0/P1/P2 section headers for priority assignment.
 */

function parseVerify(cell: string | undefined): VerifyValue | undefined {
  if (!cell) return undefined;
  const v = cell.trim();
  if (v.includes('✅')) return '✅';
  if (v === 'N/A' || v === 'n/a') return 'N/A';
  if (v.includes('❌') || v === '—') return '❌';
  return undefined;
}

export function parsePrdItems(content: string): PrdItem[] {
  const items: PrdItem[] = [];
  const lines = content.split('\n');
  let currentPriority = 'P0';

  // Detect schema from header row
  let isTripleVerify = false;
  for (const line of lines) {
    if (line.includes('| V-G') || line.includes('|V-G') || line.includes('| V-G ')) {
      isTripleVerify = true;
      break;
    }
  }

  for (const line of lines) {
    const priorityMatch = line.match(/^## (P\d)/);
    if (priorityMatch) {
      currentPriority = priorityMatch[1];
      continue;
    }

    if (!line.startsWith('|') || line.match(/^\|[\s-:|]+\|$/) || line.includes('| ID ')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 5 || !cells[0].match(/^[A-Z]+-\d+$/)) continue;

    const statusRaw = cells[3].replace(/\*\*/g, '').trim();
    const status = (['Done', 'In Progress', 'Not Started', 'Deferred'].find(
      s => statusRaw.toLowerCase() === s.toLowerCase()
    ) || 'Not Started') as PrdItem['status'];

    const githubRaw = cells[6]?.trim() || '';
    const github = githubRaw.match(/#\d+/) ? githubRaw : undefined;

    if (isTripleVerify) {
      items.push({
        id: cells[0],
        item: cells[1],
        category: cells[2],
        status,
        owner: cells[4],
        priority: currentPriority,
        github,
        verifyG: parseVerify(cells[7]),
        verifyC: parseVerify(cells[8]),
        verifyM: parseVerify(cells[9]),
      });
    } else {
      // Legacy single-column schema (col 7 = Verified ✅/❌, col 8 = Verified By)
      items.push({
        id: cells[0],
        item: cells[1],
        category: cells[2],
        status,
        owner: cells[4],
        priority: currentPriority,
        github,
        verified: cells[7]?.includes('✅') ?? false,
      });
    }
  }

  return items;
}
