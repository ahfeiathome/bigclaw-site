'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CostDay {
  date: string;
  spend: number;
}

export function CostTrendChart({ data }: { data: CostDay[] }) {
  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground">No cost data yet. Rex (CFO) populates ops/DAILY_COSTS.md daily.</p>;
  }

  return (
    <div className="w-full" style={{ minHeight: 160 }}>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => { const p = d.split('-'); return `${p[1]}/${p[2]}`; }}
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            stroke="rgba(255,255,255,0.1)"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            stroke="rgba(255,255,255,0.1)"
            width={35}
            tickFormatter={(v: number) => `$${v}`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(222 47% 11%)', border: '1px solid hsl(217 33% 17%)', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Daily Spend']}
          />
          <Bar dataKey="spend" fill="#60a5fa" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
