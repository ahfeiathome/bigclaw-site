'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function SectionLink({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href === '/dashboard/mission-control' && pathname === '/dashboard');

  return (
    <Link
      href={href}
      className={`block px-3 py-1.5 rounded-md no-underline transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary font-semibold'
          : 'text-foreground hover:text-primary hover:bg-muted'
      }`}
      style={{ fontSize: '14px', fontWeight: 600 }}
    >
      {label}
    </Link>
  );
}

function SubLink({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`block pl-6 pr-3 py-1 rounded-md no-underline transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
      style={{ fontSize: '13px', fontWeight: 400 }}
    >
      {label}
    </Link>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
      {label}
    </div>
  );
}

export function SidebarNav() {
  return (
    <nav className="w-56 h-full shrink-0 border-r border-border bg-card overflow-y-auto py-2 px-2">
      {/* Brand */}
      <Link
        href="/dashboard/mission-control"
        className="flex items-center gap-2 px-3 py-3 mb-2 no-underline"
        style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}
      >
        <span>🦀</span>
        <span>BigClaw AI</span>
      </Link>

      {/* Mission Control */}
      <SectionLink label="Mission Control" href="/dashboard/mission-control" />

      {/* Product — business verticals */}
      <SectionHeader label="Product" />
      <div className="space-y-0.5">
        <SubLink label="Education" href="/dashboard/education" />
        <SubLink label="FinTech" href="/dashboard/fintech" />
        <SubLink label="E-Commerce" href="/dashboard/ecommerce" />
        <SubLink label="Foundry" href="/dashboard/foundry" />
      </div>

      {/* Organization */}
      <div className="mt-2">
        <SectionLink label="Organization" href="/dashboard/departments/infrastructure" />
      </div>

      {/* Finance */}
      <SectionLink label="Finance" href="/dashboard/departments/finance" />

      {/* Business */}
      <SectionLink label="Business" href="/dashboard/departments/marketing" />

      {/* Resources */}
      <SectionLink label="Resources" href="/dashboard/departments/knowledge" />
    </nav>
  );
}
