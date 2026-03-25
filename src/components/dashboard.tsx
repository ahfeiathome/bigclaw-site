// Shared Dashboard Components — dark void design system
// Dark mode: glass cards, glow effects, color-coded status, font-mono numbers

import React from 'react';

// ─── StatusDot ──────────────────────────────────────────────────────────────
// Animated status indicator with glow

export function StatusDot({ status, size = 'md' }: {
  status: 'good' | 'warn' | 'bad' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeMap = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
  const colorMap = {
    good: 'bg-green-400 shadow-[0_0_8px_hsl(160_60%_52%/0.5)] animate-pulse-dot',
    warn: 'bg-amber-400',
    bad: 'bg-red-400 animate-pulse',
    neutral: 'bg-slate-500',
  };
  return <span className={`inline-block rounded-full shrink-0 ${sizeMap[size]} ${colorMap[status]}`} />;
}

// ─── MetricCard ─────────────────────────────────────────────────────────────
// Dark themed KPI card with colored background tint

const metricColorMap = {
  green:  'bg-green-500/10 text-green-400 border-green-500/20',
  blue:   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  amber:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  red:    'bg-red-500/10 text-red-400 border-red-500/20',
  purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cyan:   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
} as const;

type MetricColor = keyof typeof metricColorMap;

export function MetricCard({ label, value, subtitle, icon, color = 'blue', trend }: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: MetricColor;
  trend?: 'up' | 'down' | 'flat';
}) {
  const c = metricColorMap[color];
  const trendIcon = trend === 'up' ? '\u2197' : trend === 'down' ? '\u2198' : trend === 'flat' ? '\u2192' : null;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div className={`animate-fade-in rounded-lg border p-3.5 ${c} transition-all duration-200`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium opacity-80">{label}</span>
        {icon && <div className="w-4 h-4 opacity-60">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold font-mono">{value}</span>
        {trendIcon && <span className={`text-lg ${trendColor}`}>{trendIcon}</span>}
      </div>
      {subtitle && <span className="text-[10px] opacity-50 font-mono mt-0.5 block">{subtitle}</span>}
    </div>
  );
}

// ─── HealthRow ──────────────────────────────────────────────────────────────
// Status row with animated progress bar — dark theme

const healthStatusColorMap = {
  good: 'text-green-400',
  warn: 'text-amber-400',
  bad: 'text-red-400',
} as const;

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
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <span className={`text-xs font-medium font-mono ${healthStatusColorMap[status]}`}>{value}</span>
      </div>
      {bar != null && (
        <div className="h-1 rounded-full bg-secondary overflow-hidden">
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
// Dark themed inline status badge with glow on hover

const pillToneMap = {
  success: 'bg-green-500/15 text-green-400 border border-green-500/20 hover:shadow-[0_0_12px_hsl(160_60%_52%/0.25)]',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20 hover:shadow-[0_0_12px_hsl(38_92%_50%/0.25)]',
  error:   'bg-red-500/15 text-red-400 border border-red-500/20 hover:shadow-[0_0_12px_hsl(0_72%_51%/0.25)]',
  info:    'bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:shadow-[0_0_12px_hsl(217_91%_60%/0.25)]',
  neutral: 'bg-secondary text-muted-foreground border border-border',
} as const;

export function SignalPill({ label, tone = 'neutral', pulse = false }: {
  label: string;
  tone?: keyof typeof pillToneMap;
  pulse?: boolean;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-shadow ${pillToneMap[tone]} ${pulse ? 'animate-pulse-glow' : ''}`}>
      {label}
    </span>
  );
}

// ─── SectionCard ────────────────────────────────────────────────────────────
// Glass container card with dark theme

const sectionAccentBarMap = {
  green:  'bg-green-500',
  blue:   'bg-blue-500',
  amber:  'bg-amber-500',
  red:    'bg-red-500',
  purple: 'bg-purple-500',
  cyan:   'bg-cyan-500',
  slate:  'bg-slate-500',
} as const;

export function SectionCard({ title, children, accent = 'slate', className, action }: {
  title: string;
  children: React.ReactNode;
  accent?: keyof typeof sectionAccentBarMap;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`animate-fade-in rounded-lg border border-border bg-card/90 backdrop-blur-sm ${className || ''}`}>
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-[3px] h-4 rounded-full ${sectionAccentBarMap[accent]}`} />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
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

export function GrowthIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M4 16l4-5 3 2 5-7" />
      <path d="M14 6h4v4" />
    </svg>
  );
}
