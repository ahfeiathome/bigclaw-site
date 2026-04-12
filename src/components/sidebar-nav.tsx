'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

function SectionLink({ label, href, badge }: { label: string; href: string; badge?: number }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href === '/dashboard/mission-control' && pathname === '/dashboard');

  return (
    <Link
      href={href}
      className={`flex items-center justify-between px-3 py-1.5 rounded-md no-underline transition-all duration-150 ${
        isActive
          ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary -ml-0.5 pl-[10px]'
          : 'text-foreground/80 hover:text-foreground hover:bg-muted/50'
      }`}
      style={{ fontSize: '14px', fontWeight: 600 }}
    >
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500 text-white min-w-[18px] text-center">{badge}</span>
      )}
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

// ── Product vertical nav (v3 architecture) ──────────────────────────
const VERTICALS = [
  { label: 'Education: GrovaKid', href: '/dashboard/education' },
  { label: 'FinTech: RADAR', href: '/dashboard/fintech' },
  { label: 'E-Commerce: iris-studio · FFM', href: '/dashboard/ecommerce' },
  { label: 'Foundry: FC · KT · SC', href: '/dashboard/foundry' },
];

// ── Product list for product-viewer role ─────────────────────────────
const PRODUCTS = [
  { name: 'GrovaKid', href: '/dashboard/products/grovakid', slug: 'grovakid' },
  { name: 'iris-studio', href: '/dashboard/products/iris-studio', slug: 'iris-studio' },
  { name: 'fatfrogmodels', href: '/dashboard/products/fatfrogmodels', slug: 'fatfrogmodels' },
  { name: 'FairConnect', href: '/dashboard/products/fairconnect', slug: 'fairconnect' },
  { name: 'KeepTrack', href: '/dashboard/products/keeptrack', slug: 'keeptrack' },
  { name: 'SubCheck', href: '/dashboard/products/subcheck', slug: 'subcheck' },
  { name: 'CORTEX', href: '/dashboard/products/cortex', slug: 'cortex' },
  { name: 'REHEARSAL', href: '/dashboard/products/rehearsal', slug: 'rehearsal' },
  { name: 'RADAR', href: '/dashboard/products/radar', slug: 'radar' },
];

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

function useP0Count(): number {
  const [count, setCount] = useState(0);
  useEffect(() => {
    fetch('/api/status-bar')
      .then(r => r.json())
      .then(d => { if (d.p0Count !== undefined) setCount(d.p0Count); })
      .catch(() => {});
  }, []);
  return count;
}

export function SidebarNav() {
  const { role, products } = useUserRole();
  const p0Count = useP0Count();
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
          src="/images/bigclaw-logo.png"
          alt="BigClaw AI"
          className="w-full rounded-lg"
          style={{ maxHeight: '120px', objectFit: 'contain', borderRadius: '12px' }}
        />
        <span style={{ fontSize: '22px', fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>
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
          {PRODUCTS.filter(p => products.includes(p.slug)).map(p => (
            <SubLink key={p.slug} label={p.name} href={p.href} />
          ))}
        </>
      )}

      {/* ── Admin view ────────────────────────────────────── */}
      {isAdmin && (
        <>
          {/* Top-level */}
          <SectionLink label={`Mission Control${p0Count > 0 ? ` · ${p0Count} P0` : ''}`} href="/dashboard/mission-control" badge={p0Count} />

          {/* Product Verticals */}
          <SectionHeader label="Products" />
          <SubLink label="Engineering" href="/dashboard/engineering" />
          {VERTICALS.map(v => (
            <SubLink key={v.href} label={v.label} href={v.href} />
          ))}

          {/* Company ops */}
          <SectionHeader label="Company" />
          <SubLink label="Organization" href="/dashboard/organization" />
          <SubLink label="Finance" href="/dashboard/finance" />
          <SubLink label="Process" href="/dashboard/process" />
          <SubLink label="Knowledge" href="/dashboard/knowledge" />

          {/* Access Control */}
          <div className="pt-4 border-t border-border/30 mt-4">
            <SectionLink label="Access Control" href="/dashboard/settings/users" />
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
