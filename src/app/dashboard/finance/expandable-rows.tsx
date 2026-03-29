'use client';

import { useState } from 'react';
import { StatusDot } from '@/components/dashboard';

interface CostRow {
  category: string;
  monthly: string;
  pctOfTotal: string;
  status: string;
  statusTone: 'success' | 'warning' | 'error' | 'neutral';
  children?: { label: string; value: string; detail?: string }[];
}

function ExpandableRow({ row }: { row: CostRow }) {
  const [open, setOpen] = useState(false);
  const hasChildren = row.children && row.children.length > 0;

  const toneColor = row.statusTone === 'success' ? 'text-green-400'
    : row.statusTone === 'warning' ? 'text-amber-400'
    : row.statusTone === 'error' ? 'text-red-400'
    : 'text-muted-foreground';

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={() => hasChildren && setOpen(v => !v)}
        className={`flex items-center w-full text-left py-3 px-1 ${hasChildren ? 'cursor-pointer hover:bg-muted/30' : 'cursor-default'} transition-colors`}
      >
        {/* Expand indicator */}
        <span className={`text-[10px] text-muted-foreground w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-90' : ''} ${hasChildren ? '' : 'invisible'}`}>
          &#9654;
        </span>

        {/* Category */}
        <span className="text-sm text-foreground flex-1">{row.category}</span>

        {/* Monthly cost */}
        <span className="text-sm font-mono text-foreground w-20 text-right">{row.monthly}</span>

        {/* % of total */}
        <span className="text-xs font-mono text-muted-foreground w-16 text-right">{row.pctOfTotal}</span>

        {/* Status */}
        <span className={`text-xs w-40 text-right flex items-center justify-end gap-1.5 ${toneColor}`}>
          <StatusDot status={row.statusTone === 'success' ? 'good' : row.statusTone === 'warning' ? 'warn' : row.statusTone === 'error' ? 'bad' : 'neutral'} size="sm" />
          {row.status}
        </span>
      </button>

      {/* Expanded children */}
      {open && row.children && (
        <div className="pb-3 pl-5 space-y-1.5">
          {row.children.map((child, i) => (
            <div key={i} className="flex items-center text-xs">
              <span className="text-muted-foreground flex-1 font-mono">{child.label}</span>
              <span className="font-mono text-muted-foreground w-20 text-right">{child.value}</span>
              {child.detail && <span className="text-muted-foreground/50 w-40 text-right">{child.detail}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExpandableRows({ rows }: { rows: CostRow[] }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center py-2 px-1 border-b border-border text-[10px] text-muted-foreground uppercase tracking-wide">
        <span className="w-4 shrink-0" />
        <span className="flex-1">Category</span>
        <span className="w-20 text-right">Monthly</span>
        <span className="w-16 text-right">% Total</span>
        <span className="w-40 text-right">Status</span>
      </div>
      {rows.map((row, i) => (
        <ExpandableRow key={i} row={row} />
      ))}
    </div>
  );
}
