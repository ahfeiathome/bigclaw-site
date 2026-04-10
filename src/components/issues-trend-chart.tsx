'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { GitHubIssue } from '@/lib/github';

interface TrendPoint {
  date: string;
  opened: number;
  closed: number;
  open: number;
}

function buildIssueTrend(openIssues: GitHubIssue[], closedIssues: GitHubIssue[], days: number): TrendPoint[] {
  const now = Date.now();
  const startMs = now - days * 24 * 60 * 60 * 1000;

  // Collect all events
  const events: { date: string; type: 'opened' | 'closed' }[] = [];

  for (const issue of openIssues) {
    const created = new Date(issue.createdAt).getTime();
    if (created >= startMs) {
      events.push({ date: issue.createdAt.slice(0, 10), type: 'opened' });
    }
  }

  for (const issue of closedIssues) {
    const created = new Date(issue.createdAt).getTime();
    if (created >= startMs) {
      events.push({ date: issue.createdAt.slice(0, 10), type: 'opened' });
    }
    if (issue.closedAt) {
      const closed = new Date(issue.closedAt).getTime();
      if (closed >= startMs) {
        events.push({ date: issue.closedAt.slice(0, 10), type: 'closed' });
      }
    }
  }

  // Build daily buckets — start from the first event date, not from `days` ago
  const firstEventMs = events.length > 0
    ? Math.min(...events.map(e => new Date(e.date).getTime()))
    : startMs;
  const bucketStart = Math.max(firstEventMs, startMs);

  const buckets = new Map<string, { opened: number; closed: number }>();
  for (let d = bucketStart; d <= now; d += 24 * 60 * 60 * 1000) {
    const key = new Date(d).toISOString().slice(0, 10);
    buckets.set(key, { opened: 0, closed: 0 });
  }

  for (const event of events) {
    const bucket = buckets.get(event.date);
    if (bucket) {
      if (event.type === 'opened') bucket.opened++;
      else bucket.closed++;
    }
  }

  // Build cumulative trend
  let totalOpened = 0;
  let totalClosed = 0;
  const trend: TrendPoint[] = [];

  for (const [date, counts] of Array.from(buckets.entries()).sort()) {
    totalOpened += counts.opened;
    totalClosed += counts.closed;
    trend.push({
      date,
      opened: totalOpened,
      closed: totalClosed,
      open: totalOpened - totalClosed,
    });
  }

  return trend;
}

function formatDate(date: string): string {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface Props {
  openIssues: GitHubIssue[];
  closedIssues: GitHubIssue[];
  days?: number;
}

export function IssueTrendChart({ openIssues, closedIssues, days = 90 }: Props) {
  const data = buildIssueTrend(openIssues, closedIssues, days);

  if (data.length === 0 || data.every(d => d.opened === 0 && d.closed === 0)) {
    return <p className="text-xs text-muted-foreground">No issue activity in the last {days} days.</p>;
  }

  return (
    <div className="w-full" style={{ minHeight: 200 }}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            stroke="rgba(255,255,255,0.1)"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }}
            stroke="rgba(255,255,255,0.1)"
            width={30}
          />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(222 47% 11%)', border: '1px solid hsl(217 33% 17%)', borderRadius: 8, fontSize: 11 }}
            labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
            itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="opened" stroke="#60a5fa" name="Total Created" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="closed" stroke="#4ade80" name="Total Resolved" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="open" stroke="#fbbf24" name="Currently Open" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
