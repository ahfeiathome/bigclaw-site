// Shared Dashboard Components — dark operator terminal design system
// Dark mode: card backgrounds, subtle borders, color-coded status, font-mono numbers

import React from 'react';

// ─── StatusDot ──────────────────────────────────────────────────────────────

export function StatusDot({ status, size = 'md' }: {
  status: 'good' | 'warn' | 'bad' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeMap = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
  const colorMap = {
    good: 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]',
    warn: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.3)]',
    bad: 'bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.4)]',
    neutral: 'bg-zinc-500',
  };
  return <span className={`inline-block rounded-full shrink-0 ${sizeMap[size]} ${colorMap[status]}`} />;
}

// ─── MetricCard ─────────────────────────────────────────────────────────────

export function MetricCard({ label, value, subtitle, icon, trend, semantic }: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'flat';
  semantic?: 'success' | 'warning' | 'danger';
}) {
  const trendIcon = trend === 'up' ? '\u2197' : trend === 'down' ? '\u2198' : trend === 'flat' ? '\u2192' : null;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-500';

  const borderClass = semantic === 'success'
    ? 'border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]'
    : semantic === 'warning'
    ? 'border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
    : semantic === 'danger'
    ? 'border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
    : 'border-border';

  return (
    <div className={`animate-fade-in rounded-xl bg-card border p-4 transition-all duration-200 ${borderClass}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">{label}</span>
        {icon && <div className="w-4 h-4 text-muted-foreground">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono text-foreground">{value}</span>
        {trendIcon && <span className={`text-lg ${trendColor}`}>{trendIcon}</span>}
      </div>
      {subtitle && <span className="text-xs text-muted-foreground mt-0.5 block">{subtitle}</span>}
    </div>
  );
}

// ─── QuickActionsBar ───────────────────────────────────────────────────────

export function QuickActionsBar() {
  const actions = [
    { label: 'GitHub Board', href: 'https://github.com/users/ahfeiathome/projects/1', icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
        <rect x="2" y="1" width="12" height="14" rx="1.5" /><path d="M5 5h6M5 8h6M5 11h3" />
      </svg>
    )},
    { label: 'GrovaKid Live', href: 'https://learnie-ai-ten.vercel.app', icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
        <circle cx="8" cy="8" r="6" /><path d="M2 8h12M8 2c-2 2-2 10 0 12M8 2c2 2 2 10 0 12" />
      </svg>
    )},
    { label: 'BigClaw Live', href: 'https://bigclaw-site.vercel.app', icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
        <path d="M2 3h12v9H2z" /><path d="M5 12v2M11 12v2M4 14h8" />
      </svg>
    )},
    { label: 'Telegram', href: 'https://web.telegram.org', icon: (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="w-4 h-4">
        <path d="M1 7.5l14-5.5-4 13-3.5-5.5L1 7.5z" /><path d="M7.5 9.5L15 2" />
      </svg>
    )},
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
      {actions.map((a) => (
        <a
          key={a.label}
          href={a.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border p-3 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 no-underline group"
        >
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
            <span className="text-muted-foreground group-hover:text-primary transition-colors">{a.icon}</span>
          </div>
          <span className="text-xs font-medium text-foreground">{a.label}</span>
        </a>
      ))}
    </div>
  );
}

// ─── AgentStatusPanel ──────────────────────────────────────────────────────

interface AgentInfo {
  name: string;
  role: string;
  model: string;
  heartbeat: string;
  status: 'online' | 'idle' | 'offline';
}

export function AgentStatusPanel({ agents }: { agents?: AgentInfo[] }) {
  const defaultAgents: AgentInfo[] = [
    { name: 'Mika', role: 'Dispatcher', model: 'Gemini Flash', heartbeat: '5 min', status: 'online' },
    { name: 'Koda', role: 'Dev Inbox', model: 'Gemini Flash', heartbeat: '30 min', status: 'online' },
    { name: 'Rex', role: 'CFO', model: 'Sonnet 4', heartbeat: 'Daily', status: 'online' },
    { name: 'Sage', role: 'BDM', model: 'DeepSeek V3', heartbeat: 'Weekly', status: 'idle' },
    { name: 'Byte', role: 'CIO', model: 'DeepSeek R1', heartbeat: '12h', status: 'online' },
    { name: 'Lumina', role: 'CMO', model: 'Llama 3.3', heartbeat: 'Weekly', status: 'idle' },
  ];

  const agentList = agents || defaultAgents;

  return (
    <SectionCard title="Pi5 Agents">
      <div className="space-y-3">
        {agentList.map((agent) => (
          <div key={agent.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <StatusDot
                status={agent.status === 'online' ? 'good' : agent.status === 'idle' ? 'neutral' : 'bad'}
                size="sm"
              />
              <div>
                <span className="text-sm font-medium text-foreground">{agent.name}</span>
                <span className="text-xs text-muted-foreground ml-1.5">{agent.role}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span>{agent.model}</span>
              <span className="text-muted-foreground/50">{agent.heartbeat}</span>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── HealthRow ──────────────────────────────────────────────────────────────

export function HealthRow({ label, value, status, bar, icon }: {
  label: string;
  value: string;
  status: 'good' | 'warn' | 'bad';
  bar?: number;
  icon?: React.ReactNode;
}) {
  const barColor = bar != null
    ? bar > 80 ? 'bg-red-500' : bar > 60 ? 'bg-amber-500' : 'bg-green-500'
    : '';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot status={status} size="sm" />
          {icon && <span className="w-4 h-4 text-muted-foreground">{icon}</span>}
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <span className="text-sm font-medium font-mono text-foreground">{value}</span>
      </div>
      {bar != null && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full animate-bar-fill ${barColor}`}
            style={{ width: `${Math.min(bar, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── SignalPill ──────────────────────────────────────────────────────────────

const pillToneMap = {
  success: 'bg-green-500/10 text-green-400 border border-green-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  error:   'bg-red-500/10 text-red-400 border border-red-500/20',
  info:    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  neutral: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20',
} as const;

const pillDotMap = {
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-zinc-500',
} as const;

export function SignalPill({ label, tone = 'neutral' }: {
  label: string;
  tone?: keyof typeof pillToneMap;
  pulse?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${pillToneMap[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${pillDotMap[tone]}`} />
      {label}
    </span>
  );
}

// ─── SectionCard ────────────────────────────────────────────────────────────

export function SectionCard({ title, children, className, action }: {
  title: string;
  children: React.ReactNode;
  accent?: string;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`animate-fade-in rounded-xl bg-card border border-border ${className || ''}`}>
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          {action && <div>{action}</div>}
        </div>
      </div>
      <div className="px-4 pb-4">
        {children}
      </div>
    </div>
  );
}

// ─── TaskFlowWidget ────────────────────────────────────────────────────────

interface TaskFlowColumn {
  label: string;
  count: number;
  items: { repo: string; number: number; title: string; labels: string[]; url: string }[];
}

export function TaskFlowWidget({ columns }: { columns: TaskFlowColumn[] }) {
  const priorityColor = (labels: string[]) => {
    if (labels.includes('P0')) return 'border-l-red-500';
    if (labels.includes('P1')) return 'border-l-amber-500';
    if (labels.includes('P2')) return 'border-l-yellow-500';
    return 'border-l-zinc-500';
  };

  const columnHeaderColor: Record<string, string> = {
    'Todo': 'text-blue-400',
    'In Progress': 'text-amber-400',
    'Done': 'text-green-400',
    'Backlog': 'text-zinc-400',
  };

  return (
    <SectionCard title="Task Flow">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {columns.map((col) => (
          <div key={col.label}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold uppercase tracking-wide ${columnHeaderColor[col.label] || 'text-muted-foreground'}`}>
                {col.label}
              </span>
              <span className="text-xs font-mono font-bold text-foreground">{col.count}</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {col.items.slice(0, 8).map((item) => (
                <a
                  key={`${item.repo}-${item.number}`}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block rounded-lg border-l-2 ${priorityColor(item.labels)} bg-muted/30 px-2 py-1.5 hover:bg-muted transition-colors no-underline`}
                >
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{item.repo}</span>
                    <span className="text-[10px] text-muted-foreground">#{item.number}</span>
                  </div>
                  <p className="text-xs text-foreground truncate">{item.title}</p>
                </a>
              ))}
              {col.items.length === 0 && (
                <span className="text-[10px] text-muted-foreground italic">None</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── EventStreamWidget ─────────────────────────────────────────────────────

interface EventEntry {
  repo: string;
  number: number;
  title: string;
  action: 'opened' | 'closed' | 'updated';
  timestamp: string;
  url: string;
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function EventStreamWidget({ events }: { events: EventEntry[] }) {
  const actionColor: Record<string, string> = {
    opened: 'text-green-400',
    closed: 'text-blue-400',
    updated: 'text-zinc-400',
  };

  const actionIcon: Record<string, string> = {
    opened: '+',
    closed: '\u2713',
    updated: '\u2022',
  };

  return (
    <SectionCard title="Event Stream">
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity</p>
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto">
          {events.map((ev, i) => (
            <a
              key={`${ev.repo}-${ev.number}-${ev.action}-${i}`}
              href={ev.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors no-underline"
            >
              <span className={`text-sm font-mono font-bold shrink-0 w-4 text-center ${actionColor[ev.action]}`}>
                {actionIcon[ev.action]}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-16 truncate">{ev.repo}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">#{ev.number}</span>
              <span className="text-xs text-foreground truncate flex-1">{ev.title}</span>
              <span className={`text-[10px] font-mono shrink-0 ${actionColor[ev.action]}`}>{ev.action}</span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">{relativeTime(ev.timestamp)}</span>
            </a>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

// ─── SecurityPostureBadge ──────────────────────────────────────────────────

interface SecurityMetric {
  label: string;
  value: string;
  status: 'good' | 'warn' | 'bad';
  bar?: number;
}

export function SecurityPostureBadge({ posture, metrics }: {
  posture: 'SECURE' | 'WARNING' | 'CRITICAL';
  metrics: SecurityMetric[];
}) {
  const postureConfig = {
    SECURE: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.15)]',
      dot: 'good' as const,
    },
    WARNING: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      dot: 'warn' as const,
    },
    CRITICAL: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.15)]',
      dot: 'bad' as const,
    },
  };

  const config = postureConfig[posture];

  return (
    <SectionCard title="Security Posture">
      <div className={`rounded-xl ${config.bg} border ${config.border} ${config.glow} p-4 mb-3 flex items-center gap-3`}>
        <StatusDot status={config.dot} size="lg" />
        <span className={`text-xl font-bold font-mono ${config.text}`}>{posture}</span>
      </div>
      <div className="space-y-3">
        {metrics.map((m, i) => (
          <HealthRow key={i} label={m.label} value={m.value} status={m.status} bar={m.bar} />
        ))}
        {metrics.length === 0 && (
          <span className="text-xs text-muted-foreground italic">No health data available</span>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Nav Icons (SVG) ────────────────────────────────────────────────────────

export function OverviewIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  );
}

export function ProjectsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 4h14v12H3z" />
      <path d="M7 4V2h6v2" />
      <path d="M3 9h14" />
    </svg>
  );
}

export function RadarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M2 15l4-6 3 3 4-5 5 8" />
      <path d="M17 5v4h-4" />
    </svg>
  );
}

export function FinanceIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v8M7.5 8h5M7.5 12h5" />
    </svg>
  );
}

export function InfraIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="4" y="3" width="12" height="5" rx="1" />
      <rect x="4" y="12" width="12" height="5" rx="1" />
      <path d="M10 8v4" />
      <circle cx="7" cy="5.5" r="0.5" fill="currentColor" />
      <circle cx="7" cy="14.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function GrovakidIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M10 2L3 7v6l7 5 7-5V7z" />
      <path d="M10 12V8M8 10h4" />
    </svg>
  );
}

export function GrowthIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 16l4-5 3 2 5-7" />
      <path d="M14 6h4v4" />
    </svg>
  );
}
