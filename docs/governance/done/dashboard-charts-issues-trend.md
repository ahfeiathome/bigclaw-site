# EXECUTION BRIEF — Dashboard Charts: Issues Trend Visualization

**Date:** 2026-04-07 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1
**Status:** Product quality — Michael wants visual trend data on product pages.

## SITUATION

The product page Section 3 "Issues Trend" currently shows a simple open/closed ratio bar. Michael wants real time-series line charts showing bug trends over time. The tools are already available — Recharts v3 is installed, GitHub Issues API returns timestamps. Just needs wiring + the shadcn Chart component.

## SETUP (one-time)

```bash
cd ~/Projects/bigclaw-ai/bigclaw-site
npx shadcn@latest add chart
```

This installs `src/components/ui/chart.tsx` with `ChartContainer`, `ChartConfig`, `ChartTooltip`, `ChartTooltipContent` — styled to match the dashboard's dark theme automatically.

## CHART 1: Issues Trend Line Chart (per product)

**Data source:** GitHub Issues API (already fetched in ProductPage)
- `fetchAllIssues()` → all open issues with `created_at`
- `fetchRecentClosedIssues(90)` → closed issues from last 90 days with `created_at` and `closed_at`

**Data transformation:** Build a daily time series from issue timestamps:

```typescript
interface TrendPoint {
  date: string;       // "2026-03-01"
  opened: number;     // cumulative issues opened by this date
  closed: number;     // cumulative issues closed by this date
  open: number;       // running open count (opened - closed)
}

function buildIssueTrend(allIssues: Issue[], closedIssues: Issue[], days: number): TrendPoint[] {
  // 1. Collect all events: { date, type: 'opened' | 'closed' }
  // 2. Sort by date
  // 3. Walk through dates, accumulate running totals
  // 4. Return array of TrendPoints for the last N days
}
```

**Visualization:** Three-line chart using Recharts + shadcn Chart:

```tsx
<ChartContainer config={chartConfig} className="min-h-[200px] w-full">
  <LineChart data={trendData}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="date" tickFormatter={formatDate} />
    <YAxis />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Line type="monotone" dataKey="opened" stroke="var(--chart-1)" name="Total Created" />
    <Line type="monotone" dataKey="closed" stroke="var(--chart-2)" name="Total Resolved" />
    <Line type="monotone" dataKey="open" stroke="var(--chart-3)" name="Currently Open" />
  </LineChart>
</ChartContainer>
```

**Colors (using shadcn chart CSS vars):**
- `--chart-1` (blue) → Total Created (cumulative)
- `--chart-2` (green) → Total Resolved (cumulative)
- `--chart-3` (amber) → Currently Open (the gap between created and resolved)

**Where it goes:** Replace the current simple bar in Section 3 of `ProductPage`. Keep the P0/P1 badges and issue list below the chart.

## CHART 2: Portfolio Overview (optional — Mission Control page)

A stacked area chart on Mission Control showing all products' open issues over time — so Michael can see which products are accumulating debt vs resolving it.

Lower priority — do Chart 1 first.

## DATA FETCHING CHANGES

The current `fetchRecentClosedIssues(days)` only fetches 7 days by default. For a meaningful trend chart, extend to 90 days:

```typescript
// In ProductPage, change:
const closedIssues = await fetchRecentClosedIssues(90);  // was 30
```

Also need to fetch ALL issues (open + closed) for the complete picture. The current `fetchAllIssues()` only returns open issues. Add a new function:

```typescript
export async function fetchAllIssuesWithHistory(repoSlug: string): Promise<Issue[]> {
  // Fetch both open and closed issues for this repo
  // state=all to get complete history
  // Include created_at and closed_at for time-series
}
```

## DONE CRITERIA

- [ ] shadcn Chart component installed (`src/components/ui/chart.tsx`)
- [ ] `buildIssueTrend()` function transforms issue data into time series
- [ ] Line chart renders on GrovaKid product page with 3 lines
- [ ] Chart is responsive (looks good on mobile)
- [ ] Tooltip shows date + values on hover
- [ ] Chart works for all product pages (not just GrovaKid)
- [ ] P0/P1 badges and issue list remain below the chart
