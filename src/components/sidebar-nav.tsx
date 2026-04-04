'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NAV_TREE, type NavItem } from '@/lib/content';

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const isParentActive = item.children?.some(
    (child) => pathname === child.href || pathname.startsWith(child.href + '/'),
  );
  const [isOpen, setIsOpen] = useState(isActive || isParentActive || false);

  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <div className="flex items-center">
        <Link
          href={item.href}
          className={`flex-1 block px-3 py-1.5 text-sm rounded-md no-underline transition-colors ${
            isActive
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {item.label}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 mr-1 text-muted-foreground hover:text-foreground rounded"
          >
            <svg
              className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
      {hasChildren && isOpen && (
        <div className="mt-0.5">
          {item.children!.map((child) => (
            <NavLink key={child.href} item={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function SidebarNav() {
  return (
    <nav className="w-56 shrink-0 border-r border-border bg-card/50 overflow-y-auto py-4 px-2 space-y-0.5">
      {NAV_TREE.map((item) => (
        <NavLink key={item.href} item={item} />
      ))}
    </nav>
  );
}
