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
    <aside className="hidden md:flex flex-col w-16 shrink-0 border-r border-gray-200 bg-white min-h-[calc(100vh-3.5rem)] items-center py-4">
      <nav className="flex flex-col gap-1 items-center flex-1">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-150 no-underline hover:no-underline ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="w-5 h-5">{item.icon}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto">
        <StatusDot status="good" size="sm" />
      </div>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="md:hidden border-b border-gray-200 bg-white">
      <nav className="flex gap-1 px-4 py-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors no-underline hover:no-underline ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="w-5 h-5">{item.icon}</span>
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
      <div className="min-h-[calc(100vh-3.5rem)] bg-[#f5f5f0] flex items-center justify-center">
        <div className="w-full max-w-md px-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <SidebarNav />
      <div className="flex-1 min-w-0 bg-[#f5f5f0]">
        <MobileNav />
        <div className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
