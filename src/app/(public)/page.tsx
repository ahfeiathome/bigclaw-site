import Link from 'next/link';

const products = [
  {
    name: 'Learnie AI',
    description: 'AI-powered worksheet generator for K-5 families. Print, complete by hand, scan to grade.',
    status: 'LIVE',
    statusColor: 'bg-green-500/10 text-green-500',
    pricing: '$19.99/mo',
  },
  {
    name: 'VERDE (PlantDoc)',
    description: 'AI plant doctor — diagnose problems via photo, get treatment plans, track your garden.',
    status: 'BUILD',
    statusColor: 'bg-blue-500/10 text-blue-500',
    pricing: '$3.99/mo',
  },
  {
    name: 'VAULT (ReceiptSnap)',
    description: 'Personal spending intelligence — scan receipts, track patterns, get AI insights.',
    status: 'BUILD',
    statusColor: 'bg-blue-500/10 text-blue-500',
    pricing: '$4.99/mo',
  },
  {
    name: 'RADAR',
    description: 'Autonomous AI trading engine — 6 strategies, constitution-guarded, paper trading live.',
    status: 'PAPER',
    statusColor: 'bg-amber-500/10 text-amber-500',
    pricing: 'Internal',
  },
  {
    name: 'CORTEX',
    description: 'AI knowledge management — capture, organize, and surface information across sources.',
    status: 'INTERNAL',
    statusColor: 'bg-gray-500/10 text-gray-500',
    pricing: 'Internal',
  },
];

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-6">
      {/* Hero */}
      <section className="py-24 md:py-32">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
          AI-native company
          <br />
          <span className="text-accent">building products that matter.</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl">
          We build, ship, and operate software products using a team of specialized AI agents.
          Our CEO is Code CLI — an autonomous Claude Code agent that makes all decisions and executes them.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/projects"
            className="inline-flex items-center px-5 py-2.5 bg-accent text-background font-medium rounded-lg hover:bg-accent-dim transition-colors no-underline hover:no-underline"
          >
            View Projects
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center px-5 py-2.5 border border-border text-foreground font-medium rounded-lg hover:bg-secondary transition-colors no-underline hover:no-underline"
          >
            About Us
          </Link>
        </div>
      </section>

      {/* Manifesto */}
      <section className="py-16 border-t border-border">
        <h2 className="text-2xl font-bold mb-6">We hire AI agents, not humans.</h2>
        <div className="grid md:grid-cols-2 gap-8 text-muted-foreground">
          <div>
            <p className="mb-4">
              Big Claw is an experiment in what happens when you run a real company with AI agents
              as your executive team. Our CEO is Code CLI — an autonomous Claude Code agent that
              absorbs all C-suite roles. It decides strategy, writes code, deploys products, and
              manages the team.
            </p>
            <p>
              One human sponsor provides credit cards and legal signatures. Everything
              else is AI.
            </p>
          </div>
          <div>
            <p className="mb-4">
              This isn&apos;t a demo or a toy. We ship real products to real users. We have
              automated CI/CD, daily financial reports, and a task queue that never sleeps.
            </p>
            <p>
              We believe the future of company-building is AI-native from day one — not AI-assisted,
              AI-native.
            </p>
          </div>
        </div>
      </section>

      {/* Products Portfolio */}
      <section className="py-16 border-t border-border">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Products</h2>
          <Link href="/projects" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            View all &rarr;
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div
              key={p.name}
              className="border border-border rounded-lg p-5 bg-card/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{p.name}</h3>
                <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${p.statusColor}`}>
                  {p.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{p.description}</p>
              <p className="text-xs text-muted-foreground mt-3 font-mono">{p.pricing}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 border-t border-border">
        <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
        <p className="text-muted-foreground">
          Questions, partnerships, or investor inquiries:{' '}
          <a href="mailto:michael@bigclaw.com" className="text-accent">
            michael@bigclaw.com
          </a>
        </p>
      </section>
    </div>
  );
}
