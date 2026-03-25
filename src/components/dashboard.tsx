// Shared Dashboard Components — executive dashboard design system
// Light mode: surface depth, animated bars, color-coded status, font-mono numbers

import React from 'react';

// ─── StatusDot ──────────────────────────────────────────────────────────────
// Animated status indicator

export function StatusDot({ status, size = 'md' }: {
  status: 'good' | 'warn' | 'bad' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeMap = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
  const colorMap = {
    good: 'bg-emerald-400 animate-pulse-glow',
    warn: 'bg-amber-400',
    bad: 'bg-red-400 animate-pulse',
    neutral: 'bg-slate-300',
  };
  return <span className={`inline-block rounded-full shrink-0 ${sizeMap[size]} ${colorMap[status]}`} />;
}

// ─── MetricCard ─────────────────────────────────────────────────────────────
// Big number KPI card with colored left border, trend arrow, fade-in animation

const metricColorMap = {
  green:  { border: 'border-l-emerald-500', bg: 'bg-emerald-50/40', text: 'text-emerald-600', hoverBorder: 'hover:border-l-emerald-600' },
  blue:   { border: 'border-l-blue-500',    bg: 'bg-blue-50/40',    text: 'text-blue-600',    hoverBorder: 'hover:border-l-blue-600' },
  amber:  { border: 'border-l-amber-500',   bg: 'bg-amber-50/40',   text: 'text-amber-600',   hoverBorder: 'hover:border-l-amber-600' },
  red:    { border: 'border-l-red-500',      bg: 'bg-red-50/40',     text: 'text-red-600',     hoverBorder: 'hover:border-l-red-600' },
  purple: { border: 'border-l-purple-500',   bg: 'bg-purple-50/40',  text: 'text-purple-600',  hoverBorder: 'hover:border-l-purple-600' },
  cyan:   { border: 'border-l-cyan-500',     bg: 'bg-cyan-50/40',    text: 'text-cyan-600',    hoverBorder: 'hover:border-l-cyan-600' },
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
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400';

  return (
    <div className={`animate-fade-in rounded-2xl border border-slate-100 border-l-4 ${c.border} ${c.bg} ${c.hoverBorder} bg-white p-4 shadow-sm hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{label}</span>
        {icon && <div className="w-4 h-4 text-slate-400">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-mono font-bold ${c.text}`}>{value}</span>
        {trendIcon && <span className={`text-lg ${trendColor}`}>{trendIcon}</span>}
      </div>
      {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
    </div>
  );
}

// ─── HealthRow ──────────────────────────────────────────────────────────────
// Status row with animated progress bar

const healthStatusColorMap = {
  good: 'text-emerald-600',
  warn: 'text-amber-600',
  bad: 'text-red-600',
} as const;

export function HealthRow({ label, value, status, bar, icon }: {
  label: string;
  value: string;
  status: 'good' | 'warn' | 'bad';
  bar?: number;
  icon?: React.ReactNode;
}) {
  const barColor = bar != null
    ? bar > 80 ? 'bg-red-500' : bar > 60 ? 'bg-amber-500' : 'bg-emerald-500'
    : '';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusDot status={status} size="sm" />
          {icon && <span className="w-4 h-4 text-slate-400">{icon}</span>}
          <span className="text-sm text-slate-600">{label}</span>
        </div>
        <span className={`text-sm font-medium font-mono ${healthStatusColorMap[status]}`}>{value}</span>
      </div>
      {bar != null && (
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
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
// Polished inline status badge

const pillToneMap = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error:   'bg-red-50 text-red-700 border-red-200',
  info:    'bg-blue-50 text-blue-700 border-blue-200',
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
} as const;

export function SignalPill({ label, tone = 'neutral', pulse = false }: {
  label: string;
  tone?: keyof typeof pillToneMap;
  pulse?: boolean;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${pillToneMap[tone]} ${pulse ? 'animate-pulse-glow' : ''}`}>
      {label}
    </span>
  );
}

// ─── SectionCard ────────────────────────────────────────────────────────────
// Container card with depth, colored left bar title, stagger fade-in

const sectionAccentBarMap = {
  green:  'bg-emerald-500',
  blue:   'bg-blue-500',
  amber:  'bg-amber-500',
  red:    'bg-red-500',
  purple: 'bg-purple-500',
  cyan:   'bg-cyan-500',
  slate:  'bg-slate-400',
} as const;

const sectionAccentTextMap = {
  green:  'text-emerald-600',
  blue:   'text-blue-600',
  amber:  'text-amber-600',
  red:    'text-red-600',
  purple: 'text-purple-600',
  cyan:   'text-cyan-600',
  slate:  'text-slate-700',
} as const;

export function SectionCard({ title, children, accent = 'slate', className, action }: {
  title: string;
  children: React.ReactNode;
  accent?: keyof typeof sectionAccentBarMap;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`animate-fade-in rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 bg-white p-5 ${className || ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-[3px] h-4 rounded-full ${sectionAccentBarMap[accent]}`} />
          <span className={`text-sm font-semibold uppercase tracking-wide ${sectionAccentTextMap[accent]}`}>
            {title}
          </span>
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
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
