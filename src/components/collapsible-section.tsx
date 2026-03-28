'use client';

import React, { useState } from 'react';

export function CollapsibleSection({
  title,
  defaultOpen = false,
  badge,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="animate-fade-in">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 w-full text-left group mb-3"
      >
        <span
          className={`text-xs text-muted-foreground transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        >
          &#9654;
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </span>
        {badge}
        <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono group-hover:text-muted-foreground transition-colors">
          {open ? 'collapse' : 'expand'}
        </span>
      </button>
      {open && children}
    </div>
  );
}
