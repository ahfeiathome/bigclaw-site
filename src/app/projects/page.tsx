import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects — Big Claw',
  description: 'Active projects built and operated by Big Claw AI agents.',
};

const projects = [
  {
    name: 'Learnie AI',
    status: 'LIVE',
    url: 'https://learnie-ai-ten.vercel.app',
    description:
      'AI-powered worksheet generator for K-5 families. Adaptive difficulty, Common Core aligned, with scan-and-grade via mobile camera using Claude Vision.',
    stack: ['Next.js 14', 'React 19', 'Claude Haiku', 'PostgreSQL', 'Prisma', 'Auth0', 'Vercel'],
    features: [
      'Adaptive 5-step loop: Assess > Generate > Print > Scan > Adapt',
      'Common Core standards tagged per question',
      'Sub-topic mastery tracking with difficulty curves',
      'Scan paper worksheets with phone camera (Claude Vision)',
      'Cross-grade advancement when 75%+ skills mastered',
      'Score Intelligence with NAEP percentile benchmarks',
      'Parent dashboard with progress heatmaps and goal tracking',
    ],
    pricing: '$19.99/mo per family',
    phase: 'v0.5 — Pre-revenue, building toward first paid users',
  },
  {
    name: 'Fat Frog Models',
    status: 'LIVE',
    url: 'https://fatfrogmodels.vercel.app',
    description:
      'Scale model e-commerce catalog for a hobbyist brand. Dark motorsport theme with admin panel for inventory management.',
    stack: ['Next.js', 'React', 'Tailwind CSS', 'Vercel'],
    features: [
      '5 SKU product catalog with filters and detail pages',
      'Dark motorsport aesthetic with Barlow Condensed typography',
      'Password-gated admin panel with CRUD operations',
      'Image upload and buy link management',
      'Mobile-responsive catalog browsing',
    ],
    pricing: 'Client project',
    phase: 'v1.0 — Live, pending DNS cutover',
  },
  {
    name: 'RADAR',
    status: 'PAPER',
    url: null,
    description:
      'Systematic trading engine with constitution-enforced risk management. Multi-strategy signal feeds with automated execution via Alpaca API.',
    stack: ['Python', 'Alpaca API', 'Finnhub', 'Options Level 3'],
    features: [
      'Constitution-enforced trading laws (10 hard-coded guards)',
      'R:R >= 3.0 required on every trade with mandatory stop/target',
      'Per-trade risk capped at 2% of equity',
      'PEAD signal feed (earnings surprise drift)',
      'Momentum + mean reversion feeds planned',
      '$100K paper account, targeting 20-30% in 6-week paper phase',
      'Congressional copy trading research (Tier 2)',
    ],
    pricing: 'Internal — paper trading phase',
    phase: 'v0.2 — Signal feeds building, paper testing',
  },
];

export default function ProjectsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Projects</h1>
      <p className="text-muted-foreground mb-12">Products built and operated by Big Claw AI agents.</p>

      {projects.map((project) => (
        <div key={project.name} className="border border-border rounded-xl p-8 mb-8 bg-card/50">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{project.name}</h2>
              <p className="text-muted-foreground mt-2">{project.description}</p>
            </div>
            <span className={`text-xs font-mono px-2 py-1 rounded shrink-0 ${
              project.status === 'LIVE'
                ? 'bg-green-500/10 text-green-400'
                : project.status === 'PAPER'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-zinc-500/10 text-zinc-400'
            }`}>
              {project.status}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Features
              </h3>
              <ul className="space-y-2 text-sm">
                {project.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5 shrink-0">&#x2713;</span>
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {project.stack.map((tech) => (
                  <span key={tech} className="px-2 py-1 text-xs bg-secondary border border-border rounded">
                    {tech}
                  </span>
                ))}
              </div>

              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Pricing
              </h3>
              <p className="text-sm mb-6">{project.pricing}</p>

              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Phase
              </h3>
              <p className="text-sm text-muted-foreground">{project.phase}</p>

              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-6 px-4 py-2 bg-accent text-background text-sm font-medium rounded-lg hover:bg-accent-dim transition-colors no-underline hover:no-underline"
                >
                  Visit App &rarr;
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
