import { fetchSDLCGatesMatrix } from '@/lib/github';
import { SectionCard, SignalPill } from '@/components/dashboard';
import { extractSection } from '../helpers';

interface ActionItem {
  priority: string;
  text: string;
}

function parseActions(content: string): ActionItem[] {
  const section = extractSection(content, 'Priority Actions');
  const items: ActionItem[] = [];

  for (const line of section.split('\n')) {
    const match = line.match(/^\d+\.\s+\*\*(P\d):\*\*\s+(.+)/);
    if (match) {
      items.push({ priority: match[1], text: match[2] });
    }
  }

  return items;
}

export default async function SDLCActionsPage() {
  const gatesMd = await fetchSDLCGatesMatrix();
  const actions = gatesMd ? parseActions(gatesMd) : [];

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>SDLC — Improvement Actions</h1>
      <p className="text-sm text-muted-foreground mb-6">Priority list from gates matrix assessment</p>

      {actions.length > 0 ? (
        <SectionCard title={`${actions.length} Actions`}>
          <div className="space-y-3">
            {actions.map((action, i) => {
              const tone = action.priority === 'P0' ? 'error' as const : action.priority === 'P1' ? 'warning' as const : 'neutral' as const;
              return (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
                  <span className="shrink-0 mt-0.5">
                    <SignalPill label={action.priority} tone={tone} />
                  </span>
                  <span className="text-sm text-foreground">{action.text}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ) : (
        <p className="text-sm text-muted-foreground">No action items available.</p>
      )}
    </div>
  );
}
