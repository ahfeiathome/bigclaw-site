import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About — Big Claw',
  description: 'About Big Claw — an AI-native company with AI agents as the executive team.',
};

const activeTeam = [
  {
    role: 'CEO + all C-suite',
    name: 'Code CLI (Felix)',
    model: 'Claude Opus on Mac',
    description: 'Makes ALL decisions and executes them. CEO + CTO + CIO + COO + CMO + CFO — unified executor. Active 24/7 via 6-hour cron patrol.',
  },
  {
    role: 'Telegram Dispatcher',
    name: 'Mika',
    model: 'Haiku on Pi5',
    description: 'Routes messages, compiles morning brief, alerts on system health. 5-minute heartbeat. Runs 24/7 on Raspberry Pi 5.',
  },
  {
    role: 'Dev Inbox',
    name: 'Koda',
    model: 'Sonnet on Pi5',
    description: 'Receives dev requests from Michael via Telegram. Serves as Code CLI activity feed. 30-minute heartbeat.',
  },
];

const frozenAgents = [
  { name: 'Rex', role: 'CFO' },
  { name: 'Sage', role: 'BDM' },
  { name: 'Byte', role: 'CIO' },
  { name: 'Lumina', role: 'CMO' },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">About Big Claw</h1>
      <p className="text-muted-foreground mb-12 max-w-2xl">
        Big Claw is an AI-native company. One human sponsor provides credit cards and
        legal signatures. Everything else — code, strategy, finance, marketing, operations — is
        decided and executed by AI agents.
      </p>

      {/* How it works */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-6">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="border border-border rounded-lg p-6 bg-card/50">
            <div className="text-accent text-2xl mb-3">01</div>
            <h3 className="font-semibold mb-2">Code CLI reads the queue</h3>
            <p className="text-sm text-muted-foreground">
              Code CLI (Felix) reads CHECKPOINT.md, decides the approach, and executes
              autonomously — product decisions, architecture, deployment, everything.
            </p>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card/50">
            <div className="text-accent text-2xl mb-3">02</div>
            <h3 className="font-semibold mb-2">Builds and deploys</h3>
            <p className="text-sm text-muted-foreground">
              Code CLI writes code, runs tests, deploys to production, and verifies the live
              app — all without human intervention. Constitution guards enforce quality.
            </p>
          </div>
          <div className="border border-border rounded-lg p-6 bg-card/50">
            <div className="text-accent text-2xl mb-3">03</div>
            <h3 className="font-semibold mb-2">Agents monitor 24/7</h3>
            <p className="text-sm text-muted-foreground">
              Mika dispatches tasks, monitors system health, and compiles morning briefs.
              All agents write reports that feed into the live dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Active Team */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold mb-8">The Team</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {activeTeam.map((member) => (
            <div
              key={member.name}
              className="border border-border rounded-lg p-5 hover:border-primary/30 transition-colors bg-card/50"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-mono px-2 py-0.5 bg-primary/10 text-primary rounded">
                  {member.role}
                </span>
                <span className="font-semibold">{member.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">{member.model}</span>
              </div>
              <p className="text-sm text-muted-foreground">{member.description}</p>
            </div>
          ))}
          <div className="border border-border rounded-lg p-5 border-dashed bg-card/50">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-mono px-2 py-0.5 bg-foreground/10 text-foreground rounded">
                Sponsor
              </span>
              <span className="font-semibold">Michael Liu</span>
              <span className="text-xs text-muted-foreground ml-auto">Human</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Provides credit cards and legal signatures. Not in the operational or product flow.
            </p>
          </div>
        </div>

        {/* Frozen agents */}
        <div className="mt-6 border border-border rounded-lg p-4 bg-card/30">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            Frozen agents (configs preserved)
          </p>
          <div className="flex flex-wrap gap-3">
            {frozenAgents.map((a) => (
              <span key={a.name} className="text-xs text-muted-foreground">
                {a.name} ({a.role})
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Code CLI absorbs all their roles in M2 architecture.
          </p>
        </div>
      </section>

      {/* Human involvement */}
      <section>
        <h2 className="text-2xl font-bold mb-6">What Requires a Human</h2>
        <div className="border border-border rounded-lg p-6 bg-card/50">
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-lg">&#x1F4B3;</span>
              <h3 className="font-semibold mt-2 mb-1">Money</h3>
              <p className="text-muted-foreground">Credit cards, paid accounts, billing decisions</p>
            </div>
            <div>
              <span className="text-lg">&#x2696;&#xFE0F;</span>
              <h3 className="font-semibold mt-2 mb-1">Legal</h3>
              <p className="text-muted-foreground">Terms of service, contracts, entity decisions</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-6 pt-4 border-t border-border">
            Everything else — product decisions, code, deploys, testing, monitoring, reporting,
            pricing, priority — is fully autonomous. Michael sees results on the dashboard.
          </p>
        </div>
      </section>
    </div>
  );
}
