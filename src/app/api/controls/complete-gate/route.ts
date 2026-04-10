import { NextRequest, NextResponse } from 'next/server';
import { getRepoFileSha, writeRepoFile } from '@/lib/github-write';

export async function POST(request: NextRequest) {
  const body = await request.json() as { item_id?: string };
  const { item_id } = body;

  if (!item_id) {
    return NextResponse.json({ error: 'Missing item_id' }, { status: 400 });
  }

  const file = await getRepoFileSha('bigclaw-ai', 'founder/FOUNDER_TODO.md');
  if (!file) {
    return NextResponse.json({ error: 'Could not read FOUNDER_TODO.md' }, { status: 500 });
  }

  // Find the table row with this item number and mark as done
  // Row format: | 8 | Item name | ⚖️ | Pending | ... |
  // We want to replace "Pending" (or any status col) with "✅ DONE"
  const lines = file.content.split('\n');
  let changed = false;

  const updatedLines = lines.map(line => {
    if (!line.startsWith('|')) return line;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols[0] !== item_id) return line;
    // Found the row — replace the last column if it's Pending/status
    // Replace "Pending" or bare status with "✅ DONE"
    const newLine = line.replace(/\|\s*Pending\s*\|/, '| ✅ DONE |')
                        .replace(/\|\s*pending\s*\|/i, '| ✅ DONE |');
    if (newLine !== line) {
      changed = true;
      return newLine;
    }
    // Try replacing last non-empty col that isn't already done
    const parts = line.split('|');
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i].trim() && !parts[i].includes('✅') && !parts[i].includes('#') && !parts[i].includes('Item')) {
        parts[i] = ' ✅ DONE ';
        changed = true;
        return parts.join('|');
      }
    }
    return line;
  });

  if (!changed) {
    return NextResponse.json({ error: `Item ${item_id} not found or already done` }, { status: 404 });
  }

  const date = new Date().toISOString().slice(0, 10);
  const ok = await writeRepoFile(
    'bigclaw-ai',
    'founder/FOUNDER_TODO.md',
    updatedLines.join('\n'),
    file.sha,
    `✅ Mark item #${item_id} done — Michael ${date}`,
  );

  if (!ok) {
    return NextResponse.json({ error: 'Failed to write to GitHub' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
