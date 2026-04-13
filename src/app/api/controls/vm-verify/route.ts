import { NextRequest, NextResponse } from 'next/server';
import { getRepoFileSha, writeRepoFile } from '@/lib/github-write';

// Detect the V-M column index from the header row of a PRD_CHECKLIST.md
function findVmColIndex(lines: string[]): number {
  for (const line of lines) {
    if (!line.startsWith('|') || !line.includes('|')) continue;
    const cells = line.split('|').map(c => c.trim());
    const idx = cells.findIndex(c => c === 'V-M');
    if (idx >= 0) return idx;
    // Legacy single-verify schema: look for 'Verified' (not 'Verified By')
    const vIdx = cells.findIndex(c => c === 'Verified');
    if (vIdx >= 0) return vIdx;
  }
  return -1;
}

export async function POST(request: NextRequest) {
  const authCookie = request.cookies.get('bigclaw-auth');
  if (authCookie?.value !== 'authenticated') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json() as { repoSlug?: string; prdId?: string; result?: string };
  const { repoSlug, prdId, result } = body;

  if (!repoSlug || !prdId || !result) {
    return NextResponse.json({ error: 'Missing repoSlug, prdId, or result' }, { status: 400 });
  }
  if (result !== '✅' && result !== '❌' && result !== '') {
    return NextResponse.json({ error: 'result must be ✅, ❌, or ""' }, { status: 400 });
  }

  const file = await getRepoFileSha(repoSlug, 'docs/product/PRD_CHECKLIST.md');
  if (!file) {
    return NextResponse.json({ error: 'Could not read PRD_CHECKLIST.md' }, { status: 500 });
  }

  const lines = file.content.split('\n');
  const vmColIdx = findVmColIndex(lines);
  if (vmColIdx < 0) {
    return NextResponse.json({ error: 'Could not find V-M column in PRD_CHECKLIST.md' }, { status: 500 });
  }

  let changed = false;
  const updatedLines = lines.map(line => {
    if (!line.startsWith('|')) return line;
    const parts = line.split('|');
    // parts[0] = '' (before leading |), parts[1] = ID cell, ...
    const idCell = parts[1]?.trim();
    if (idCell !== prdId) return line;
    if (parts.length <= vmColIdx) return line;
    const current = parts[vmColIdx].trim();
    const newVal = result === '' ? ' — ' : ` ${result} `;
    if (current === newVal.trim()) return line; // no change needed
    parts[vmColIdx] = newVal;
    changed = true;
    return parts.join('|');
  });

  if (!changed) {
    return NextResponse.json({ error: `PRD ${prdId} not found or V-M already set to ${result}` }, { status: 404 });
  }

  const date = new Date().toISOString().slice(0, 10);
  const ok = await writeRepoFile(
    repoSlug,
    'docs/product/PRD_CHECKLIST.md',
    updatedLines.join('\n'),
    file.sha,
    `V-M ${result || 'cleared'} — ${prdId} — Michael ${date}`,
  );

  if (!ok) {
    return NextResponse.json({ error: 'Failed to write to GitHub' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
