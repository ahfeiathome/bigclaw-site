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

// ── Company data (source of truth: REGISTRY.md) ──────────────────────

interface Product { name: string; href: string; slug: string }
interface Company { id: string; name: string; sector: string; color: string; products: Product[] }

const COMPANIES: Company[] = [
  {
    id: 'forge',
    name: 'Forge',
    sector: 'Education & Career',
    color: 'text-green-400',
    products: [
      { name: 'GrovaKid', href: '/dashboard/products/grovakid', slug: 'grovakid' },
      { name: 'REHEARSAL', href: '/dashboard/products/rehearsal', slug: 'rehearsal' },
    ],
  },
  {
    id: 'axiom',
    name: 'Axiom',
    sector: 'Consumer Apps & Commerce',
    color: 'text-blue-400',
    products: [
      { name: 'iris-studio', href: '/dashboard/products/iris-studio', slug: 'iris-studio' },
      { name: 'fatfrogmodels', href: '/dashboard/products/fatfrogmodels', slug: 'fatfrogmodels' },
      { name: 'FairConnect', href: '/dashboard/products/fairconnect', slug: 'fairconnect' },
      { name: 'KeepTrack', href: '/dashboard/products/keeptrack', slug: 'keeptrack' },
      { name: 'SubCheck', href: '/dashboard/products/subcheck', slug: 'subcheck' },
      { name: 'CORTEX', href: '/dashboard/products/cortex', slug: 'cortex' },
    ],
  },
  {
    id: 'nexus',
    name: 'Nexus',
    sector: 'FinTech & Operations',
    color: 'text-purple-400',
    products: [
      { name: 'RADAR', href: '/dashboard/products/radar', slug: 'radar' },
    ],
  },
];

// ── Company block ────────────────────────────────────────────────────

function CompanyBlock({ company, isAdmin, userProducts }: { company: Company; isAdmin: boolean; userProducts: string[] }) {
  const visibleProducts = isAdmin
    ? company.products
    : company.products.filter(p => userProducts.includes(p.slug));

  if (!isAdmin && visibleProducts.length === 0) return null;

  return (
    <div className="mb-1">
      <div className="px-3 pt-4 pb-1 flex items-baseline gap-2">
        <span className={`text-[11px] font-bold tracking-wider uppercase ${company.color}`}>
          {company.name}
        </span>
        <span className="text-[10px] text-muted-foreground/60 truncate">
          {company.sector}
        </span>
      </div>
      <div className="space-y-0.5">
        {visibleProducts.map(product => (
          <SubLink key={product.href} label={product.name} href={product.href} />
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
          {COMPANIES.map(company => (
            <CompanyBlock key={company.id} company={company} isAdmin={false} userProducts={products} />
          ))}
        </>
      )}

      {/* ── Admin view ────────────────────────────────────── */}
      {isAdmin && (
        <>
          <SectionLink label="Mission Control" href="/dashboard/mission-control" />
          <SectionLink label="Finance" href="/dashboard/finance" />

          {/* Divider + All Products */}
          <div className="border-t border-border/30 mt-3 pt-1">
            <SubLink label="All Products" href="/dashboard/products" />
          </div>

          {/* Company blocks */}
          {COMPANIES.map(company => (
            <CompanyBlock key={company.id} company={company} isAdmin={true} userProducts={[]} />
          ))}

          {/* Pipeline */}
          <SectionHeader label="Pipeline" />
          <div className="space-y-0.5">
            <SubLink label="PDLC" href="/dashboard/pdlc" />
            <SubLink label="SDLC" href="/dashboard/sdlc/process" />
            <SubLink label="Product Health" href="/dashboard/products/health" />
          </div>

          <SectionLink label="Resources" href="/dashboard/resources" />

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
