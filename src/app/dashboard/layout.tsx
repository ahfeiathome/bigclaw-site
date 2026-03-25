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
    <aside className="hidden md:flex flex-col w-52 lg:w-56 shrink-0 border-r border-slate-100 bg-gradient-to-b from-slate-50/80 to-white min-h-[calc(100vh-3.5rem)]">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-base font-bold tracking-tight text-slate-800">THE FIRM</h1>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
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
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all duration-150 no-underline hover:no-underline group relative ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-blue-500" />
              )}
              <span className={`transition-colors ${isActive ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600'}`}>
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
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <StatusDot status="good" size="sm" />
          <span className="text-[10px] text-slate-400 font-mono">Systems OK</span>
        </div>
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden border-b border-slate-100 bg-white">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-base font-bold tracking-tight text-slate-800">THE FIRM</h1>
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
                  ? 'bg-blue-50 text-blue-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <span className={isActive ? 'text-blue-500' : 'text-slate-400'}>{item.icon}</span>
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
      <div className="min-h-[calc(100vh-3.5rem)] bg-[var(--surface-0)] flex items-center justify-center">
        <div className="w-full max-w-md px-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <SidebarNav />
      <div className="flex-1 min-w-0 bg-[var(--surface-0)]">
        <MobileNav />
        <div className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
