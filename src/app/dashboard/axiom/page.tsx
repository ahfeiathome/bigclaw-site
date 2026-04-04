import Link from 'next/link';

const sections = [
  { label: 'Status', href: '/dashboard/axiom/status', description: 'Issues snapshot and reports' },
  { label: 'Specs', href: '/dashboard/axiom/specs', description: 'Product and engineering specifications' },
  { label: 'Finance', href: '/dashboard/axiom/finance', description: 'Financial overview' },
];

export default function AxiomPage() {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-2">Axiom</h1>
      <p className="text-sm text-muted-foreground mb-6">Products: FairConnect, KeepTrack, SubCheck, RADAR, iris-studio, fatfrogmodels</p>
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
