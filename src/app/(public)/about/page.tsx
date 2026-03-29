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
    description: 'Makes ALL decisions and executes them. CEO + CTO + CIO + COO + CMO + CFO — unified executor. Active 24/7 via 6-hour launchd patrol.',
  },
  {
    role: 'Consultant',
    name: 'Claude Chat',
    model: 'Claude Opus',
    description: 'Strategic advisor — risk analysis, architectural recommendations, quality audits. No decision authority. Writes recommendations; Felix decides whether to act.',
  },
  {
    role: 'Telegram Dispatcher',
    name: 'Mika',
    model: 'Gemini Flash on Pi5',
    description: 'Routes messages, compiles morning brief, dispatches tasks to agents, alerts on system health. 5-minute heartbeat.',
  },
  {
    role: 'Dev Inbox',
    name: 'Koda',
    model: 'Gemini Flash on Pi5',
    description: 'Receives dev requests from Michael via Telegram. Serves as Code CLI activity feed. 30-minute heartbeat.',
  },
  {
    role: 'CFO',
    name: 'Rex',
    model: 'Claude Sonnet via OpenRouter',
    description: 'Tracks API costs, burn rate, free-tier headroom. RADAR trading alerts. Daily finance reports. Privacy Tier 1.',
  },
  {
    role: 'BDM',
    name: 'Sage',
    model: 'DeepSeek V3 via OpenRouter',
    description: 'Weekly market scans, competitive intelligence, opportunity scoring. Proactive exploration of adjacent markets.',
  },
  {
    role: 'CIO',
    name: 'Byte',
    model: 'DeepSeek R1 via OpenRouter',
    description: 'Infrastructure health, security scans, CVE checks, git sync monitoring. Twice-daily comprehensive scans.',
  },
  {
    role: 'CMO',
    name: 'Lumina',
    model: 'Llama 3.3 70B via OpenRouter',
    description: 'SEO strategy, content planning, user acquisition for Learnie AI. Targeting K-5 parent segment.',
  },
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
            <h3 className="font-semibold mb-2">Code CLI reads the board</h3>
            <p className="text-sm text-muted-foreground">
              Code CLI (Felix) reads GitHub Issues, inbox messages, and agent reports — then
              decides the approach and executes autonomously. Product, architecture, deployment, everything.
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
            <h3 className="font-semibold mb-2">8 agents operate 24/7</h3>
            <p className="text-sm text-muted-foreground">
              Mika dispatches, Rex tracks finance, Byte guards security, Sage scouts markets,
              Lumina drives growth. All agents report to the live dashboard.
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

        {/* Architecture note */}
        <div className="mt-6 border border-border rounded-lg p-4 bg-card/30">
          <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">
            M3 Architecture — Phoenix Phase 2
          </p>
          <p className="text-xs text-muted-foreground">
            All 8 agents are active. Felix (Code CLI) makes decisions on Mac via Claude Max.
            6 specialist agents run on Raspberry Pi 5 via OpenRouter. One human provides credit cards and legal signatures.
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
