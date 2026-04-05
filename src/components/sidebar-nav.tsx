'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ALL_PRODUCTS } from '@/lib/content';

function SectionLink({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href === '/dashboard/mission-control' && pathname === '/dashboard');

  return (
    <Link
      href={href}
      className={`block px-3 py-1.5 text-sm font-medium rounded-md no-underline transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground hover:text-primary hover:bg-muted'
      }`}
    >
      {label}
    </Link>
  );
}

function ProductLink({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`block pl-6 pr-3 py-1 text-[13px] rounded-md no-underline transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {label}
    </Link>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
      {label}
    </div>
  );
}

export function SidebarNav() {
  const liveProducts = ALL_PRODUCTS.filter(p => (p.status === 'LIVE' || p.status === 'PAPER') && p.slug !== 'bigclaw-dashboard');
  const devProducts = ALL_PRODUCTS.filter(p => p.status !== 'LIVE' && p.status !== 'PAPER' && p.slug !== 'bigclaw-dashboard');

  return (
    <nav className="w-56 h-full shrink-0 border-r border-border bg-card overflow-y-auto py-2 px-2">
      {/* Mission Control */}
      <SectionLink label="Mission Control" href="/dashboard/mission-control" />

      {/* Product section — always expanded */}
      <SectionHeader label="Product" />
      <div className="space-y-0.5">
        {liveProducts.map((p) => (
          <ProductLink key={p.href} label={`Product ${p.name}`} href={p.href} />
        ))}
        {devProducts.map((p) => (
          <ProductLink key={p.href} label={`Product ${p.name}`} href={p.href} />
        ))}
        <ProductLink label="All Products" href="/dashboard/products" />
      </div>

      {/* Organization */}
      <div className="mt-1">
        <SectionLink label="Organization" href="/dashboard/departments/infrastructure" />
      </div>

      {/* Finance */}
      <SectionLink label="Finance" href="/dashboard/departments/finance" />

      {/* Business (renamed from Marketing) */}
      <SectionLink label="Business" href="/dashboard/departments/marketing" />

      {/* Resources */}
      <SectionLink label="Resources" href="/dashboard/departments/knowledge" />
    </nav>
  );
}
