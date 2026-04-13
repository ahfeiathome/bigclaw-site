'use client';

import { useState } from 'react';
import type { MoneyItem } from '@/app/api/controls/todo/route';

interface Props {
  initialItems: MoneyItem[];
}

function typeIcon(type: string): string {
  if (type.includes('💳')) return '💳';
  if (type.includes('⚖️')) return '⚖️';
  if (type.includes('🧠')) return '🧠';
  return '📋';
}

function typeBg(type: string): string {
  if (type.includes('💳')) return 'bg-blue-500/10 text-blue-400';
  if (type.includes('⚖️')) return 'bg-purple-500/10 text-purple-400';
  if (type.includes('🧠')) return 'bg-amber-500/10 text-amber-400';
  return 'bg-muted text-muted-foreground';
}

export function MoneyActionChecklist({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const pending = items.filter(i => !i.done);
  const done = items.filter(i => i.done);

  async function handleComplete(num: string) {
    setCompleting(prev => new Set(prev).add(num));
    setErrors(prev => { const n = { ...prev }; delete n[num]; return n; });

    try {
      const res = await fetch('/api/controls/complete-gate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: num }),
      });
      if (res.ok) {
        setItems(prev => prev.map(i => i.num === num ? { ...i, done: true } : i));
      } else {
        const data = await res.json() as { error?: string };
        setErrors(prev => ({ ...prev, [num]: data.error || 'Failed' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, [num]: 'Network error' }));
    } finally {
      setCompleting(prev => { const n = new Set(prev); n.delete(num); return n; });
    }
  }

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No action items found.</p>;
  }

  return (
    <div className="space-y-2">
      {pending.map(item => (
        <div key={item.num} className="flex items-start gap-3 rounded-lg border border-border bg-card p-3">
          <button
            onClick={() => handleComplete(item.num)}
            disabled={completing.has(item.num)}
            className="mt-0.5 w-5 h-5 rounded border-2 border-muted-foreground/40 flex-shrink-0 hover:border-primary/60 transition-colors cursor-pointer disabled:opacity-50 bg-transparent"
            aria-label={`Mark item ${item.num} done`}
          >
            {completing.has(item.num) && (
              <span className="block w-full h-full text-[8px] text-center leading-none text-muted-foreground">…</span>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-base leading-none">{typeIcon(item.type)}</span>
              <span className="text-sm font-medium text-foreground">{item.item}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${typeBg(item.type)}`}>{item.type}</span>
              {item.ageDays !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${item.ageDays >= 7 ? 'bg-red-500/15 text-red-400' : item.ageDays >= 3 ? 'bg-amber-500/15 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                  {item.ageDays}d
                </span>
              )}
            </div>
            {item.unblocks && (
              <p className="text-xs text-muted-foreground ml-6">Unblocks: {item.unblocks}</p>
            )}
            {errors[item.num] && (
              <p className="text-xs text-red-400 ml-6">{errors[item.num]}</p>
            )}
          </div>
        </div>
      ))}

      {done.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            {done.length} completed item{done.length !== 1 ? 's' : ''}
          </summary>
          <div className="space-y-1 mt-2">
            {done.map(item => (
              <div key={item.num} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/40 bg-muted/30 opacity-60">
                <span className="w-5 h-5 rounded border-2 border-green-500/60 bg-green-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] text-green-400">✓</span>
                </span>
                <span className="text-xs line-through text-muted-foreground">{item.item}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
