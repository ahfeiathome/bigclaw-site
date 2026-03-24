// Shared Dashboard Components — inspired by mission-control widget-primitives
// Light mode: white bg, slate borders, shadow-md cards

import React from 'react';

// ─── MetricCard ─────────────────────────────────────────────────────────────
// Big number KPI card with colored left border

const metricColorMap = {
  green: 'border-l-green-600 bg-green-50/50',
  blue: 'border-l-blue-600 bg-blue-50/50',
  amber: 'border-l-amber-600 bg-amber-50/50',
  red: 'border-l-red-600 bg-red-50/50',
  purple: 'border-l-purple-600 bg-purple-50/50',
  cyan: 'border-l-cyan-600 bg-cyan-50/50',
} as const;

const metricValueColorMap = {
  green: 'text-green-600',
  blue: 'text-blue-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
  cyan: 'text-cyan-600',
} as const;

export function MetricCard({ label, value, subtitle, icon, color = 'blue' }: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  color?: keyof typeof metricColorMap;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 border-l-4 shadow-md bg-white p-4 ${metricColorMap[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        {icon && <div className="w-4 h-4 text-slate-400">{icon}</div>}
      </div>
      <div className={`text-2xl font-mono font-bold ${metricValueColorMap[color]}`}>{value}</div>
      {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
    </div>
  );
}

// ─── HealthRow ──────────────────────────────────────────────────────────────
// Status row with optional progress bar

const healthStatusColorMap = {
  good: 'text-green-600',
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
    ? bar > 80 ? 'bg-red-500' : bar > 60 ? 'bg-amber-500' : 'bg-green-500'
    : '';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="w-4 h-4 text-slate-400">{icon}</span>}
          <span className="text-sm text-slate-600">{label}</span>
        </div>
        <span className={`text-sm font-medium font-mono ${healthStatusColorMap[status]}`}>{value}</span>
      </div>
      {bar != null && (
        <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.min(bar, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── SignalPill ──────────────────────────────────────────────────────────────
// Inline status badge

const pillToneMap = {
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  error: 'bg-red-100 text-red-700 border-red-200',
  info: 'bg-blue-100 text-blue-700 border-blue-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
} as const;

export function SignalPill({ label, tone = 'neutral' }: {
  label: string;
  tone?: keyof typeof pillToneMap;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${pillToneMap[tone]}`}>
      {label}
    </span>
  );
}

// ─── SectionCard ────────────────────────────────────────────────────────────
// Container card with title

const sectionAccentMap = {
  green: 'text-green-600',
  blue: 'text-blue-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
  cyan: 'text-cyan-600',
  slate: 'text-slate-700',
} as const;

export function SectionCard({ title, children, accent = 'slate', className }: {
  title: string;
  children: React.ReactNode;
  accent?: keyof typeof sectionAccentMap;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-slate-200 shadow-md bg-white p-5 ${className || ''}`}>
      <div className={`text-sm font-semibold uppercase tracking-wide mb-4 ${sectionAccentMap[accent]}`}>
        {title}
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
