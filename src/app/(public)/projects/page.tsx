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
    name: 'GrovaKid',
    status: 'LIVE',
    url: 'https://learnie-ai-ten.vercel.app',
    description:
      'AI-powered worksheet generator for K-5 families. Adaptive difficulty, Common Core aligned, print-and-scan grading — no screen time for your child.',
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
    phase: 'v0.5 — 437+ tests, 10 overnight features shipped. Building toward first paid users.',
  },
  {
    name: 'REHEARSAL',
    status: 'BUILD',
    url: null,
    description:
      'AI-powered interview practice for job seekers. Real-time feedback, domain-specific question banks, confidence tracking.',
    stack: ['React Native', 'Claude AI', 'PostgreSQL', 'Apple IAP'],
    features: [
      'Domain-specific question banks (tech, finance, consulting)',
      'AI real-time feedback on answers',
      '4 practice screens with 80+ questions',
      'Confidence and performance tracking',
    ],
    pricing: 'Apple IAP credits',
    phase: 'v0.1 — PRD complete, Expo/RN scaffold built. Shelved pending FOUNDRY revenue.',
  },
  {
    name: 'iris-studio',
    status: 'BUILD',
    url: 'https://iris-studio.vercel.app',
    description:
      'E-commerce platform for independent creators and small brands. Stripe-powered, fully managed storefront.',
    stack: ['Next.js', 'React', 'Stripe', 'Sanity', 'Vercel'],
    features: [
      'Full storefront with product catalog and checkout',
      'Stripe payment processing',
      'CMS-managed product pages via Sanity',
      '34 tests, all 8 pages built and QA\'d',
    ],
    pricing: 'Stripe per-transaction',
    phase: 'v1.0 — Code-complete. Awaiting DNS cutover and Stripe keys (💳 Michael).',
  },
  {
    name: 'FairConnect',
    status: 'BUILD',
    url: 'https://fairconnect.vercel.app',
    description:
      'Mobile CRM for small event vendors and market sellers. Customer management, sale logging, follow-ups, and booth mode.',
    stack: ['React Native', 'Claude AI', 'PostgreSQL', 'Resend', 'Apple IAP'],
    features: [
      'Customer CRUD with search and filter',
      'Sale logging and follow-up tracking',
      'Quick-capture booth mode for fast check-ins',
      'Email templates via Resend',
      '25 tests, mobile-first UI',
    ],
    pricing: 'Apple IAP',
    phase: 'v1.0 — All 5 P0 features built. PR open, awaiting 🔒 Michael merge.',
  },
  {
    name: 'KeepTrack',
    status: 'BUILD',
    url: 'https://keeptrack-bigclaw.vercel.app',
    description:
      'iOS app for tracking personal collections — physical media, gear, inventory. OCR scanning, iCloud sync, push alerts.',
    stack: ['React Native', 'Claude Vision', 'iCloud', 'StoreKit 2', 'Apple IAP'],
    features: [
      'OCR scanning for quick item capture',
      'iCloud sync across devices',
      'Push notification alerts',
      'StoreKit 2 Pro subscription',
      'Archive-ready build',
    ],
    pricing: 'Apple IAP',
    phase: 'v1.0 — All S7 features built. Blocked: 💳 Apple Developer $99 for TestFlight.',
  },
  {
    name: 'SubCheck',
    status: 'BUILD',
    url: 'https://subcheck-bigclaw.vercel.app',
    description:
      'Subscription tracker that surfaces hidden recurring charges. Bank-agnostic, privacy-first.',
    stack: ['React Native', 'PostgreSQL', 'Apple IAP'],
    features: [
      'Detect and track recurring charges',
      'Monthly spend summary by category',
      'Alerts for price changes',
      'Privacy-first — no bank credentials required',
    ],
    pricing: 'Apple IAP',
    phase: 'v0.1 — Queued after GrovaKid and FairConnect reach TestFlight.',
  },
  {
    name: 'CORTEX',
    status: 'BUILD',
    url: 'https://cortex-bigclaw.vercel.app',
    description:
      'AI knowledge management — capture, organize, and surface information from documents, images, and notes across all sources.',
    stack: ['Next.js', 'Claude AI', 'Claude Vision', 'PostgreSQL'],
    features: [
      'Visual capture lane — photo, screenshot, document ingestion',
      'AI-powered search and synthesis',
      'Knowledge Hub entries with source citations',
      'Unified knowledge base across all input types',
    ],
    pricing: 'Freemium + Apple IAP',
    phase: 'v0.2 — Pivoted to visual/OCR capture. Active development.',
  },
  {
    name: 'RADAR',
    status: 'PAPER',
    url: 'https://radar-bigclaw.vercel.app',
    description:
      'Autonomous AI trading engine with constitution-enforced risk management. 6 strategies, paper trading live.',
    stack: ['Python', 'Alpaca API', 'Finnhub', 'Yahoo Finance'],
    features: [
      'Constitution-enforced trading laws (10 hard-coded guards)',
      '6 strategies: PEAD, Momentum, BTD, Wheel, Iron Condor, Long Call',
      'Regime detection (Bull/Fear/Chop) with VIX monitoring',
      'Per-trade risk capped at 2% of equity, R:R >= 3.0',
      '$100K paper account with live position tracking',
      '314 tests, 50% coverage, kill switch active',
    ],
    pricing: 'Internal — personal brokerage',
    phase: 'v0.5 — Phase 0 gate Apr 18. Paper trading: 30% win rate (threshold: 40%).',
  },
];

const clientWork: Project[] = [
  {
    name: 'fatfrogmodels',
    status: 'LIVE',
    url: 'https://fatfrogmodels.vercel.app',
    description:
      'Scale model e-commerce catalog for a hobbyist brand. Dark motorsport theme with admin panel.',
    stack: ['Next.js', 'React', 'Tailwind CSS', 'Neon', 'Vercel'],
    features: [
      '9 SKU product catalog with filters and detail pages',
      'Dark motorsport aesthetic with Barlow Condensed typography',
      'Password-gated admin panel with CRUD operations',
      'Mobile-responsive catalog browsing',
    ],
    pricing: 'Client project',
    phase: 'v1.0 — Live. DNS cutover pending client decision.',
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
