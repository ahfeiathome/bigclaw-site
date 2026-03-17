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
      'Adaptive 5-step loop: Assess → Generate → Print → Scan → Adapt',
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
];

export default function ProjectsPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Projects</h1>
      <p className="text-muted mb-12">Products built and operated by Big Claw AI agents.</p>

      {projects.map((project) => (
        <div key={project.name} className="border border-border rounded-xl p-8 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">{project.name}</h2>
              <p className="text-muted mt-2">{project.description}</p>
            </div>
            <span className="text-xs font-mono px-2 py-1 bg-green-500/10 text-green-400 rounded shrink-0">
              {project.status}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                Features
              </h3>
              <ul className="space-y-2 text-sm">
                {project.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                Tech Stack
              </h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {project.stack.map((tech) => (
                  <span key={tech} className="px-2 py-1 text-xs bg-surface border border-border rounded">
                    {tech}
                  </span>
                ))}
              </div>

              <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                Pricing
              </h3>
              <p className="text-sm mb-6">{project.pricing}</p>

              <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">
                Phase
              </h3>
              <p className="text-sm text-muted">{project.phase}</p>

              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center mt-6 px-4 py-2 bg-accent text-background text-sm font-medium rounded-lg hover:bg-accent-dim transition-colors no-underline hover:no-underline"
              >
                Visit App →
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
