import { readDataFile } from './shared';

export interface KHEntry {
  id: string;
  agent: string;
  date: string;
  type: string;
  domain: string;
  what: string;
  source: string;
  applied: string;
  tags: string[];
}

export interface KHData {
  entries: KHEntry[];
}

export function parseKH(): KHData | null {
  const content = readDataFile('knowledgeHub');
  if (!content) return null;

  const entries: KHEntry[] = [];

  // Split by ## KH-NNN headings
  const entryBlocks = content.split(/(?=^## KH-\d+)/m);

  for (const block of entryBlocks) {
    const headerMatch = block.match(/^## (KH-\d+)\s*—\s*(\w+)\s*—\s*(.+)$/m);
    if (!headerMatch) continue;

    const entry: KHEntry = {
      id: headerMatch[1],
      agent: headerMatch[2],
      date: headerMatch[3].trim(),
      type: extractField(block, 'Type'),
      domain: extractField(block, 'Domain'),
      what: extractField(block, 'What'),
      source: extractField(block, 'Source'),
      applied: extractField(block, 'Applied'),
      tags: extractTags(block),
    };

    entries.push(entry);
  }

  return { entries };
}

function extractField(block: string, field: string): string {
  const match = block.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`, 'i'));
  return match ? match[1].trim() : '';
}

function extractTags(block: string): string[] {
  const match = block.match(/\*\*Tags:\*\*\s*(.+)/i);
  if (!match) return [];
  return match[1].match(/#[\w-]+/g)?.map(t => t.slice(1)) || [];
}
