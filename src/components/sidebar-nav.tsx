'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ALL_PRODUCTS } from '@/lib/content';

function NavLink({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`block px-3 py-1.5 text-sm rounded-md no-underline transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {label}
    </Link>
  );
}

export function SidebarNav() {
  // Live products first, then in-development, exclude dashboard meta-product
  const liveProducts = ALL_PRODUCTS.filter(p => (p.status === 'LIVE' || p.status === 'PAPER') && p.slug !== 'bigclaw-dashboard');
  const devProducts = ALL_PRODUCTS.filter(p => p.status !== 'LIVE' && p.status !== 'PAPER' && p.slug !== 'bigclaw-dashboard');

  return (
    <nav className="w-56 h-full shrink-0 border-r border-border bg-card overflow-y-auto py-2 px-2">
      <div className="space-y-0.5">
        {liveProducts.map((p) => (
          <NavLink key={p.href} label={`Product ${p.name}`} href={p.href} />
        ))}
        {devProducts.map((p) => (
          <NavLink key={p.href} label={`Product ${p.name}`} href={p.href} />
        ))}
      </div>

      {/* All Products link */}
      <div className="mt-4 pt-3 border-t border-border">
        <NavLink label="All Products" href="/dashboard/products" />
      </div>
    </nav>
  );
}
