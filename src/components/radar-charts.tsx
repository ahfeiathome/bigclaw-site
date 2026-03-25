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
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <div className="text-slate-500 font-mono mb-1">{label}</div>
      {payload.map((item, i) => (
        <div key={i} className="font-mono font-semibold text-slate-800">
          {item.dataKey === 'equity' ? 'Equity' : 'P/L'}: {formatCurrency(item.value)}
        </div>
      ))}
    </div>
  );
}

export function RechartsEquityChart({ data }: { data: EquityDataPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400">
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
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="equity"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#equityGradient)"
            dot={{ r: 3, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Daily P/L bar chart */}
      <div className="mt-4">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Daily P/L</div>
        <ResponsiveContainer width="100%" height={80}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
            <ReferenceLine y={0} stroke="#e2e8f0" />
            <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false} />
            <YAxis tick={false} axisLine={false} tickLine={false} width={0} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#4ade80' : '#f87171'} opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex justify-between text-[9px] text-slate-400 font-mono mt-1">
          {data.length > 0 && <span>{data[0].date}</span>}
          {data.length > 1 && <span>{data[data.length - 1].date}</span>}
        </div>
      </div>
    </div>
  );
}
