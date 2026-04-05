import { readDataFile, extractSection, parseMarkdownTable } from './shared';

export interface PRDItem {
  id: string;
  item: string;
  category: string;
  status: string;
  owner: string;
  target: string;
  github: string;
}

export interface CategorySummary {
  category: string;
  done: number;
  inProgress: number;
  notStarted: number;
  deferred: number;
  total: number;
  percentComplete: number;
}

export interface PRDData {
  items: PRDItem[];
  categories: CategorySummary[];
  summary: { done: number; inProgress: number; notStarted: number; deferred: number; total: number };
  p0Items: PRDItem[];
  p1Items: PRDItem[];
  p2Items: PRDItem[];
}

export function parsePRD(): PRDData | null {
  const content = readDataFile('prdChecklist');
  if (!content) return null;

  const parseItems = (section: string): PRDItem[] => {
    const rows = parseMarkdownTable(section);
    return rows.map(r => ({
      id: r['ID'] || Object.values(r)[0] || '',
      item: r['Item'] || Object.values(r)[1] || '',
      category: r['Category'] || Object.values(r)[2] || '',
      status: r['Status'] || Object.values(r)[3] || '',
      owner: r['Owner'] || Object.values(r)[4] || '',
      target: r['Target'] || Object.values(r)[5] || '',
      github: r['GitHub'] || Object.values(r)[6] || '',
    }));
  };

  // Category Summary
  const catSection = extractSection(content, 'Category Summary');
  const catRows = parseMarkdownTable(catSection);
  const categories: CategorySummary[] = catRows.map(r => ({
    category: r['Category'] || Object.values(r)[0] || '',
    done: parseInt(r['Done'] || Object.values(r)[1] || '0'),
    inProgress: parseInt(r['In Progress'] || Object.values(r)[2] || '0'),
    notStarted: parseInt(r['Not Started'] || Object.values(r)[3] || '0'),
    deferred: parseInt(r['Deferred'] || Object.values(r)[4] || '0'),
    total: parseInt(r['Total'] || Object.values(r)[5] || '0'),
    percentComplete: parseFloat(r['% Complete'] || Object.values(r)[6] || '0'),
  }));

  // Priority sections
  const p0Section = extractSection(content, 'P0 — Must Ship') || extractSection(content, 'P0');
  const p1Section = extractSection(content, 'P1 — Important') || extractSection(content, 'P1');
  const p2Section = extractSection(content, 'P2 — Later') || extractSection(content, 'P2');

  const p0Items = parseItems(p0Section);
  const p1Items = parseItems(p1Section);
  const p2Items = parseItems(p2Section);
  const items = [...p0Items, ...p1Items, ...p2Items];

  const summary = {
    done: items.filter(i => i.status === 'Done').length,
    inProgress: items.filter(i => i.status === 'In Progress').length,
    notStarted: items.filter(i => i.status === 'Not Started').length,
    deferred: items.filter(i => i.status === 'Deferred').length,
    total: items.length,
  };

  return { items, categories, summary, p0Items, p1Items, p2Items };
}
