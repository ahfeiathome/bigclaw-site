export interface TableRow { cells: string[] }

export function parseMarkdownTable(content: string): TableRow[] {
  const lines = content.split('\n').filter(l => l.includes('|') && !l.match(/^\|[\s-:|]+\|$/));
  if (lines.length <= 1) return [];
  return lines.slice(1).map(line => ({
    cells: line.split('|').map(c => c.trim()).filter(Boolean),
  }));
}

export function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`^##+ ${heading}`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^##+ /) && !lines[i].includes(heading)) { end = i; break; }
  }
  return lines.slice(0, end).join('\n');
}

export interface DevEntry {
  id: string;
  date: string;
  project: string;
  company: string;
  title: string;
  problem: string;
  rootCause: string;
  prevention: string;
  tags: string[];
}

export function parseLearningsEntries(content: string): DevEntry[] {
  const entries: DevEntry[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    // Match DEV-### entries: "### DEV-015 [date] [company] project — title" or "## DEV-051 ..."
    const devMatch = lines[i].match(/^#{2,3}\s+(DEV-\d+)\s+(?:\[([^\]]*)\]\s+)?(?:\[([^\]]*)\]\s+)?(.+)/);
    if (!devMatch) continue;

    const id = devMatch[1];
    const dateOrCompany = devMatch[2] || '';
    const companyOrProject = devMatch[3] || '';
    const titleRest = devMatch[4] || '';

    // Extract block until next heading
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].match(/^#{2,3}\s/)) { end = j; break; }
    }
    const block = lines.slice(i + 1, end).join('\n');

    // Parse structured fields
    const problemMatch = block.match(/\*\*(?:Problem|What broke):\*\*\s*(.+)/);
    const rootCauseMatch = block.match(/\*\*Root [Cc]ause:\*\*\s*(.+)/);
    const preventionMatch = block.match(/\*\*(?:Prevention|Rule):\*\*\s*(.+)/);
    const tagsMatch = block.match(/\*\*Tags:\*\*\s*(.+)/);
    const companyMatch = block.match(/\*\*Company:\*\*\s*(.+)/);

    // Parse title: "project — description" or "project: description"
    const titleParts = titleRest.split(/\s*[—–:]\s*/);
    const project = titleParts[0]?.trim() || '';
    const title = titleParts.slice(1).join(' — ').trim() || titleRest;

    entries.push({
      id,
      date: dateOrCompany || '',
      project,
      company: companyMatch?.[1]?.trim() || companyOrProject || '',
      title,
      problem: problemMatch?.[1]?.trim() || '',
      rootCause: rootCauseMatch?.[1]?.trim() || '',
      prevention: preventionMatch?.[1]?.trim() || '',
      tags: tagsMatch?.[1]?.match(/#[\w-]+/g)?.map(t => t.slice(1)) || [],
    });
  }

  return entries;
}
