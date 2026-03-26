import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Projects — Big Claw',
  description: 'Active projects built and operated by Big Claw AI agents.',
};

interface Project {
  name: string;
  status: string;
  url: string | null;
  description: string;
  stack: string[];
  features: string[];
  pricing: string;
  phase: string;
}

const products: Project[] = [
  {
    name: 'Learnie AI',
    status: 'LIVE',
    url: 'https://learnie-ai-ten.vercel.app',
    description:
      'AI-powered worksheet generator for K-5 families. Print, complete by hand, scan to grade — no screen time for your child.',
    stack: ['Next.js', 'React', 'Claude AI', 'PostgreSQL', 'Prisma', 'Auth0', 'Vercel'],
    features: [
      'Adaptive 5-step loop: Assess > Generate > Print > Scan > Adapt',
      'Common Core standards tagged per question',
      'Sub-topic mastery tracking with difficulty curves',
      'Scan paper worksheets with phone camera (Claude Vision)',
      'NAEP national percentile benchmarks',
      'Parent dashboard with progress heatmaps and goal tracking',
    ],
    pricing: '$19.99/mo per family',
    phase: 'v0.5 — Pre-revenue, building toward first paid users',
  },
  {
    name: 'VERDE (PlantDoc)',
    status: 'BUILD',
    url: null,
    description:
      'AI plant doctor — diagnose plant problems via photo, get step-by-step treatment plans, track your plant collection with watering reminders.',
    stack: ['React Native', 'Claude Vision', 'PostgreSQL', 'Apple IAP'],
    features: [
      'Photo diagnosis via Claude Vision — point camera at sick plant',
      'AI-generated personalized treatment plans',
      'Plant collection tracker with care history',
      'Push notification watering reminders',
      'Offline-capable core features',
    ],
    pricing: '$3.99/mo',
    phase: 'v0.3 — 3 P0 gaps closed, ready for TestFlight',
  },
  {
    name: 'VAULT (ReceiptSnap)',
    status: 'BUILD',
    url: null,
    description:
      'Personal spending intelligence — scan receipts, track spending patterns, get AI insights on where your money goes. No bank account required.',
    stack: ['React Native', 'Claude Vision', 'PostgreSQL', 'Apple IAP'],
    features: [
      'Scan receipts with phone camera — instant categorization',
      'Spending pattern analysis with monthly trends',
      'Category breakdowns and budget alerts',
      'CSV/PDF export for tax preparation',
      'Privacy-first — no bank account connection needed',
    ],
    pricing: '$4.99/mo',
    phase: 'v0.1 — Queued after VERDE ships',
  },
  {
    name: 'RADAR',
    status: 'PAPER',
    url: null,
    description:
      'Autonomous AI trading engine with constitution-enforced risk management. 6 strategies, 14 positions, paper trading live.',
    stack: ['Python', 'Alpaca API', 'Finnhub', 'Yahoo Finance', 'Options Level 3'],
    features: [
      'Constitution-enforced trading laws (10 hard-coded guards)',
      '6 strategies: PEAD, Momentum, BTD, Wheel, Iron Condor, Long Call',
      'Regime detection (Bull/Fear/Chop) with VIX monitoring',
      'Macro analysis + sector rotation + fundamental screening',
      'Per-trade risk capped at 2% of equity, R:R >= 3.0',
      '$100K paper account with live position tracking',
    ],
    pricing: 'Internal',
    phase: 'v0.5 — All signal feeds active, paper trading live',
  },
  {
    name: 'CORTEX',
    status: 'INTERNAL',
    url: null,
    description:
      'Knowledge management tool — capture, organize, and surface information across all sources. Built for The Firm\'s internal operations.',
    stack: ['Next.js', 'Claude AI', 'PostgreSQL'],
    features: [
      'Unified knowledge base across documents and notes',
      'AI-powered search and synthesis',
      'Knowledge Hub entries with source citations',
    ],
    pricing: 'Internal',
    phase: 'v1.0 — In use internally',
  },
];

const clientWork: Project[] = [
  {
    name: 'Fat Frog Models',
    status: 'LIVE',
    url: 'https://fatfrogmodels.vercel.app',
    description:
      'Scale model e-commerce catalog for a hobbyist brand. Dark motorsport theme with admin panel.',
    stack: ['Next.js', 'React', 'Tailwind CSS', 'Vercel'],
    features: [
      '5 SKU product catalog with filters and detail pages',
      'Dark motorsport aesthetic with Barlow Condensed typography',
      'Password-gated admin panel with CRUD operations',
      'Mobile-responsive catalog browsing',
    ],
    pricing: 'Client project',
    phase: 'v1.0 — Live, pending DNS cutover',
  },
];

function statusColor(status: string): string {
  switch (status) {
    case 'LIVE': return 'bg-green-500/10 text-green-500';
    case 'BUILD': return 'bg-blue-500/10 text-blue-500';
    case 'PAPER': return 'bg-amber-500/10 text-amber-500';
    default: return 'bg-gray-500/10 text-gray-500';
  }
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="border border-border rounded-xl p-8 mb-8 bg-card/50">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-muted-foreground mt-2">{project.description}</p>
        </div>
        <span className={`text-xs font-mono px-2 py-1 rounded shrink-0 ${statusColor(project.status)}`}>
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
                <span className="text-green-500 mt-0.5 shrink-0">&#x2713;</span>
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
  );
}

export default function ProjectsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Projects</h1>
      <p className="text-muted-foreground mb-12">Products built and operated by Big Claw AI agents.</p>

      {products.map((project) => (
        <ProjectCard key={project.name} project={project} />
      ))}

      <h2 className="text-2xl font-bold mt-16 mb-8">Client Work</h2>
      {clientWork.map((project) => (
        <ProjectCard key={project.name} project={project} />
      ))}
    </div>
  );
}
