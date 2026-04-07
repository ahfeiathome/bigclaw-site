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

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-3 pt-5 pb-1.5" style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.35)' }}>
      {label}
    </div>
  );
}

// ── Sector data (source of truth: REGISTRY.md) ──────────────────────

interface Product { name: string; href: string; slug: string; shelved?: boolean }
interface Sector { id: string; name: string; icon: string; products: Product[] }

const SECTORS: Sector[] = [
  {
    id: 'education',
    name: 'Education & Career',
    icon: '🎓',
    products: [
      { name: 'GrovaKid', href: '/dashboard/products/grovakid', slug: 'grovakid' },
      { name: 'REHEARSAL', href: '/dashboard/products/rehearsal', slug: 'rehearsal' },
    ],
  },
  {
    id: 'commerce',
    name: 'Commerce',
    icon: '🛍️',
    products: [
      { name: 'iris-studio', href: '/dashboard/products/iris-studio', slug: 'iris-studio' },
      { name: 'fatfrogmodels', href: '/dashboard/products/fatfrogmodels', slug: 'fatfrogmodels' },
    ],
  },
  {
    id: 'consumer',
    name: 'Consumer Tools',
    icon: '📱',
    products: [
      { name: 'FairConnect', href: '/dashboard/products/fairconnect', slug: 'fairconnect' },
      { name: 'KeepTrack', href: '/dashboard/products/keeptrack', slug: 'keeptrack' },
      { name: 'SubCheck', href: '/dashboard/products/subcheck', slug: 'subcheck' },
    ],
  },
  {
    id: 'knowledge',
    name: 'Knowledge',
    icon: '🧠',
    products: [
      { name: 'CORTEX', href: '/dashboard/products/cortex', slug: 'cortex' },
    ],
  },
  {
    id: 'fintech',
    name: 'FinTech',
    icon: '📈',
    products: [
      { name: 'RADAR', href: '/dashboard/products/radar', slug: 'radar' },
    ],
  },
];

// ── Sector block ─────────────────────────────────────────────────────

function SectorBlock({ sector, isAdmin, userProducts }: { sector: Sector; isAdmin: boolean; userProducts: string[] }) {
  const visibleProducts = isAdmin
    ? sector.products
    : sector.products.filter(p => userProducts.includes(p.slug));

  if (!isAdmin && visibleProducts.length === 0) return null;

  return (
    <div className="mb-1">
      <div className="px-3 pt-4 pb-1 flex items-center gap-1.5">
        <span style={{ fontSize: '11px' }}>{sector.icon}</span>
        <span className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground/70">
          {sector.name}
        </span>
      </div>
      <div className="space-y-0.5">
        {visibleProducts.map(product => (
          <div key={product.href} className={product.shelved ? 'opacity-60' : ''}>
            <SubLink label={product.name} href={product.href} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Role hook ────────────────────────────────────────────────────────

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

// ── Sidebar ──────────────────────────────────────────────────────────

export function SidebarNav() {
  const { role, products } = useUserRole();
  const isAdmin = role === 'admin';
  const isInvestor = role === 'investor';
  const isProductViewer = role === 'product-viewer';

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

      {/* ── Investor view ─────────────────────────────────── */}
      {isInvestor && (
        <>
          <SectionLink label="Mission Control" href="/dashboard/mission-control" />
          <SectionLink label="Finance" href="/dashboard/finance" />
        </>
      )}

      {/* ── Product-viewer view ───────────────────────────── */}
      {isProductViewer && (
        <>
          {SECTORS.map(sector => (
            <SectorBlock key={sector.id} sector={sector} isAdmin={false} userProducts={products} />
          ))}
        </>
      )}

      {/* ── Admin view ────────────────────────────────────── */}
      {isAdmin && (
        <>
          <SectionLink label="Mission Control" href="/dashboard/mission-control" />
          <SectionLink label="Finance" href="/dashboard/finance" />

          {/* Product Lineup */}
          <div className="border-t border-border/30 mt-3 pt-1">
            <SectionLink label="Product Lineup" href="/dashboard/products" />
            <SubLink label="Product Gates" href="/dashboard/products/health" />
          </div>

          {/* Sector blocks */}
          {SECTORS.map(sector => (
            <SectorBlock key={sector.id} sector={sector} isAdmin={true} userProducts={[]} />
          ))}

          {/* Knowledge */}
          <SectionLink label="Knowledge" href="/dashboard/resources" />
          <SubLink label="SDLC Process" href="/dashboard/sdlc/process" />
          <SubLink label="Gates Matrix" href="/dashboard/sdlc/gates" />
          <SubLink label="Violations" href="/dashboard/sdlc/violations" />
          <SubLink label="RCA" href="/dashboard/sdlc/rca" />

          <div className="pt-4 border-t border-border/30 mt-4">
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
