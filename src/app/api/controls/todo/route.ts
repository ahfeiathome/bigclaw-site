import { NextResponse } from 'next/server';
import { fetchRepoFile } from '@/lib/github';

export const dynamic = 'force-dynamic';

// Emoji type codes used in section headings
const MONEY_EMOJIS = ['💳', '⚖️', '🧠'];

// Section headings to skip even if they start with a money emoji
const SKIP_PATTERNS = [
  /STANDING RULE/i,
  /^## 🔒/,           // production gates — parsed separately
  /^## ✅ RESOLVED/,
  /^## ⛔ SUPERSEDED/,
  /^## 🔑 API Keys/,
  /^## 📈 Investment/,
  /^## Priority Timeline/i,
  /^## Impact Matrix/i,
  /^## Dependency Chains/i,
];

export interface MoneyItem {
  num: string;
  item: string;
  type: string;       // '💳' | '⚖️' | '🧠'
  unblocks: string;
  done: boolean;
  date?: string;      // YYYY-MM-DD from heading
  ageDays?: number;   // days since date
}

/**
 * Parse action items from FOUNDER_TODO.md section headings.
 *
 * Format: ## [emoji] [TYPE] — [description] — [YYYY-MM-DD]
 * Example: ## 💳 CRITICAL — Anthropic API Balance Exhausted — 2026-04-12
 */
export function parseMoneyItems(todoMd: string): MoneyItem[] {
  const items: MoneyItem[] = [];
  const today = new Date();

  // Split on level-2 headings
  const sections = todoMd.split(/(?=^## )/m);

  let counter = 1;
  for (const section of sections) {
    const firstLine = section.split('\n')[0] || '';

    // Must start with ## and contain a money emoji
    if (!firstLine.startsWith('## ')) continue;
    const hasEmoji = MONEY_EMOJIS.some(e => firstLine.includes(e));
    if (!hasEmoji) continue;

    // Skip standing rules, gates handled elsewhere, resolved items, etc.
    if (SKIP_PATTERNS.some(p => p.test(firstLine))) continue;

    // Determine type emoji
    const type = MONEY_EMOJIS.find(e => firstLine.includes(e)) || '💳';

    // Extract description and date from heading
    // Format: ## 💳 TYPE — description — YYYY-MM-DD
    // or:     ## 💳 TYPE — description — YYYY-MM-DD (extra text)
    const dateMatch = firstLine.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch?.[1] || '';

    // Strip emoji+type prefix and date suffix to get clean description
    let desc = firstLine.replace(/^## /, '').trim();
    // Remove leading emoji
    desc = desc.replace(/^[💳⚖️🧠]\s*/, '').trim();
    // Remove date and everything after from end
    if (date) desc = desc.slice(0, desc.lastIndexOf(date)).replace(/\s*—\s*$/, '').trim();
    // Remove TYPE word (CRITICAL, APPROVE, etc.) if it's the first word before first —
    const dashIdx = desc.indexOf(' — ');
    if (dashIdx > 0) {
      const prefix = desc.slice(0, dashIdx);
      if (/^[A-Z\s]+$/.test(prefix)) desc = desc.slice(dashIdx + 3).trim();
    }

    // Age in days
    let ageDays: number | undefined;
    if (date) {
      const msPerDay = 1000 * 60 * 60 * 24;
      ageDays = Math.floor((today.getTime() - new Date(date).getTime()) / msPerDay);
    }

    // First non-empty, non-heading line as summary for unblocks field
    const bodyLines = section.split('\n').slice(1);
    const summary = bodyLines.find(
      l => l.trim() && !l.startsWith('#') && !l.startsWith('---')
    )?.replace(/\*\*/g, '').trim() || '';

    items.push({
      num: String(counter++),
      item: desc,
      type,
      unblocks: summary.slice(0, 100),
      done: false,
      date,
      ageDays,
    });
  }

  return items;
}

export async function GET() {
  const todoMd = await fetchRepoFile('bigclaw-ai', 'founder/FOUNDER_TODO.md');
  if (!todoMd) return NextResponse.json({ items: [] });
  return NextResponse.json({ items: parseMoneyItems(todoMd) });
}
