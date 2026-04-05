import { readDataFile } from './shared';

export interface LearningEntry {
  id: string;
  date: string;
  project: string;
  title: string;
  rootCause: string;
  solution: string;
  timeSpent: string;
  tags: string[];
  company: string;
}

export interface LearningsData {
  entries: LearningEntry[];
}

export function parseLearnings(): LearningsData | null {
  const content = readDataFile('learnings');
  if (!content) return null;

  const entries: LearningEntry[] = [];

  // Split by ### DEV-NNN or ### date entries
  const blocks = content.split(/(?=^### )/m);

  for (const block of blocks) {
    // Match ### DEV-NNN DATE PROJECT — Description
    const headerMatch = block.match(/^### (DEV-\d+)\s+(\d{4}-\d{2}-\d{2})\s+(\S+)\s*—\s*(.+)$/m)
      // Also match ### DATE PROJECT — Description
      || block.match(/^### (\d{4}-\d{2}-\d{2})\s+(\S+)\s*—\s*(.+)$/m);

    if (!headerMatch) continue;

    let entry: LearningEntry;

    if (headerMatch[1].startsWith('DEV-')) {
      entry = {
        id: headerMatch[1],
        date: headerMatch[2],
        project: headerMatch[3],
        title: headerMatch[4].trim(),
        rootCause: extractBoldField(block, 'Root Cause'),
        solution: extractBoldField(block, 'Solution'),
        timeSpent: extractBoldField(block, 'Time Spent'),
        tags: extractHashTags(block),
        company: extractBoldField(block, 'Company'),
      };
    } else {
      entry = {
        id: '',
        date: headerMatch[1],
        project: headerMatch[2],
        title: headerMatch[3].trim(),
        rootCause: extractBoldField(block, 'Root Cause'),
        solution: extractBoldField(block, 'Solution'),
        timeSpent: extractBoldField(block, 'Time Spent'),
        tags: extractHashTags(block),
        company: extractBoldField(block, 'Company'),
      };
    }

    entries.push(entry);
  }

  return { entries };
}

function extractBoldField(block: string, field: string): string {
  const match = block.match(new RegExp(`\\*\\*${field}:\\*\\*\\s*(.+)`, 'i'));
  return match ? match[1].trim() : '';
}

function extractHashTags(block: string): string[] {
  const match = block.match(/\*\*Tags:\*\*\s*(.+)/i);
  if (!match) return [];
  return match[1].match(/#[\w-]+/g)?.map(t => t.slice(1)) || [];
}
