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

export function MetricCard({ label, value, subtitle, icon, trend }: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'flat';
}) {
  const trendIcon = trend === 'up' ? '\u2197' : trend === 'down' ? '\u2198' : trend === 'flat' ? '\u2192' : null;
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-zinc-500';

  return (
    <div className="animate-fade-in rounded-xl bg-card border border-border p-4 transition-all duration-200">
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
