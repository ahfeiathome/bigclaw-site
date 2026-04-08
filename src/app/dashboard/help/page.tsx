import { SectionCard } from '@/components/dashboard';

export default function HelpPage() {
  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Dashboard Help</h1>
      <p className="text-sm text-muted-foreground mb-6">What each metric means, where it comes from, and how to interpret it</p>

      {/* KPI Cards Explanation */}
      <SectionCard title="Mission Control — KPI Cards" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2.5 pl-3 pr-2">Card</th>
                <th className="text-left py-2.5 px-2">What It Shows</th>
                <th className="text-left py-2.5 px-2">Data Source</th>
                <th className="text-left py-2.5 px-2">How It&apos;s Calculated</th>
                <th className="text-left py-2.5 pl-2 pr-3">When to Worry</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border/30">
                <td className="py-2.5 pl-3 pr-2 text-foreground font-medium">Company Health</td>
                <td className="py-2.5 px-2 text-muted-foreground">Overall company health score (0-100)</td>
                <td className="py-2.5 px-2 text-muted-foreground font-mono text-[10px]">REGISTRY.md + GitHub Issues API</td>
                <td className="py-2.5 px-2 text-muted-foreground">Start at 100, -10 per P0 issue, +5 per live product</td>
                <td className="py-2.5 pl-2 pr-3 text-red-400">Below 60 = Critical. Multiple P0s dragging score down.</td>
              </tr>
              <tr className="border-b border-border/30 bg-muted/50">
                <td className="py-2.5 pl-3 pr-2 text-foreground font-medium">RADAR Equity</td>
                <td className="py-2.5 px-2 text-muted-foreground">Paper trading portfolio value + daily P/L</td>
                <td className="py-2.5 px-2 text-muted-foreground font-mono text-[10px]">RADAR_DASHBOARD.md (Rex writes 3x daily)</td>
                <td className="py-2.5 px-2 text-muted-foreground">Direct read from Alpaca paper account via Rex</td>
                <td className="py-2.5 pl-2 pr-3 text-amber-400">Equity dropping below $90K or daily P/L consistently negative</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-2.5 pl-3 pr-2 text-foreground font-medium">Open P0s</td>
                <td className="py-2.5 px-2 text-muted-foreground">Critical bugs across ALL repos</td>
                <td className="py-2.5 px-2 text-muted-foreground font-mono text-[10px]">GitHub Issues API (label: P0)</td>
                <td className="py-2.5 px-2 text-muted-foreground">Count of open issues with P0 label across all repos</td>
                <td className="py-2.5 pl-2 pr-3 text-red-400">Any P0 &gt; 0 needs attention. P0 = blocking or broken.</td>
              </tr>
              <tr className="border-b border-border/30 bg-muted/50">
                <td className="py-2.5 pl-3 pr-2 text-foreground font-medium">Monthly Burn</td>
                <td className="py-2.5 px-2 text-muted-foreground">Estimated monthly spend across all services</td>
                <td className="py-2.5 px-2 text-muted-foreground font-mono text-[10px]">FINANCE.md + DAILY_COSTS.md</td>
                <td className="py-2.5 px-2 text-muted-foreground">Daily spend × 30. Includes OpenRouter, Vercel, Neon, agents.</td>
                <td className="py-2.5 pl-2 pr-3 text-amber-400">Above $100/mo = review costs. Currently ~$55/mo (low).</td>
              </tr>
              <tr className="border-b border-border/30">
                <td className="py-2.5 pl-3 pr-2 text-foreground font-medium">Revenue</td>
                <td className="py-2.5 px-2 text-muted-foreground">Total MRR across all products</td>
                <td className="py-2.5 px-2 text-muted-foreground font-mono text-[10px]">Hardcoded (no revenue products yet)</td>
                <td className="py-2.5 px-2 text-muted-foreground">$0 until first product has paying customers</td>
                <td className="py-2.5 pl-2 pr-3 text-muted-foreground">Expected to be $0 during Phase 0. Not a concern yet.</td>
              </tr>
              <tr className="border-b border-border/30 bg-muted/50">
                <td className="py-2.5 pl-3 pr-2 text-foreground font-medium">Agents</td>
                <td className="py-2.5 px-2 text-muted-foreground">Pi5 agents: active / total</td>
                <td className="py-2.5 px-2 text-muted-foreground font-mono text-[10px]">BANDWIDTH.md (agent load table)</td>
                <td className="py-2.5 px-2 text-muted-foreground">Count agents with status &quot;busy&quot; vs total roster</td>
                <td className="py-2.5 pl-2 pr-3 text-red-400">0/6 = all agents idle (may indicate Pi5 is down)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Color Coding */}
      <SectionCard title="Color Coding" className="mb-6">
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> <span className="text-foreground font-medium">Green</span> <span className="text-muted-foreground">— Healthy. Within expected range.</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> <span className="text-foreground font-medium">Amber</span> <span className="text-muted-foreground">— Warning. Needs attention but not critical.</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> <span className="text-foreground font-medium">Red</span> <span className="text-muted-foreground">— Critical. Action required.</span></div>
        </div>
      </SectionCard>

      {/* PDLC Stages */}
      <SectionCard title="PDLC Stages (Product Development Lifecycle)" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2 pl-3 pr-2">Stage</th>
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 pl-2 pr-3">What It Means</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['S1', 'DISCOVER', 'Competitive research complete. Go/no-go decision made.'],
                ['S2', 'DEFINE', 'Market Requirements Document (MRD) written. Problem and positioning defined.'],
                ['S3', 'DESIGN', 'Product Requirements Document (PRD) written. Architecture decided.'],
                ['S4', 'BUILD', 'Code is being written. Features in development.'],
                ['S5', 'HARDEN', 'Polish, testing, App Store readiness.'],
                ['S6', 'PILOT', 'TestFlight / beta with real users.'],
                ['S7', 'LAUNCH', 'Production. Payment live. Real customers.'],
                ['S8', 'GROW', 'Revenue growth, iteration, monitoring.'],
              ].map(([stage, name, desc], i) => (
                <tr key={stage} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-2 pl-3 pr-2 font-mono font-bold text-primary">{stage}</td>
                  <td className="py-2 px-2 text-foreground font-medium">{name}</td>
                  <td className="py-2 pl-2 pr-3 text-muted-foreground">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* RADAR trading controls live in the RADAR app (radar-bigclaw.vercel.app) */}

      {/* Data Freshness */}
      <SectionCard title="Data Freshness" className="mb-6">
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>The dashboard reads markdown files from GitHub via API. Data is as fresh as the last <code className="font-mono text-primary">git push</code>.</p>
          <p>Pages cache for 5 minutes (Next.js revalidation). Hard refresh (<kbd className="px-1 py-0.5 rounded bg-muted text-foreground text-[10px]">Cmd+Shift+R</kbd>) forces a fresh fetch.</p>
          <p>If data looks stale, check: (1) was the source file updated? (2) was it pushed to GitHub? (3) wait 5 min for cache.</p>
        </div>
      </SectionCard>
    </div>
  );
}
