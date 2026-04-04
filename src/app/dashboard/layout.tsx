'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarNav } from '@/components/sidebar-nav';
import { StatusDot } from '@/components/dashboard';

const topNavItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/radar', label: 'RADAR' },
  { href: '/dashboard/products', label: 'Products' },
  { href: '/dashboard/departments', label: 'Departments' },
  { href: '/dashboard/sponsor/todo', label: 'Sponsor TODO' },
];

function TopNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center gap-1 overflow-x-auto px-4">
        <Link href="/dashboard" className="text-sm font-bold text-primary mr-4 no-underline shrink-0">
          BigClaw AI
        </Link>
        {topNavItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-colors no-underline ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        <div className="ml-auto flex items-center gap-1.5 py-3 pl-4 shrink-0">
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
  if (isLoginPage) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] bg-background flex items-center justify-center">
        <div className="w-full max-w-md px-6">{children}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav />
      <div className="flex flex-1 overflow-hidden">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
