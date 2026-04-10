import { NextRequest, NextResponse } from 'next/server';
import { getRepoFileSha, writeRepoFile } from '@/lib/github-write';

export async function POST(request: NextRequest) {
  const body = await request.json() as { product?: string; action?: 'approve' | 'reject'; reason?: string };
  const { product, action, reason } = body;

  if (!product || !action) {
    return NextResponse.json({ error: 'Missing product or action' }, { status: 400 });
  }

  const file = await getRepoFileSha('bigclaw-ai', 'founder/FOUNDER_TODO.md');
  if (!file) {
    return NextResponse.json({ error: 'Could not read FOUNDER_TODO.md' }, { status: 500 });
  }

  // Find the production gate section for this product
  const gateHeading = `## 🔒 PRODUCTION GATE — ${product}`;
  const gateIdx = file.content.indexOf(gateHeading);
  if (gateIdx === -1) {
    return NextResponse.json({ error: `No gate found for product: ${product}` }, { status: 404 });
  }

  // Check if already decided
  const gateEnd = file.content.indexOf('\n---\n', gateIdx + gateHeading.length);
  const gateSection = gateEnd > -1 ? file.content.slice(gateIdx, gateEnd) : file.content.slice(gateIdx);
  if (/✅ APPROVED|❌ REJECTED/i.test(gateSection)) {
    return NextResponse.json({ error: 'Gate already has a decision' }, { status: 409 });
  }

  // Build approval text
  const date = new Date().toISOString().slice(0, 10);
  const decisionText = action === 'approve'
    ? `✅ APPROVED — Michael ${date}`
    : `❌ REJECTED — ${reason || 'No reason provided'} — Michael ${date}`;

  // Find the "Write APPROVED or REJECTED below:" marker and append after it
  const markerPattern = /\*\*Michael:.*write APPROVED or REJECTED below.*\*\*/i;
  const markerMatch = gateSection.match(markerPattern);

  let updatedContent: string;
  if (markerMatch) {
    // Insert after the marker line
    const markerEnd = gateIdx + (gateSection.indexOf(markerMatch[0]) + markerMatch[0].length);
    updatedContent = file.content.slice(0, markerEnd) + '\n' + decisionText + file.content.slice(markerEnd);
  } else {
    // Append before the closing ---
    if (gateEnd > -1) {
      updatedContent = file.content.slice(0, gateEnd) + '\n' + decisionText + '\n' + file.content.slice(gateEnd);
    } else {
      updatedContent = file.content + '\n' + decisionText + '\n';
    }
  }

  const ok = await writeRepoFile(
    'bigclaw-ai',
    'founder/FOUNDER_TODO.md',
    updatedContent,
    file.sha,
    `${action === 'approve' ? '✅' : '❌'} ${action} ${product} production gate — Michael ${date}`,
  );

  if (!ok) {
    return NextResponse.json({ error: 'Failed to write to GitHub' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, decision: decisionText });
}
