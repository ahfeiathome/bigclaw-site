'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/sidebar-nav';
import { StatusDot } from '@/components/dashboard';
import { StatusBar } from '@/components/status-bar';

function TopBar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  return (
    <div className="border-b border-border bg-card md:hidden">
      <div className="flex items-center px-4 py-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 mr-1 text-muted-foreground hover:text-foreground"
          aria-label="Toggle sidebar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <Link href="/dashboard" className="no-underline shrink-0 flex items-center gap-1.5" style={{ fontSize: '16px', fontWeight: 700, color: 'white' }}>
          <img src="/images/bigclaw-logo-transparent.jpeg" alt="" className="h-6 w-auto rounded" style={{ background: '#1a1f2e' }} />
          BigClaw AI
        </Link>

        <div className="ml-auto flex items-center gap-1.5 shrink-0">
          <StatusDot status="good" size="sm" />
          <span className="text-xs text-muted-foreground font-mono">Online</span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/dashboard/login';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false); // eslint-disable-line react-hooks/set-state-in-effect
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Watermark */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          backgroundImage: 'url(/images/bigclaw-logo-transparent.jpeg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: '70vw auto',
          opacity: 0.05,
          mixBlendMode: 'luminosity',
        }}
      />
      <TopBar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Backdrop — mobile only */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Sidebar — always visible on md+, overlay on mobile */}
        <div className={`
          fixed inset-y-0 left-0 z-40 w-56 transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0 md:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <SidebarNav />
        </div>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </div>
        </main>
      </div>
      <StatusBar />
    </div>
  );
}
