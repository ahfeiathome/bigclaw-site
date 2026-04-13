'use client';

interface QuickAction {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
}

const ACTIONS: QuickAction[] = [
  { label: 'Preview: GrovaKid', href: 'https://learnie-ai-ten.vercel.app', icon: '📱', external: true },
  { label: 'Preview: FairConnect', href: 'https://fairconnect-xi.vercel.app', icon: '📱', external: true },
  { label: 'Preview: iris-studio', href: 'https://iris-studio.vercel.app', icon: '📱', external: true },
  { label: 'RADAR Dashboard', href: 'https://radar-bigclaw.vercel.app', icon: '📊', external: true },
  { label: 'Morning Report', href: '/dashboard/knowledge/ops/morning-brain', icon: '📋' },
  { label: 'Ideas Backlog', href: '/dashboard/knowledge/knowledge/IDEAS_BACKLOG', icon: '💡' },
  { label: 'Founder Gates', href: '/dashboard/sponsor/todo', icon: '💳' },
];

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map(action => (
        <a
          key={action.label}
          href={action.href}
          target={action.external ? '_blank' : undefined}
          rel={action.external ? 'noopener noreferrer' : undefined}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card/50 text-xs text-foreground no-underline hover:bg-muted/50 hover:border-primary/30 transition-colors"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
          {action.external && <span className="text-[9px] text-muted-foreground">↗</span>}
        </a>
      ))}
    </div>
  );
}
