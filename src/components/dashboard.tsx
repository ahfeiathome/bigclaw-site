// Shared Dashboard Components — clean light executive design system
// Light mode: white cards, subtle shadows, color-coded status, font-mono numbers

import React from 'react';

// ─── StatusDot ──────────────────────────────────────────────────────────────
// Status indicator dot

export function StatusDot({ status, size = 'md' }: {
  status: 'good' | 'warn' | 'bad' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeMap = { sm: 'w-2 h-2', md: 'w-2.5 h-2.5', lg: 'w-3 h-3' };
  const colorMap = {
    good: 'bg-green-500 shadow-[0_0_4px_rgba(22,163,74,0.3)]',
    warn: 'bg-amber-500',
    bad: 'bg-red-500 animate-pulse',
    neutral: 'bg-gray-400',
  };
  return <span className={`inline-block rounded-full shrink-0 ${sizeMap[size]} ${colorMap[status]}`} />;
}

// ─── MetricCard ─────────────────────────────────────────────────────────────
// Clean white KPI card with large mono number

export function MetricCard({ label, value, subtitle, icon, trend }: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'flat';
}) {
  const trendIcon = trend === 'up' ? '\u2197' : trend === 'down' ? '\u2198' : trend === 'flat' ? '\u2192' : null;
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-400';

  return (
    <div className="animate-fade-in rounded-2xl bg-white shadow-sm p-5 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium tracking-wide uppercase text-gray-400">{label}</span>
        {icon && <div className="w-4 h-4 text-gray-400">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-bold font-mono text-gray-900">{value}</span>
        {trendIcon && <span className={`text-lg ${trendColor}`}>{trendIcon}</span>}
      </div>
      {subtitle && <span className="text-sm text-gray-400 mt-0.5 block">{subtitle}</span>}
    </div>
  );
}

// ─── HealthRow ──────────────────────────────────────────────────────────────
// Status row with optional progress bar

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
          {icon && <span className="w-4 h-4 text-gray-400">{icon}</span>}
          <span className="text-sm text-gray-500">{label}</span>
        </div>
        <span className="text-sm font-medium font-mono text-gray-900">{value}</span>
      </div>
      {bar != null && (
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
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
// Colored dot + tinted background status badge

const pillToneMap = {
  success: 'bg-green-50 text-green-700',
  warning: 'bg-orange-50 text-orange-700',
  error:   'bg-red-50 text-red-700',
  info:    'bg-blue-50 text-blue-700',
  neutral: 'bg-gray-100 text-gray-600',
} as const;

const pillDotMap = {
  success: 'bg-green-500',
  warning: 'bg-orange-500',
  error:   'bg-red-500',
  info:    'bg-blue-500',
  neutral: 'bg-gray-400',
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
// White container card with subtle shadow

export function SectionCard({ title, children, className, action }: {
  title: string;
  children: React.ReactNode;
  accent?: string;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className={`animate-fade-in rounded-2xl bg-white shadow-sm border border-gray-100 ${className || ''}`}>
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {title}
          </span>
          {action && <div>{action}</div>}
        </div>
      </div>
      <div className="px-5 pb-5">
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
