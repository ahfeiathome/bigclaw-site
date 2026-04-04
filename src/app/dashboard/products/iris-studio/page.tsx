import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';

export default function IrisStudioPage() {
  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">iris-studio</h1>
          <SignalPill label="SPEC" tone="info" />
        </div>
        <p className="text-sm text-muted-foreground">AI art studio & marketplace — Stripe payments</p>
        <p className="text-xs text-muted-foreground mt-1">Company: Axiom · Stage: Launch prep</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Launch Checklist">
          <div className="space-y-2 text-sm">
            {[
              { item: 'Stripe connected', done: false },
              { item: 'DNS pointed', done: false },
              { item: 'Product catalog', done: false },
              { item: 'Payment flow tested', done: false },
              { item: 'Landing page live', done: false },
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
              <StatusDot status="warn" size="sm" />
              <span className="text-foreground">Stripe</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono ml-auto">Not connected</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusDot status="warn" size="sm" />
              <span className="text-foreground">DNS</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono ml-auto">Not pointed</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
