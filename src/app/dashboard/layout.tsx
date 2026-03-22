import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — The Firm',
  description: 'The Firm executive dashboard.',
};

const navItems = [
  { href: '/dashboard', label: 'Exec View' },
  { href: '/dashboard/patrol', label: 'Felix Patrol' },
  { href: '/dashboard/radar', label: 'RADAR' },
  { href: '/dashboard/finance', label: 'Finance' },
  { href: '/dashboard/projects', label: 'Projects' },
  { href: '/dashboard/bizdev', label: 'Biz Dev' },
  { href: '/dashboard/marketing', label: 'Marketing' },
  { href: '/dashboard/mission-control', label: 'Mission Control' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight">THE FIRM</h1>
        <span className="text-[10px] font-mono text-muted uppercase tracking-widest">
          Private
        </span>
      </div>

      <nav className="flex gap-1 mb-6 border-b border-border pb-px overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-1.5 text-xs text-muted hover:text-foreground transition-colors rounded-t hover:bg-surface no-underline hover:no-underline whitespace-nowrap"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
