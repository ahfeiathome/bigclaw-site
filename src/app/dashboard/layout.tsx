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
    <aside className="hidden md:flex flex-col w-52 lg:w-56 shrink-0 border-r border-border bg-card min-h-[calc(100vh-3.5rem)]">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-base font-bold tracking-tight text-foreground">THE FIRM</h1>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
          Private Dashboard
        </span>
      </div>
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 no-underline hover:no-underline group relative ${
                isActive
                  ? 'bg-secondary text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-cyan-400" />
              )}
              <span className={`transition-colors ${isActive ? 'text-cyan-400' : 'text-muted-foreground group-hover:text-foreground'}`}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.label === 'RADAR' && (
                <span className="ml-auto">
                  <StatusDot status="good" size="sm" />
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-border">
        <div className="bg-secondary rounded-lg p-3">
          <div className="flex items-center gap-2">
            <StatusDot status="good" size="sm" />
            <span className="text-[10px] text-muted-foreground font-mono">Systems OK</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden border-b border-border bg-card">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-base font-bold tracking-tight text-foreground">THE FIRM</h1>
      </div>
      <nav className="flex gap-1 px-4 pb-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors no-underline hover:no-underline whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <span className={isActive ? 'text-cyan-400' : 'text-muted-foreground'}>{item.icon}</span>
              {item.label}
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
