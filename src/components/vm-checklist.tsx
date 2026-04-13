'use client';

import { useState } from 'react';
import type { VerifyValue } from '@/components/prd-checklist';

export interface VmItem {
  id: string;
  item: string;
  verifyG?: VerifyValue;
  verifyC?: VerifyValue;
  verifyM?: VerifyValue;
}

interface Props {
  repoSlug: string;
  items: VmItem[];
}

export function VmChecklist({ repoSlug, items }: Props) {
  const [states, setStates] = useState<Record<string, VerifyValue | ''>>(() => {
    const init: Record<string, VerifyValue | ''> = {};
    for (const i of items) init[i.id] = i.verifyM ?? '';
    return init;
  });
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleToggle(id: string) {
    const current = states[id];
    const next: VerifyValue | '' = current === '✅' ? '' : current === '❌' ? '' : '✅';
    setSaving(prev => new Set(prev).add(id));
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    try {
      const res = await fetch('/api/controls/vm-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoSlug, prdId: id, result: next }),
      });
      if (res.ok) {
        setStates(prev => ({ ...prev, [id]: next }));
      } else {
        const data = await res.json() as { error?: string };
        setErrors(prev => ({ ...prev, [id]: data.error || 'Save failed' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, [id]: 'Network error' }));
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  async function handleFail(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const next: VerifyValue = '❌';
    setSaving(prev => new Set(prev).add(id));
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    try {
      const res = await fetch('/api/controls/vm-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoSlug, prdId: id, result: next }),
      });
      if (res.ok) {
        setStates(prev => ({ ...prev, [id]: next }));
      } else {
        const data = await res.json() as { error?: string };
        setErrors(prev => ({ ...prev, [id]: data.error || 'Save failed' }));
      }
    } catch {
      setErrors(prev => ({ ...prev, [id]: 'Network error' }));
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(id); return n; });
    }
  }

  if (items.length === 0) {
    return <p className="text-xs text-muted-foreground px-3 py-2">No items to verify in this release.</p>;
  }

  const done = Object.values(states).filter(v => v === '✅').length;

  return (
    <div className="px-3 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-mono uppercase tracking-wide text-foreground font-semibold">
          Your Test Checklist ({items.length} items)
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">
          {done}/{items.length} verified
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {items.map(item => {
          const vmVal = states[item.id];
          const isSaving = saving.has(item.id);
          const isCatC = item.verifyG === 'N/A';
          const isDone = vmVal === '✅';
          const isFailed = vmVal === '❌';

          return (
            <div
              key={item.id}
              className={`flex items-start gap-2.5 rounded-lg px-2.5 py-2 border transition-colors ${
                isDone ? 'border-green-500/30 bg-green-500/5' :
                isFailed ? 'border-red-500/30 bg-red-500/5' :
                'border-border/50 bg-card/30 hover:bg-muted/30'
              }`}
            >
              {/* Checkbox — tap to toggle ✅ */}
              <button
                onClick={() => handleToggle(item.id)}
                disabled={isSaving}
                aria-label={`${isDone ? 'Unmark' : 'Mark'} ${item.id} verified`}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 ${
                  isDone ? 'border-green-500 bg-green-500/20' :
                  isFailed ? 'border-red-500 bg-red-500/20' :
                  'border-muted-foreground/40 bg-transparent hover:border-green-500/60'
                }`}
              >
                {isSaving
                  ? <span className="text-[8px] text-muted-foreground">…</span>
                  : isDone ? <span className="text-[10px] text-green-400">✓</span>
                  : isFailed ? <span className="text-[10px] text-red-400">✕</span>
                  : null
                }
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-muted-foreground shrink-0">{item.id}</span>
                  {isCatC && (
                    <span className="text-[8px] px-1 py-0.5 rounded bg-purple-500/15 text-purple-400 font-mono">Cat C</span>
                  )}
                  <span className={`text-xs ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {item.item}
                  </span>
                </div>
                {errors[item.id] && (
                  <p className="text-[10px] text-red-400 mt-0.5">{errors[item.id]}</p>
                )}
              </div>

              {/* ❌ fail button (only when not already marked) */}
              {!isDone && !isFailed && !isSaving && (
                <button
                  onClick={(e) => handleFail(item.id, e)}
                  aria-label={`Mark ${item.id} failed`}
                  className="shrink-0 text-[9px] px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground hover:border-red-500/40 hover:text-red-400 transition-colors cursor-pointer mt-0.5"
                >
                  ❌
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
