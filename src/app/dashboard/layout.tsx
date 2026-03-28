'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  OverviewIcon,
  ProjectsIcon,
  RadarIcon,
  FinanceIcon,
  GrowthIcon,
  StatusDot,
} from '@/components/dashboard';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: <OverviewIcon /> },
  { href: '/dashboard/projects', label: 'Projects', icon: <ProjectsIcon /> },
  { href: '/dashboard/radar', label: 'RADAR', icon: <RadarIcon /> },
  { href: '/dashboard/finance', label: 'Finance', icon: <FinanceIcon /> },
  { href: '/dashboard/bizdev', label: 'Growth', icon: <GrowthIcon /> },
];

function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-border bg-card min-h-[calc(100vh-3.5rem)] py-4 px-3">
      <div className="mb-6 px-2">
        <span className="text-xs font-mono font-semibold uppercase tracking-widest text-muted-foreground">Big Claw</span>
      </div>
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 no-underline hover:no-underline ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span className="w-5 h-5 shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto px-3 flex items-center gap-2">
        <StatusDot status="good" size="sm" />
        <span className="text-xs text-muted-foreground font-mono">Online</span>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden border-b border-border bg-card">
      <nav className="flex gap-1 px-4 py-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors no-underline hover:no-underline ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <span className="w-4 h-4">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
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

  if (isLoginPage) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-background flex items-center justify-center">
        <div className="w-full max-w-md px-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <SidebarNav />
      <div className="flex-1 min-w-0 bg-background">
        <MobileNav />
        <div className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
