'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

function SectionLink({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href === '/dashboard/mission-control' && pathname === '/dashboard');

  return (
    <Link
      href={href}
      className={`block px-3 py-1.5 rounded-md no-underline transition-all duration-150 ${
        isActive
          ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary -ml-0.5 pl-[10px]'
          : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
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
      className={`block pl-6 pr-3 py-1 rounded-md no-underline transition-all duration-150 ${
        isActive
          ? 'bg-primary/8 text-primary font-medium'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
      style={{ fontSize: '13px', fontWeight: 400 }}
    >
      {label}
    </Link>
  );
}

function DeepLink({ label, href }: { label: string; href: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`block pl-10 pr-3 py-0.5 rounded-md no-underline transition-all duration-150 ${
        isActive
          ? 'bg-primary/8 text-primary font-medium'
          : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/50'
      }`}
      style={{ fontSize: '12px', fontWeight: 400 }}
    >
      {label}
    </Link>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-3 pt-5 pb-1.5" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)' }}>
      {label}
    </div>
  );
}

export function SidebarNav() {
  return (
    <nav className="w-56 h-full shrink-0 border-r border-border/50 bg-card overflow-y-auto py-2 px-2">
      {/* Brand */}
      <Link
        href="/dashboard/mission-control"
        className="flex items-center gap-2 px-3 py-3 mb-2 no-underline"
        style={{ fontSize: '22px', fontWeight: 700, color: 'white' }}
      >
        <img src="/images/bigclaw-logo-transparent.jpeg" alt="" className="h-8 w-auto rounded" style={{ background: '#1a1f2e' }} />
        <span>BigClaw AI</span>
      </Link>

      {/* Mission Control */}
      <SectionLink label="Mission Control" href="/dashboard/mission-control" />

      {/* Finance */}
      <SectionLink label="Finance" href="/dashboard/finance" />

      {/* Products */}
      <SectionHeader label="Products" />
      <div className="space-y-0.5">
        <SubLink label="Products" href="/dashboard/products" />
        <SubLink label="Foundry" href="/dashboard/foundry" />
        <SubLink label="RADAR" href="/dashboard/radar" />
      </div>

      {/* Pipeline */}
      <SectionHeader label="Pipeline" />
      <div className="space-y-0.5">
        <SubLink label="PDLC" href="/dashboard/pdlc" />
        <SubLink label="SDLC" href="/dashboard/sdlc/process" />
        <DeepLink label="Process" href="/dashboard/sdlc/process" />
        <DeepLink label="Gates Matrix" href="/dashboard/sdlc/gates" />
        <DeepLink label="Violations" href="/dashboard/sdlc/violations" />
        <DeepLink label="Bug RCA" href="/dashboard/sdlc/rca" />
        <DeepLink label="Lessons" href="/dashboard/sdlc/lessons" />
        <DeepLink label="Actions" href="/dashboard/sdlc/actions" />
        <SubLink label="Team" href="/dashboard/organization/team" />
      </div>

      {/* Resources */}
      <SectionLink label="Resources" href="/dashboard/resources" />
    </nav>
  );
}
