import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Big Claw',
  description: 'About Big Claw — an AI-native company with AI agents as the executive team.',
};

const team = [
  {
    role: 'CEO',
    name: 'Claude Chat',
    model: 'Claude Opus',
    description: 'Strategy, product decisions, governance, investor comms. Writes specs and coordinates all agents.',
  },
  {
    role: 'CTO',
    name: 'Claude Code',
    model: 'Claude Opus',
    description: 'Architecture decisions, code review, technical strategy. Decides HOW to implement.',
  },
  {
    role: 'CDO',
    name: 'Koda',
    model: 'Claude Code CLI',
    description: 'Writes and deploys all production code. Runs tests, deploys to Vercel, verifies live. Fully autonomous builder.',
  },
  {
    role: 'COO',
    name: 'Mika',
    model: 'Raspberry Pi 5',
    description: 'Manages agent bandwidth, dispatches tasks, monitors system health. Updates every 5 minutes.',
  },
  {
    role: 'CFO',
    name: 'Rex',
    model: 'Raspberry Pi 5',
    description: 'Daily financial reports, cost tracking, burn rate alerts. Monitors all service spend.',
  },
  {
    role: 'BDM',
    name: 'Sage',
    model: 'Raspberry Pi 5',
    description: 'Market scanning, venture proposals, competitive analysis. Weekly opportunity pipeline.',
  },
  {
    role: 'CMO',
    name: 'Lumina',
    model: 'Raspberry Pi 5',
    description: 'Marketing strategy, content planning, growth metrics. Tracks user acquisition.',
  },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">About Big Claw</h1>
      <p className="text-muted mb-12 max-w-2xl">
        Big Claw is an AI-native company. One human founder provides judgment, credit cards, and
        legal signatures. Everything else — code, strategy, finance, marketing, operations — is
        executed by AI agents.
      </p>

      {/* How it works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-border rounded-lg p-6">
            <div className="text-accent text-2xl mb-3">01</div>
            <h3 className="font-semibold mb-2">CEO writes specs</h3>
            <p className="text-sm text-muted">
              The CEO (Claude Chat) analyzes market data, writes product specs, and creates
              checkpoint tasks for the engineering team.
            </p>
          </div>
          <div className="border border-border rounded-lg p-6">
            <div className="text-accent text-2xl mb-3">02</div>
            <h3 className="font-semibold mb-2">CDO builds autonomously</h3>
            <p className="text-sm text-muted">
              The CDO (Claude Code) picks up tasks, writes code, runs tests, deploys to production,
              and verifies the live app — all without human intervention.
            </p>
          </div>
          <div className="border border-border rounded-lg p-6">
            <div className="text-accent text-2xl mb-3">03</div>
            <h3 className="font-semibold mb-2">Agents coordinate</h3>
            <p className="text-sm text-muted">
              CFO tracks spend, COO manages bandwidth, BDM scans markets, CMO plans growth. All
              agents write reports that feed into the dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* The Team */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8">The Team</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {team.map((member) => (
            <div
              key={member.role}
              className="border border-border rounded-lg p-5 hover:border-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono px-2 py-0.5 bg-accent/10 text-accent rounded">
                  {member.role}
                </span>
                <span className="font-semibold">{member.name}</span>
                <span className="text-xs text-muted ml-auto">{member.model}</span>
              </div>
              <p className="text-sm text-muted">{member.description}</p>
            </div>
          ))}
          <div className="border border-border rounded-lg p-5 border-dashed">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono px-2 py-0.5 bg-foreground/10 text-foreground rounded">
                Founder
              </span>
              <span className="font-semibold">Michael Liu</span>
              <span className="text-xs text-muted ml-auto">Human</span>
            </div>
            <p className="text-sm text-muted">
              Provides judgment, credit cards, and legal signatures. Types &quot;next task&quot; to
              keep the machine running.
            </p>
          </div>
        </div>
      </section>

      {/* Human involvement */}
      <section>
        <h2 className="text-2xl font-bold mb-6">What Requires a Human</h2>
        <div className="border border-border rounded-lg p-6">
          <div className="grid md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-lg">💳</span>
              <h3 className="font-semibold mt-2 mb-1">Money</h3>
              <p className="text-muted">Credit cards, paid accounts, billing decisions</p>
            </div>
            <div>
              <span className="text-lg">⚖️</span>
              <h3 className="font-semibold mt-2 mb-1">Legal</h3>
              <p className="text-muted">Terms of service, contracts, entity decisions</p>
            </div>
            <div>
              <span className="text-lg">🧠</span>
              <h3 className="font-semibold mt-2 mb-1">Judgment</h3>
              <p className="text-muted">Product pivots, pricing, scope decisions</p>
            </div>
          </div>
          <p className="text-muted text-sm mt-6 pt-4 border-t border-border">
            Everything else — code, deploys, testing, monitoring, reporting — is fully autonomous.
          </p>
        </div>
      </section>
    </div>
  );
}
