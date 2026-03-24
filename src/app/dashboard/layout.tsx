import Link from 'next/link';
import type { Metadata } from 'next';
import {
  OverviewIcon,
  ProjectsIcon,
  RadarIcon,
  FinanceIcon,
  GrowthIcon,
} from '@/components/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard — The Firm',
  description: 'The Firm executive dashboard.',
};

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: <OverviewIcon /> },
  { href: '/dashboard/projects', label: 'Projects', icon: <ProjectsIcon /> },
  { href: '/dashboard/radar', label: 'RADAR', icon: <RadarIcon /> },
  { href: '/dashboard/finance', label: 'Finance', icon: <FinanceIcon /> },
  { href: '/dashboard/bizdev', label: 'Growth', icon: <GrowthIcon /> },
];

function SidebarNav() {
  return (
    <aside className="hidden md:flex flex-col w-52 lg:w-56 shrink-0 border-r border-slate-200 bg-slate-50/60 min-h-[calc(100vh-3.5rem)]">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-base font-bold tracking-tight text-slate-800">THE FIRM</h1>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">
          Private Dashboard
        </span>
      </div>
      <nav className="flex flex-col gap-0.5 px-2 flex-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors no-underline hover:no-underline group"
          >
            <span className="text-slate-400 group-hover:text-slate-600 transition-colors">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function MobileNav() {
  return (
    <div className="md:hidden border-b border-slate-200 bg-white">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-base font-bold tracking-tight text-slate-800">THE FIRM</h1>
      </div>
      <nav className="flex gap-1 px-4 pb-2 overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors no-underline hover:no-underline whitespace-nowrap"
          >
            <span className="text-slate-400">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <SidebarNav />
      <div className="flex-1 min-w-0">
        <MobileNav />
        <div className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
