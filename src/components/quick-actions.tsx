'use client';

interface QuickAction {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
}

const ACTIONS: QuickAction[] = [
  { label: 'Open PRs', href: 'https://github.com/pulls?q=is%3Aopen+is%3Apr+org%3Aahfeiathome', icon: '📋', external: true },
  { label: 'GrovaKid Issues', href: 'https://github.com/ahfeiathome/learnie-ai/issues', icon: '🎓', external: true },
  { label: 'RADAR Dashboard', href: 'https://radar-bigclaw.vercel.app', icon: '📈', external: true },
  { label: 'Vercel Deploys', href: 'https://vercel.com/ahfeiathomes-projects', icon: '▲', external: true },
  { label: 'Sponsor Gates', href: '/dashboard/sponsor/todo', icon: '💳' },
  { label: 'Access Control', href: '/dashboard/settings/users', icon: '👥' },
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card/50 text-xs text-foreground no-underline hover:bg-muted/50 hover:border-primary/30 transition-colors"
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
          {action.external && <span className="text-[9px] text-muted-foreground">↗</span>}
        </a>
      ))}
    </div>
  );
}
