import { Sparkline } from './sparkline';

type Semantic = 'success' | 'warning' | 'danger' | 'neutral';

const VALUE_COLORS: Record<Semantic, string> = {
  success: 'text-green-400',
  warning: 'text-amber-400',
  danger: 'text-red-400',
  neutral: 'text-foreground',
};

const SPARK_COLORS: Record<Semantic, string> = {
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  neutral: '#71717a',
};

const BORDER_CLASSES: Record<Semantic, string> = {
  success: 'border-green-500/20',
  warning: 'border-amber-500/20',
  danger: 'border-red-500/20',
  neutral: 'border-border',
};

export function KpiCard({
  label,
  value,
  semantic = 'neutral',
  delta,
  sparkData,
  subtitle,
}: {
  label: string;
  value: string | number;
  semantic?: Semantic;
  delta?: string;
  sparkData?: number[];
  subtitle?: string;
}) {
  const deltaIsUp = delta?.includes('▲') || delta?.includes('+');
  const deltaIsDown = delta?.includes('▼') || delta?.includes('-');
  const deltaColor = deltaIsUp ? 'text-green-400' : deltaIsDown ? 'text-red-400' : 'text-muted-foreground';

  return (
    <div className={`rounded-lg border bg-card p-3 transition-colors hover:border-border ${BORDER_CLASSES[semantic]}`}>
      <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className="flex items-center gap-2">
        <span className={`text-lg font-bold font-mono leading-tight ${VALUE_COLORS[semantic]}`}>{value}</span>
        {sparkData && sparkData.length >= 2 && (
          <Sparkline data={sparkData} color={SPARK_COLORS[semantic]} width={48} height={16} className="shrink-0 opacity-70" />
        )}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        {delta && <span className={`text-[10px] font-mono font-semibold ${deltaColor}`}>{delta}</span>}
        {subtitle && <span className="text-[10px] text-muted-foreground">{subtitle}</span>}
      </div>
    </div>
  );
}
