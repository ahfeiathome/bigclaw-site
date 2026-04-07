import { fetchSDLCGatesMatrix } from '@/lib/github';
import { SectionCard, SignalPill } from '@/components/dashboard';
import { extractSection } from '../helpers';

export default async function SDLCActionsPage() {
  const gatesMd = await fetchSDLCGatesMatrix();

  const actions: { priority: string; text: string }[] = [];
  if (gatesMd) {
    const section = extractSection(gatesMd, 'Priority Actions');
    for (const line of section.split('\n')) {
      const match = line.match(/^\d+\.\s+\*\*(P\d):\*\*\s+(.+)/);
      if (match) actions.push({ priority: match[1], text: match[2] });
    }
  }

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>SDLC — Actions</h1>
      <p className="text-sm text-muted-foreground mb-6">Priority improvement actions from gates audit</p>

      {actions.length > 0 ? (
        <SectionCard title={`Improvement Actions (${actions.length})`}>
          <div className="space-y-3">
            {actions.map((action, i) => {
              const tone = action.priority === 'P0' ? 'error' as const : action.priority === 'P1' ? 'warning' as const : 'neutral' as const;
              return (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                  <SignalPill label={action.priority} tone={tone} />
                  <span className="text-sm text-foreground">{action.text}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : (
        <p className="text-sm text-muted-foreground">No improvement actions found.</p>
      )}
    </div>
  );
}
