import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';

export default function FatfrogmodelsPage() {
  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">fatfrogmodels</h1>
          <SignalPill label="LIVE" tone="success" />
        </div>
        <p className="text-sm text-muted-foreground">Scale model e-commerce — Stripe payments</p>
        <p className="text-xs text-muted-foreground mt-1">Company: Axiom · Stage: Launched</p>
        <a href="https://fatfrogmodels.vercel.app" target="_blank" rel="noopener noreferrer" className="text-xs text-primary no-underline hover:underline">Live site →</a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Launch Checklist">
          <div className="space-y-2 text-sm">
            {[
              { item: 'Stripe connected', done: true },
              { item: 'DNS pointed', done: true },
              { item: 'Product catalog', done: true },
              { item: 'Payment flow tested', done: true },
              { item: 'Landing page live', done: true },
            ].map((check, i) => (
              <div key={i} className="flex items-center gap-2">
                <StatusDot status={check.done ? 'good' : 'neutral'} size="sm" />
                <span className={check.done ? 'text-foreground' : 'text-muted-foreground'}>{check.item}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Status">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <StatusDot status="good" size="sm" />
              <span className="text-foreground">Stripe</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-mono ml-auto">Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status="good" size="sm" />
              <span className="text-foreground">Vercel</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 font-mono ml-auto">Deployed</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
