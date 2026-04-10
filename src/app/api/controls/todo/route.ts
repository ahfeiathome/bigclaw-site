import { NextResponse } from 'next/server';
import { fetchRepoFile } from '@/lib/github';

export const dynamic = 'force-dynamic';

export interface MoneyItem {
  num: string;
  item: string;
  type: string;
  unblocks: string;
  done: boolean;
}

export function parseMoneyItems(todoMd: string): MoneyItem[] {
  const items: MoneyItem[] = [];
  for (const line of todoMd.split('\n')) {
    if (!line.startsWith('|')) continue;
    if (line.match(/^\|[\s-:|]+\|$/)) continue;
    if (line.includes('| # |') || line.includes('| Item')) continue;

    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 3 || !cols[0].match(/^\d+$/)) continue;

    const type = cols[2] || '';
    if (!type.includes('💳') && !type.includes('⚖️') && !type.includes('🧠')) continue;

    // Check done status — last col or status col
    const lastCol = cols[cols.length - 1] || '';
    const done = /✅\s*done/i.test(lastCol) || /✅\s*done/i.test(line);

    items.push({
      num: cols[0],
      item: cols[1].replace(/\*\*/g, '').trim(),
      type,
      unblocks: cols[4] || cols[3] || '',
      done,
    });
  }
  return items;
}

export async function GET() {
  const todoMd = await fetchRepoFile('bigclaw-ai', 'founder/FOUNDER_TODO.md');
  if (!todoMd) return NextResponse.json({ items: [] });
  return NextResponse.json({ items: parseMoneyItems(todoMd) });
}
