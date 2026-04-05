'use client';

import { useState, useMemo } from 'react';
import { StatusDot } from './dashboard';

// ── Types ──────────────────────────────────────────────────────────────────

export interface PrdItem {
  id: string;
  item: string;
  category: string;
  priority: string;
  status: 'Done' | 'In Progress' | 'Not Started' | 'Deferred';
  owner: string;
  github?: string;
}

interface Props {
  items: PrdItem[];
  repoSlug?: string;
}

// ── Category mapping ───────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'AI/ML': 'bg-purple-500',
  'UI/UX': 'bg-blue-500',
  'Functional': 'bg-green-500',
  'QA/Testing': 'bg-amber-500',
  'Auth/Security': 'bg-red-500',
  'Infrastructure': 'bg-cyan-500',
  'Marketing': 'bg-pink-500',
  'Revenue': 'bg-emerald-500',
  'Strategy': 'bg-indigo-500',
};

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

  // Category summary
  const categories = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const item of items) {
      const cat = item.category;
      if (!map.has(cat)) map.set(cat, { done: 0, total: 0 });
      const entry = map.get(cat)!;
      entry.total++;
      if (item.status === 'Done') entry.done++;
    }
    return Array.from(map.entries()).sort((a, b) => {
      const pctA = a[1].total > 0 ? a[1].done / a[1].total : 0;
      const pctB = b[1].total > 0 ? b[1].done / b[1].total : 0;
      return pctB - pctA;
    });
  }, [items]);

  // Overall counts
  const counts = useMemo(() => {
    const c = { done: 0, inProgress: 0, notStarted: 0, deferred: 0 };
    for (const item of items) {
      if (item.status === 'Done') c.done++;
      else if (item.status === 'In Progress') c.inProgress++;
      else if (item.status === 'Deferred') c.deferred++;
      else c.notStarted++;
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
      {/* ── Category Summary Bars ──────────────────────────────── */}
      <div className="space-y-2 mb-6">
        {categories.map(([cat, { done, total }]) => {
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const isActive = filterCategory === cat;
          const barColor = CATEGORY_COLORS[cat] || 'bg-gray-500';
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(isActive ? null : cat)}
              className={`w-full flex items-center gap-3 text-left rounded-lg p-2 transition-all ${isActive ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted'}`}
            >
              <span className="text-xs text-foreground w-28 shrink-0 font-medium">{cat}</span>
              <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-muted">
                <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground w-20 text-right shrink-0">
                {done}/{total} ({pct}%)
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Counters ───────────────────────────────────────────── */}
      <div className="flex gap-4 text-xs text-muted-foreground mb-3 flex-wrap">
        <span className="font-mono">{counts.done} of {items.length} done</span>
        <span>·</span>
        <span>{counts.inProgress} in progress</span>
        <span>·</span>
        <span>{counts.notStarted} not started</span>
        {counts.deferred > 0 && <><span>·</span><span>{counts.deferred} deferred</span></>}
      </div>

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
              <th className="text-left py-2.5 pl-2 pr-3">GitHub</th>
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
                <td className="py-2 pl-2 pr-3">
                  {item.github && item.github !== '—' ? (
                    <a href={`https://github.com/ahfeiathome/${repoSlug || 'learnie-ai'}/issues/${item.github.replace('#', '')}`} target="_blank" rel="noopener noreferrer" className="text-primary no-underline hover:underline">
                      {item.github}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
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
