import { NextResponse } from 'next/server';
import { fetchRepoFile } from '@/lib/github';

export const dynamic = 'force-dynamic';

export interface PendingGate {
  product: string;
  date: string;
  summary: string;
  previewUrl: string;
  testStatus: string;
}

export function parsePendingGates(todoMd: string): PendingGate[] {
  // Split on production gate headings
  const parts = todoMd.split(/(?=^## 🔒 PRODUCTION GATE)/m);
  const gates: PendingGate[] = [];

  for (const part of parts) {
    if (!part.startsWith('## 🔒 PRODUCTION GATE')) continue;
    // Skip gates already approved or rejected
    if (/✅ APPROVED|❌ REJECTED/i.test(part)) continue;

    const lines = part.split('\n');
    const header = lines[0];
    const productMatch = header.match(/PRODUCTION GATE — (.+?) — (\d{4}-\d{2}-\d{2})/);
    if (!productMatch) continue;

    const product = productMatch[1].trim();
    const date = productMatch[2];

    // Find preview URL
    const previewMatch = part.match(/https?:\/\/[^\s)]+(?:vercel\.app|preview)[^\s))]*/);
    const previewUrl = previewMatch?.[0]?.replace(/[)>]$/, '') || '';

    // Find test status (e.g. "633/633 passing")
    const testMatch = part.match(/(\d+)\/(\d+)\s+(?:tests?\s+)?passing/i);
    const testStatus = testMatch ? `${testMatch[1]}/${testMatch[2]} tests passing` : '';

    // Summary: first non-empty, non-heading paragraph after header
    const summaryLine = lines.slice(1).find(
      l => l.trim() && !l.startsWith('#') && !l.startsWith('**Michael:') && !l.startsWith('---')
    );
    const summary = summaryLine?.replace(/\*\*/g, '').trim() || '';

    gates.push({ product, date, summary, previewUrl, testStatus });
  }

  return gates;
}

export async function GET() {
  const todoMd = await fetchRepoFile('bigclaw-ai', 'founder/FOUNDER_TODO.md');
  if (!todoMd) return NextResponse.json({ gates: [] });
  return NextResponse.json({ gates: parsePendingGates(todoMd) });
}
