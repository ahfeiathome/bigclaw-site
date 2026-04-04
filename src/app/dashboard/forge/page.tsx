import Link from 'next/link';

const sections = [
  { label: 'Status', href: '/dashboard/forge/status', description: 'Issues snapshot and patrol reports' },
  { label: 'Specs', href: '/dashboard/forge/specs', description: 'Product and engineering specifications' },
  { label: 'Finance', href: '/dashboard/forge/finance', description: 'Financial overview and burn rate' },
];

export default function ForgePage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Forge</h1>
      <p className="text-sm text-muted-foreground mb-6">Products: GrovaKid, CORTEX, BigClaw Site</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all no-underline group"
          >
            <h2 className="text-lg font-semibold text-foreground group-hover:text-primary mb-1">{s.label}</h2>
            <p className="text-xs text-muted-foreground">{s.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
