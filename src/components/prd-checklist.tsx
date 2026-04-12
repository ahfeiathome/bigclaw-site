'use client';

import { useState, useMemo } from 'react';
import { StatusDot } from './dashboard';

// ── Types ──────────────────────────────────────────────────────────────────

export type VerifyValue = '✅' | '❌' | 'N/A';

export interface PrdItem {
  id: string;
  item: string;
  category: string;
  priority: string;
  status: 'Done' | 'In Progress' | 'Not Started' | 'Deferred';
  owner: string;
  github?: string;
  // Verification columns: V-G (Gemini), V-C (Consultant), V-M (Michael)
  verifyG?: VerifyValue;
  verifyC?: VerifyValue;
  verifyM?: VerifyValue;
  // Legacy single-column support
  verified?: boolean;
}

interface Props {
  items: PrdItem[];
  repoSlug?: string;
}

function statusColor(status: string): string {
  if (status === 'Done') return 'bg-green-500/20 text-green-400';
  if (status === 'In Progress') return 'bg-amber-500/20 text-amber-400';
  if (status === 'Deferred') return 'bg-blue-500/20 text-blue-400';
  return 'bg-muted text-muted-foreground';
}

function statusDot(status: string): 'good' | 'warn' | 'neutral' {
  if (status === 'Done') return 'good';
  if (status === 'In Progress') return 'warn';
  return 'neutral';
}

// ── Component ──────────────────────────────────────────────────────────────

export function PrdChecklist({ items, repoSlug }: Props) {
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<'id' | 'category' | 'priority' | 'status'>('id');
  const [sortAsc, setSortAsc] = useState(true);

  // Detect whether using 3-column V-G/V-C/V-M schema
  const hasTripleVerify = items.some(i => i.verifyG !== undefined);

  // Category summary
  const categories = useMemo(() => {
    const map = new Map<string, { done: number; vG: number; vC: number; vM: number; total: number }>();
    for (const item of items) {
      const cat = item.category;
      if (!map.has(cat)) map.set(cat, { done: 0, vG: 0, vC: 0, vM: 0, total: 0 });
      const entry = map.get(cat)!;
      entry.total++;
      if (item.status === 'Done') entry.done++;
      if (item.verifyG === '✅') entry.vG++;
      if (item.verifyC === '✅') entry.vC++;
      if (item.verifyM === '✅') entry.vM++;
    }
    return Array.from(map.entries()).sort((a, b) => {
      // Sort by active verified count (lowest layer with data; 0 if triple-verify but no data yet)
      const hasTV = items.some(i => i.verifyG !== undefined);
      const activeA = hasTV ? (a[1].vM > 0 ? a[1].vM : a[1].vC > 0 ? a[1].vC : a[1].vG > 0 ? a[1].vG : 0) : a[1].done;
      const activeB = hasTV ? (b[1].vM > 0 ? b[1].vM : b[1].vC > 0 ? b[1].vC : b[1].vG > 0 ? b[1].vG : 0) : b[1].done;
      const pctA = a[1].total > 0 ? activeA / a[1].total : 0;
      const pctB = b[1].total > 0 ? activeB / b[1].total : 0;
      return pctB - pctA;
    });
  }, [items]);

  // Overall counts
  const counts = useMemo(() => {
    const c = { done: 0, vG: 0, vC: 0, vM: 0, inProgress: 0, notStarted: 0, deferred: 0 };
    for (const item of items) {
      if (item.status === 'Done') c.done++;
      else if (item.status === 'In Progress') c.inProgress++;
      else if (item.status === 'Deferred') c.deferred++;
      else c.notStarted++;
      if (item.verifyG === '✅') c.vG++;
      if (item.verifyC === '✅') c.vC++;
      if (item.verifyM === '✅') c.vM++;
    }
    return c;
  }, [items]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...items];
    if (filterCategory) result = result.filter(i => i.category === filterCategory);
    if (filterPriority) result = result.filter(i => i.priority === filterPriority);
    if (filterStatus) result = result.filter(i => i.status === filterStatus);
    result.sort((a, b) => {
      const va = a[sortKey] || '';
      const vb = b[sortKey] || '';
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return result;
  }, [items, filterCategory, filterPriority, filterStatus, sortKey, sortAsc]);

  function handleSort(key: typeof sortKey) {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  }

  const priorities = [...new Set(items.map(i => i.priority))].sort();
  const statuses = ['Done', 'In Progress', 'Not Started', 'Deferred'];

  return (
    <div>
      {/* ── Per-category count table (header) + bars (visualization) — one unified section ── */}
      <div className="mb-6">
        {/* Count table */}
        <div className="overflow-x-auto mb-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2 pl-3 pr-2">Category</th>
                <th className="text-right py-2 px-2">Done</th>
                {hasTripleVerify ? (
                  <>
                    <th className="text-right py-2 px-2 text-[10px]" title="Gemini automated">V-G</th>
                    <th className="text-right py-2 px-2 text-[10px]" title="Consultant audit">V-C</th>
                    <th className="text-right py-2 pl-2 pr-3 text-[10px]" title="Michael review">V-M</th>
                  </>
                ) : (
                  <th className="text-right py-2 pl-2 pr-3">Verified</th>
                )}
              </tr>
            </thead>
            <tbody>
              {categories.map(([cat, { done, vG, vC, vM, total }], i) => (
                <tr key={cat} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
                  <td className="py-1.5 pl-3 pr-2 text-foreground">{cat}</td>
                  <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{done}/{total}</td>
                  {hasTripleVerify ? (
                    <>
                      <td className="py-1.5 px-2 text-right font-mono text-purple-400">{vG}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-blue-400">{vC}</td>
                      <td className="py-1.5 pl-2 pr-3 text-right font-mono text-green-400">{vM}</td>
                    </>
                  ) : (
                    <td className="py-1.5 pl-2 pr-3 text-right font-mono text-green-400">{done}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bars — directly below, no gap */}
        <div className="space-y-2 mt-3 border-t border-border/30 pt-3">
        {categories.map(([cat, { done, vG, vC, vM, total }]) => {
          // Lowest verified layer with data.
          // When hasTripleVerify and all layers are 0 → show 0% (no fallback to Done).
          // When no triple-verify schema → Done is the source of truth.
          const verified = hasTripleVerify
            ? (vM > 0 ? vM : vC > 0 ? vC : vG > 0 ? vG : 0)
            : done;
          const verifyLayer = !hasTripleVerify ? 'Done' : vM > 0 ? 'V-M' : vC > 0 ? 'V-C' : vG > 0 ? 'V-G' : 'V-M';
          const pct = total > 0 ? Math.round((verified / total) * 100) : 0;
          const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
          const isActive = filterCategory === cat;
          const barColor = pct < 50 ? 'bg-red-500' : pct <= 70 ? 'bg-blue-500' : 'bg-green-500';
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(isActive ? null : cat)}
              className={`w-full flex items-center gap-3 text-left rounded-lg p-2 transition-all ${isActive ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted'}`}
            >
              <span className="text-xs text-foreground w-28 shrink-0 font-medium">{cat}</span>
              {/* Bar track with ghost Done bar + active verified bar */}
              <div className="flex-1 h-2.5 rounded-full relative bg-muted overflow-hidden">
                {/* Ghost bar: Done % as faint white outline */}
                {donePct > pct && (
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${donePct}%`, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }}
                  />
                )}
                {/* Main bar: verified % */}
                <div className={`absolute inset-y-0 left-0 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground text-right shrink-0">
                {verified}/{total} {verifyLayer} ({pct}%) · Done: {done}/{total}
              </span>
            </button>
          );
        })}
        </div>{/* end bars */}
      </div>{/* end unified section */}

      {/* ── Counters ───────────────────────────────────────────── */}
      {(() => {
        const activeVerified = hasTripleVerify
          ? (counts.vM > 0 ? counts.vM : counts.vC > 0 ? counts.vC : counts.vG > 0 ? counts.vG : 0)
          : counts.done;
        const activeLayer = !hasTripleVerify ? 'Done' : counts.vM > 0 ? 'V-M' : counts.vC > 0 ? 'V-C' : counts.vG > 0 ? 'V-G' : 'V-M';
        const verifiedPct = items.length > 0 ? Math.round((activeVerified / items.length) * 100) : 0;
        return (
          <div className="flex gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
            <span className="font-mono">{activeVerified}/{items.length} {activeLayer} Verified ({verifiedPct}%)</span>
            <span>·</span>
            <span className="font-mono">{counts.done} Done</span>
            {hasTripleVerify && counts.vM === 0 && (counts.vC > 0 || counts.vG > 0) && <>
              <span>·</span>
              <span className="font-mono text-[10px]">G:{counts.vG} C:{counts.vC} M:{counts.vM}</span>
            </>}
            <span>·</span>
            <span>{counts.inProgress} in progress</span>
            <span>·</span>
            <span>{counts.notStarted} not started</span>
            {counts.deferred > 0 && <><span>·</span><span>{counts.deferred} deferred</span></>}
          </div>
        );
      })()}

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filterCategory || ''}
          onChange={e => setFilterCategory(e.target.value || null)}
          className="text-xs bg-card border border-border rounded-md px-2 py-1 text-foreground"
        >
          <option value="">All Categories</option>
          {categories.map(([cat]) => <option key={cat} value={cat}>{cat}</option>)}
        </select>
        <select
          value={filterPriority || ''}
          onChange={e => setFilterPriority(e.target.value || null)}
          className="text-xs bg-card border border-border rounded-md px-2 py-1 text-foreground"
        >
          <option value="">All Priorities</option>
          {priorities.map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <select
          value={filterStatus || ''}
          onChange={e => setFilterStatus(e.target.value || null)}
          className="text-xs bg-card border border-border rounded-md px-2 py-1 text-foreground"
        >
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(filterCategory || filterPriority || filterStatus) && (
          <button
            onClick={() => { setFilterCategory(null); setFilterPriority(null); setFilterStatus(null); }}
            className="text-xs text-primary hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── PRD Table ──────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-muted-foreground border-b border-border bg-muted">
              <th className="text-left py-2.5 pl-3 pr-2 cursor-pointer hover:text-foreground" onClick={() => handleSort('id')}>
                ID {sortKey === 'id' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="text-left py-2.5 px-2">Item</th>
              <th className="text-left py-2.5 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort('category')}>
                Category {sortKey === 'category' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="text-left py-2.5 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort('priority')}>
                Priority {sortKey === 'priority' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="text-left py-2.5 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>
                Status {sortKey === 'status' && (sortAsc ? '↑' : '↓')}
              </th>
              <th className="text-left py-2.5 px-2">Owner</th>
              <th className="text-left py-2.5 px-2">PR</th>
              {hasTripleVerify ? (
                <>
                  <th className="text-center py-2.5 px-1 text-[10px]" title="Gemini automated test">V-G</th>
                  <th className="text-center py-2.5 px-1 text-[10px]" title="Consultant audit">V-C</th>
                  <th className="text-center py-2.5 pl-1 pr-3 text-[10px]" title="Michael review">V-M</th>
                </>
              ) : (
                <th className="text-left py-2.5 pl-2 pr-3">Verified</th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => (
              <tr key={item.id} className={`border-b border-border ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                <td className="py-2 pl-3 pr-2 font-mono text-primary font-semibold">{item.id}</td>
                <td className="py-2 px-2 text-foreground max-w-[200px] truncate">{item.item}</td>
                <td className="py-2 px-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">{item.category}</span>
                </td>
                <td className="py-2 px-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.priority === 'P0' ? 'bg-red-500/20 text-red-400' : item.priority === 'P1' ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                    {item.priority}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${statusColor(item.status)}`}>{item.status}</span>
                </td>
                <td className="py-2 px-2 text-muted-foreground">{item.owner}</td>
                <td className="py-2 px-2 font-mono text-muted-foreground">
                  {item.github && item.github !== '—' ? item.github : '—'}
                </td>
                {hasTripleVerify ? (
                  <>
                    <td className="py-2 px-1 text-center text-sm">{item.verifyG === '✅' ? '✅' : item.verifyG === 'N/A' ? <span className="text-muted-foreground/40 text-[10px]">N/A</span> : <span className="text-muted-foreground/40">❌</span>}</td>
                    <td className="py-2 px-1 text-center text-sm">{item.verifyC === '✅' ? '✅' : item.verifyC === 'N/A' ? <span className="text-muted-foreground/40 text-[10px]">N/A</span> : <span className="text-muted-foreground/40">❌</span>}</td>
                    <td className="py-2 pl-1 pr-3 text-center text-sm">{item.verifyM === '✅' ? '✅' : item.verifyM === 'N/A' ? <span className="text-muted-foreground/40 text-[10px]">N/A</span> : <span className="text-muted-foreground/40">❌</span>}</td>
                  </>
                ) : (
                  <td className="py-2 pl-2 pr-3">
                    <span className="text-muted-foreground/40">—</span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">No items match filters</div>
      )}
    </div>
  );
}
