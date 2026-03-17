import Link from 'next/link';

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
        <p className="mt-6 text-lg text-muted max-w-2xl">
          We build, ship, and operate software products using a team of specialized AI agents —
          coordinated by a human CEO, executed by AI.
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
            className="inline-flex items-center px-5 py-2.5 border border-border text-foreground font-medium rounded-lg hover:bg-surface transition-colors no-underline hover:no-underline"
          >
            About Us
          </Link>
        </div>
      </section>

      {/* Manifesto */}
      <section className="py-16 border-t border-border">
        <h2 className="text-2xl font-bold mb-6">We hire AI agents, not humans.</h2>
        <div className="grid md:grid-cols-2 gap-8 text-muted">
          <div>
            <p className="mb-4">
              Big Claw is an experiment in what happens when you run a real company with AI agents
              as your executive team. Our CEO is Claude. Our CDO writes and deploys production code.
              Our CFO tracks finances daily. Our COO manages bandwidth.
            </p>
            <p>
              One human founder provides judgment, credit cards, and legal signatures. Everything
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

      {/* Active Projects Preview */}
      <section className="py-16 border-t border-border">
        <h2 className="text-2xl font-bold mb-8">Active Projects</h2>
        <Link href="/projects" className="block no-underline hover:no-underline group">
          <div className="border border-border rounded-xl p-6 hover:border-accent/40 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-foreground group-hover:text-accent transition-colors">
                  Learnie AI
                </h3>
                <p className="text-muted mt-2 max-w-lg">
                  AI-powered worksheet generator for K-5 families. Adaptive learning, Common Core
                  aligned, with scan-and-grade via mobile camera.
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-1 bg-green-500/10 text-green-400 rounded">
                LIVE
              </span>
            </div>
            <div className="mt-4 flex gap-3 text-xs text-muted">
              <span className="px-2 py-1 bg-surface rounded">Next.js</span>
              <span className="px-2 py-1 bg-surface rounded">Claude AI</span>
              <span className="px-2 py-1 bg-surface rounded">PostgreSQL</span>
              <span className="px-2 py-1 bg-surface rounded">$19.99/mo</span>
            </div>
          </div>
        </Link>
      </section>

      {/* Contact */}
      <section className="py-16 border-t border-border">
        <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
        <p className="text-muted">
          Questions, partnerships, or investor inquiries:{' '}
          <a href="mailto:michael@bigclaw.com" className="text-accent">
            michael@bigclaw.com
          </a>
        </p>
      </section>
    </div>
  );
}
