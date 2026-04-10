import { NextRequest, NextResponse } from 'next/server';
import { getRepoFileSha, writeRepoFile } from '@/lib/github-write';

export async function POST(request: NextRequest) {
  const authCookie = request.cookies.get('bigclaw-auth');
  if (authCookie?.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
  // Row formats:
  //   4-col: | # | Item | Type | Status |
  //   5-col: | # | Item | Type | Time | Unblocks |  (status not present, skip)
  // Status is always col index 3 (0-based after splitting on |)
  const lines = file.content.split('\n');
  let changed = false;

  const updatedLines = lines.map(line => {
    if (!line.startsWith('|')) return line;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols[0] !== item_id) return line;
    // Found the row — update the Status column (index 3, i.e. 4th | segment)
    const parts = line.split('|');
    // parts[0] is empty (before first |), parts[1]=num, parts[2]=item, parts[3]=type, parts[4]=status
    const statusIdx = 4; // 1-indexed pipe split: | num | item | type | STATUS |
    if (parts.length > statusIdx) {
      const current = parts[statusIdx].trim();
      if (/✅\s*done/i.test(current)) return line; // already done
      parts[statusIdx] = ' ✅ DONE ';
      changed = true;
      return parts.join('|');
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
