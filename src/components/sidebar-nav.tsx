'use client';

import { useState, useEffect } from 'react';
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

const PRODUCT_ROUTES: Record<string, { label: string; href: string }> = {
  grovakid: { label: 'GrovaKid', href: '/dashboard/grovakid' },
  radar: { label: 'RADAR', href: '/dashboard/radar' },
  fairconnect: { label: 'Foundry', href: '/dashboard/foundry' },
  keeptrack: { label: 'Foundry', href: '/dashboard/foundry' },
  subcheck: { label: 'Foundry', href: '/dashboard/foundry' },
  'iris-studio': { label: 'E-Commerce', href: '/dashboard/ecommerce' },
  fatfrogmodels: { label: 'E-Commerce', href: '/dashboard/ecommerce' },
};

function useUserRole(): { role: string; products: string[] } {
  const [info, setInfo] = useState<{ role: string; products: string[] }>({ role: 'admin', products: [] });
  useEffect(() => {
    try {
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('bigclaw-role='));
      if (cookie) {
        const val = JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('=')));
        setInfo({ role: val.role || 'admin', products: val.products || [] });
      }
    } catch { /* fallback to admin */ }
  }, []);
  return info;
}

export function SidebarNav() {
  const { role, products } = useUserRole();
  const isAdmin = role === 'admin';
  const isInvestor = role === 'investor';
  const isProductViewer = role === 'product-viewer';

  // Product-viewer: compute their allowed links
  const viewerLinks = isProductViewer
    ? [...new Map(products.map(p => PRODUCT_ROUTES[p]).filter(Boolean).map(r => [r.href, r])).values()]
    : [];

  return (
    <nav className="w-56 h-full shrink-0 border-r border-border/50 bg-card overflow-y-auto py-2 px-2 flex flex-col">
      {/* Brand */}
      <Link
        href="/dashboard/mission-control"
        className="flex flex-col items-center px-3 py-4 mb-2 no-underline gap-2"
      >
        <img
          src="/images/bigclaw-logo-transparent.jpeg"
          alt="BigClaw AI"
          className="w-full rounded-lg"
          style={{ maxHeight: '120px', objectFit: 'contain', mixBlendMode: 'luminosity' }}
        />
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>
          BigClaw AI
        </span>
      </Link>

      {/* Product-viewer: only their product links */}
      {isProductViewer && (
        <div className="space-y-0.5">
          {viewerLinks.map(link => (
            <SectionLink key={link.href} label={link.label} href={link.href} />
          ))}
        </div>
      )}

      {/* Investor: Mission Control + Finance only */}
      {isInvestor && (
        <>
          <SectionLink label="Mission Control" href="/dashboard/mission-control" />
          <SectionLink label="Finance" href="/dashboard/finance" />
        </>
      )}

      {/* Admin: full navigation */}
      {isAdmin && (
        <>
          <SectionLink label="Mission Control" href="/dashboard/mission-control" />
          <SectionLink label="Finance" href="/dashboard/finance" />

          <SectionHeader label="Products" />
          <div className="space-y-0.5">
            <SubLink label="Products" href="/dashboard/products" />
            <SubLink label="Product Health" href="/dashboard/products/health" />
            <SubLink label="Foundry" href="/dashboard/foundry" />
            <SubLink label="RADAR" href="/dashboard/radar" />
          </div>

          <SectionHeader label="Pipeline" />
          <div className="space-y-0.5">
            <SubLink label="PDLC" href="/dashboard/pdlc" />
            <SubLink label="SDLC" href="/dashboard/sdlc/process" />
            <SubLink label="Team" href="/dashboard/organization/team" />
          </div>

          <SectionLink label="Resources" href="/dashboard/resources" />

          <div className="pt-4 border-t border-border/30 mt-6">
            <SectionLink label="Settings" href="/dashboard/settings/users" />
          </div>
        </>
      )}

      {/* Sign out — all roles */}
      <div className="px-2 pb-4 mt-auto border-t border-border/30 pt-3">
        <button
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/dashboard/login';
          }}
          className="w-full px-3 py-1.5 rounded-md text-left text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-150 bg-transparent border-none cursor-pointer"
          style={{ fontSize: '13px' }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
