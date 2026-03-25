'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts';

interface EquityDataPoint {
  date: string;
  equity: number;
  pnl: number;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-lg px-3 py-2 text-xs">
      <div className="text-muted-foreground font-mono mb-1">{label}</div>
      {payload.map((item, i) => (
        <div key={i} className="font-mono font-semibold text-foreground">
          {item.dataKey === 'equity' ? 'Equity' : 'P/L'}: {formatCurrency(item.value)}
        </div>
      ))}
    </div>
  );
}

export function RechartsEquityChart({ data }: { data: EquityDataPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
        Chart will appear after 2+ days of trading data
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 14%)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'hsl(220 15% 50%)' }}
            tickLine={false}
            axisLine={{ stroke: 'hsl(220 20% 14%)' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(220 15% 50%)' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="#22D3EE"
            strokeWidth={2}
            fill="url(#equityGradient)"
            dot={{ r: 3, fill: '#22D3EE', stroke: 'hsl(220 30% 8%)', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: '#22D3EE', stroke: 'hsl(220 30% 8%)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Daily P/L bar chart */}
      <div className="mt-4">
        <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Daily P/L</div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <ReferenceLine y={0} stroke="hsl(220 20% 14%)" />
            <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
            <YAxis tick={false} axisLine={false} tickLine={false} width={0} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#34D399' : '#f87171'} opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-1">
          {data.length > 0 && <span>{data[0].date}</span>}
          {data.length > 1 && <span>{data[data.length - 1].date}</span>}
        </div>
      </div>
    </div>
  );
}
