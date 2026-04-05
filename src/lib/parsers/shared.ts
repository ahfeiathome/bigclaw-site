import fs from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');

/** Read a synced data file by manifest key. Returns null if missing. */
export function readDataFile(key: string): string | null {
  const filePath = path.join(DATA_DIR, `${key}.md`);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

/** Extract a ## section from markdown content */
export function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`^## ${escapeRegex(heading)}\\s*$`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^## /)) { end = i; break; }
  }
  return lines.slice(0, end).join('\n');
}

/** Extract a ### subsection from markdown content */
export function extractSubSection(content: string, heading: string): string {
  const regex = new RegExp(`^### ${escapeRegex(heading)}`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^##[#]? /)) { end = i; break; }
  }
  return lines.slice(0, end).join('\n');
}

/** Parse a markdown table into array of row objects */
export function parseMarkdownTable(section: string): Record<string, string>[] {
  const lines = section.split('\n').filter(l => l.includes('|'));
  if (lines.length < 2) return [];

  // First line with pipes = header
  const headerLine = lines[0];
  const headers = headerLine.split('|').map(c => c.trim()).filter(Boolean);

  // Skip separator line (contains dashes)
  const dataLines = lines.slice(1).filter(l => !l.match(/^\|[\s-:|]+\|$/));

  return dataLines.map(line => {
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cells[i] || ''; });
    return row;
  });
}

/** Parse a markdown table into simple cell arrays */
export function parseTableRows(section: string): { headers: string[]; rows: string[][] } {
  const lines = section.split('\n').filter(l => l.includes('|'));
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split('|').map(c => c.trim()).filter(Boolean);
  const dataLines = lines.slice(1).filter(l => !l.match(/^\|[\s-:|]+\|$/));
  const rows = dataLines.map(line => line.split('|').map(c => c.trim()).filter(Boolean));

  return { headers, rows };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
