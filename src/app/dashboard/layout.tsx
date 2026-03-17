import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — Big Claw',
  description: 'Big Claw operator dashboard.',
};

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/finance', label: 'Finance' },
  { href: '/dashboard/projects', label: 'Projects' },
  { href: '/dashboard/marketing', label: 'Marketing' },
  { href: '/dashboard/bizdev', label: 'Biz Dev' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Operator Dashboard</h1>
        <span className="text-xs font-mono text-muted">PRIVATE</span>
      </div>

      <nav className="flex gap-1 mb-8 border-b border-border pb-px overflow-x-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="px-4 py-2 text-sm text-muted hover:text-foreground transition-colors rounded-t-lg hover:bg-surface no-underline hover:no-underline whitespace-nowrap"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
