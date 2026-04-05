import { readDataFile, extractSection, parseMarkdownTable } from './shared';

export interface TodoItem {
  number: string;
  item: string;
  type: string;
  time: string;
  unblocks: string;
}

export interface TODOData {
  thisWeek: TodoItem[];
  upcoming: TodoItem[];
  allItems: TodoItem[];
}

export function parseTODO(): TODOData | null {
  const content = readDataFile('founderTodo');
  if (!content) return null;

  const parseTodoTable = (section: string): TodoItem[] => {
    const rows = parseMarkdownTable(section);
    return rows.map(r => ({
      number: r['#'] || Object.values(r)[0] || '',
      item: r['Item'] || Object.values(r)[1] || '',
      type: r['Type'] || Object.values(r)[2] || '',
      time: r['Time'] || Object.values(r)[3] || '',
      unblocks: r['Unblocks'] || Object.values(r)[4] || '',
    }));
  };

  // THIS WEEK section
  const thisWeekSection = extractSection(content, 'Priority Timeline')
    || extractSection(content, 'THIS WEEK');
  const thisWeek = parseTodoTable(thisWeekSection);

  // Collect all time-blocked sections
  const allItems: TodoItem[] = [...thisWeek];
  const upcoming: TodoItem[] = [];

  // Look for other date sections (BY APRIL 10, AFTER NAMING, etc.)
  const sectionMatches = content.matchAll(/^### (.+)$/gm);
  for (const match of sectionMatches) {
    const heading = match[1].trim();
    if (heading.toUpperCase() === 'THIS WEEK') continue;
    const sec = content.slice(match.index!);
    const endMatch = sec.slice(1).search(/^### /m);
    const sectionContent = endMatch === -1 ? sec : sec.slice(0, endMatch + 1);
    const items = parseTodoTable(sectionContent);
    upcoming.push(...items);
    allItems.push(...items);
  }

  return { thisWeek, upcoming, allItems };
}
