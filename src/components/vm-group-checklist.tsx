'use client';

import { useState } from 'react';
import type { VerifyValue } from '@/components/prd-checklist';
import type { VmItem } from '@/components/vm-checklist';

export interface VmGroup {
  area: string;
  ids: string[];
  whatToTest: string;
}

interface Props {
  repoSlug: string;
  groups: VmGroup[];
  allItems: VmItem[];
}

export function VmGroupChecklist({ repoSlug, groups, allItems }: Props) {
  const [states, setStates] = useState<Record<string, VerifyValue | ''>>(() => {
    const init: Record<string, VerifyValue | ''> = {};
    for (const item of allItems) init[item.id] = item.verifyM ?? '';
    return init;
  });
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function patchItem(id: string, result: VerifyValue | '') {
    setSaving(prev => new Set(prev).add(id));
    setErrors(prev => { const n = { ...prev }; delete n[id]; return n; });
    try {
      const res = await fetch('/api/controls/vm-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoSlug, prdId: id, result }),
      });
      if (res.ok) {
        setStates(prev => ({ ...prev, [id]: result }));
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

  async function handleGroupToggle(group: VmGroup) {
    const activeIds = group.ids.filter(id => id in states);
    const allDone = activeIds.length > 0 && activeIds.every(id => states[id] === '✅');
    const next: VerifyValue | '' = allDone ? '' : '✅';
    await Promise.all(activeIds.map(id => patchItem(id, next)));
  }

  async function handleGroupFail(group: VmGroup, e: React.MouseEvent) {
    e.stopPropagation();
    const activeIds = group.ids.filter(id => id in states);
    await Promise.all(activeIds.map(id => patchItem(id, '❌')));
  }

  // Only show groups that have at least one known item
  const activeGroups = groups.filter(g => g.ids.some(id => id in states));
  if (activeGroups.length === 0) return null;

  const doneCount = activeGroups.filter(g => {
    const activeIds = g.ids.filter(id => id in states);
    return activeIds.length > 0 && activeIds.every(id => states[id] === '✅');
  }).length;

  return (
    <div className="px-3 py-3 border-b border-border/40">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-mono uppercase tracking-wide text-foreground font-semibold">
          Your Phone Review
        </div>
        <div className="text-[10px] text-muted-foreground font-mono">
          {doneCount}/{activeGroups.length} areas signed off
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border bg-muted/50">
              <th className="text-left py-1.5 pl-2 pr-1 w-5" />
              <th className="text-left py-1.5 px-2 whitespace-nowrap">Test Area</th>
              <th className="text-left py-1.5 px-2 whitespace-nowrap">PRD Items</th>
              <th className="text-left py-1.5 px-2">What to Test</th>
              <th className="text-left py-1.5 pl-1 pr-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {activeGroups.map(group => {
              const activeIds = group.ids.filter(id => id in states);
              const isSavingGroup = activeIds.some(id => saving.has(id));
              const allDone = activeIds.length > 0 && activeIds.every(id => states[id] === '✅');
              const anyDone = activeIds.some(id => states[id] === '✅');
              const anyFailed = activeIds.some(id => states[id] === '❌');
              const rowErrors = activeIds.filter(id => errors[id]).map(id => errors[id]);

              return (
                <tr
                  key={group.area}
                  className={`border-b border-border/30 ${
                    allDone ? 'bg-green-500/5' :
                    anyFailed ? 'bg-red-500/5' :
                    ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-2 pl-2 pr-1">
                    <button
                      onClick={() => handleGroupToggle(group)}
                      disabled={isSavingGroup}
                      aria-label={`${allDone ? 'Unmark' : 'Mark'} ${group.area} done`}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 ${
                        allDone  ? 'border-green-500 bg-green-500/20' :
                        anyFailed ? 'border-red-500 bg-red-500/20' :
                        anyDone  ? 'border-amber-500 bg-amber-500/10' :
                        'border-muted-foreground/40 bg-transparent hover:border-green-500/60'
                      }`}
                    >
                      {isSavingGroup
                        ? <span className="text-[8px] text-muted-foreground">…</span>
                        : allDone   ? <span className="text-[10px] text-green-400">✓</span>
                        : anyFailed ? <span className="text-[10px] text-red-400">✕</span>
                        : anyDone   ? <span className="text-[8px] text-amber-400 font-bold">~</span>
                        : null
                      }
                    </button>
                  </td>

                  {/* Area name */}
                  <td className={`py-2 px-2 font-medium whitespace-nowrap ${allDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                    {group.area}
                  </td>

                  {/* PRD ID badges */}
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap gap-1">
                      {group.ids.map(id => {
                        const st = states[id];
                        const cls = st === '✅' ? 'bg-green-500/15 text-green-400' :
                                    st === '❌' ? 'bg-red-500/15 text-red-400' :
                                    'bg-muted text-muted-foreground/70';
                        return (
                          <span key={id} className={`text-[9px] font-mono px-1 py-0.5 rounded ${cls}`}>
                            {id}
                          </span>
                        );
                      })}
                    </div>
                  </td>

                  {/* What to test */}
                  <td className="py-2 px-2 text-muted-foreground text-[11px] leading-relaxed">
                    {group.whatToTest}
                    {rowErrors.length > 0 && (
                      <div className="text-[9px] text-red-400 mt-0.5">{rowErrors.join(' · ')}</div>
                    )}
                  </td>

                  {/* ❌ fail button */}
                  <td className="py-2 pl-1 pr-2">
                    {!allDone && !isSavingGroup && (
                      <button
                        onClick={e => handleGroupFail(group, e)}
                        aria-label={`Mark ${group.area} failed`}
                        className="text-[9px] px-1.5 py-0.5 rounded border border-border/50 text-muted-foreground hover:border-red-500/40 hover:text-red-400 transition-colors cursor-pointer"
                      >
                        ❌
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
