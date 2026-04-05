import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';

export default function MarketingPage() {
  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Business</h1>
            <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">Lumina (CMO)</span>
          </div>
          <SignalPill label="PRE-LAUNCH" tone="neutral" />
        </div>
        <p className="text-sm text-muted-foreground">Landing page copy, SEO, content pipeline, social strategy</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Content Pipeline">
          <div className="space-y-2 text-sm">
            {[
              { item: 'BigClaw landing page', status: 'Live', done: true },
              { item: 'GrovaKid marketing copy', status: 'Draft', done: false },
              { item: 'Product descriptions', status: 'Pending', done: false },
              { item: 'SEO keyword research', status: 'Pending', done: false },
            ].map((task, i) => (
              <div key={i} className="flex items-center gap-2">
                <StatusDot status={task.done ? 'good' : 'neutral'} size="sm" />
                <span className={task.done ? 'text-foreground' : 'text-muted-foreground'}>{task.item}</span>
                <span className={`text-[10px] font-mono ml-auto ${task.done ? 'text-green-400' : 'text-muted-foreground'}`}>{task.status}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Social Strategy">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <StatusDot status="neutral" size="sm" />
              <span className="text-muted-foreground">No social channels active yet</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Social media strategy activates after first product reaches revenue stage.
              Lumina will generate content plans based on product positioning and target audience.
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="SEO Tracker" className="mb-6">
        <p className="text-sm text-muted-foreground">
          SEO tracking activates after product launch. Current focus: building product features before marketing push.
        </p>
      </SectionCard>
    </div>
  );
}
