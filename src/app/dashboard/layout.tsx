'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  OverviewIcon,
  ProjectsIcon,
  GrovakidIcon,
  RadarIcon,
  FinanceIcon,
  InfraIcon,
  StatusDot,
} from '@/components/dashboard';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: <OverviewIcon /> },
  { href: '/dashboard/projects', label: 'Projects', icon: <ProjectsIcon /> },
  { href: '/dashboard/grovakid', label: 'GrovaKid', icon: <GrovakidIcon /> },
  { href: '/dashboard/radar', label: 'RADAR', icon: <RadarIcon /> },
  { href: '/dashboard/finance', label: 'Finance', icon: <FinanceIcon /> },
  { href: '/dashboard/infra', label: 'Infra', icon: <InfraIcon /> },
];

function TopNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-border bg-card">
      <div className="max-w-6xl mx-auto px-6 flex items-center gap-1 overflow-x-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors no-underline hover:no-underline ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <span className="w-4 h-4 shrink-0">{item.icon}</span>
              <span>{item.label}</span>
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
    <div className="min-h-[calc(100vh-3.5rem)] bg-background flex flex-col">
      <TopNav />
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
