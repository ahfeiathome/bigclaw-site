import { fetchPrdChecklist, fetchTestMatrix, fetchGrovakidTracker, fetchRecentClosedIssues, fetchAllReleases, fetchLearnieHealth } from '@/lib/github';
import type { GitHubIssue } from '@/lib/github';
import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';
import { ViewSource } from '@/components/view-source';
import { CollapsibleSection } from '@/components/collapsible-section';
import { PrdChecklist, type PrdItem } from '@/components/prd-checklist';

// ── Parsers ─────────────────────────────────────────────────────────────────

interface TableRow { cells: string[] }

function parseMarkdownTable(content: string): TableRow[] {
  const lines = content.split('\n').filter(
    (l) => l.includes('|') && !l.match(/^\|[\s-|]+\|$/)
  );
  if (lines.length <= 1) return [];
  return lines.slice(1).map((line) => ({
    cells: line.split('|').map((c) => c.trim()).filter(Boolean),
  }));
}

function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`^##+ ${heading}`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^##+ /) && !lines[i].includes(heading)) { end = i; break; }
  }
  return lines.slice(0, end).join('\n');
}

// ── Category mapping from PRD section names ────────────────────────────────

const SECTION_TO_CATEGORY: Record<string, string> = {
  'product & ai core': 'AI/ML',
  'ai engine': 'AI/ML',
  'ai': 'AI/ML',
  'dashboards & ux': 'UI/UX',
  'dashboards': 'UI/UX',
  'progress': 'UI/UX',
  'library': 'UI/UX',
  'accessibility': 'UI/UX',
  'ux': 'UI/UX',
  'pdf': 'Functional',
  'founder req': 'Functional',
  'functional': 'Functional',
  'core': 'Functional',
  'qa': 'QA/Testing',
  'qa security': 'QA/Testing',
  'testing': 'QA/Testing',
  'auth': 'Auth/Security',
  'safety': 'Auth/Security',
  'risk & compliance': 'Auth/Security',
  'security': 'Auth/Security',
  'engineering': 'Infrastructure',
  'infrastructure': 'Infrastructure',
  'marketing site': 'Marketing',
  'internal ops': 'Marketing',
  'marketing': 'Marketing',
  'revenue & kpis': 'Revenue',
  'billing': 'Revenue',
  'revenue': 'Revenue',
  'strategy': 'Strategy',
  'resource allocation': 'Strategy',
};

function mapCategory(sectionName: string): string {
  const lower = sectionName.toLowerCase().trim();
  for (const [key, cat] of Object.entries(SECTION_TO_CATEGORY)) {
    if (lower.includes(key)) return cat;
  }
  return 'Functional';
}

function parsePrdItems(content: string): PrdItem[] {
  const items: PrdItem[] = [];
  let currentSection = '';
  let idCounter = 1;

  for (const line of content.split('\n')) {
    // Detect section headings
    const sectionMatch = line.match(/^#{2,4}\s+(.+)/);
    if (sectionMatch) {
      const heading = sectionMatch[1].replace(/[*_]/g, '').trim();
      // Skip "Summary", "PRD Checklist", etc.
      if (!heading.toLowerCase().includes('summary') && !heading.toLowerCase().includes('checklist') && !heading.toLowerCase().includes('legend')) {
        currentSection = heading;
      }
      continue;
    }

    // Parse table rows
    if (!line.startsWith('|') || line.match(/^\|[\s-|]+\|$/) || line.includes('| Item |') || line.includes('| Feature |')) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 3) continue;

    // Determine item name and status from columns
    const itemName = cols[0]?.replace(/\*\*/g, '') || '';
    if (!itemName || itemName.match(/^[\s-]+$/)) continue;

    // Try to extract status — look for common patterns
    let status: PrdItem['status'] = 'Not Started';
    let priority = 'P2';
    let owner = 'Code CLI';
    let github = '—';

    for (const col of cols) {
      const lower = col.toLowerCase();
      if (lower.includes('done') || lower.includes('✅') || lower === '✓') status = 'Done';
      else if (lower.includes('progress') || lower.includes('🔄') || lower.includes('wip')) status = 'In Progress';
      else if (lower.includes('defer') || lower.includes('⏸')) status = 'Deferred';
      else if (lower.includes('not started') || lower.includes('❌') || lower === '✗') status = 'Not Started';

      if (col.match(/^P[0-3]$/)) priority = col;
      if (col.match(/^#?\d+$/)) github = col.startsWith('#') ? col : `#${col}`;
    }

    const id = `PRD-${String(idCounter).padStart(3, '0')}`;
    idCounter++;

    items.push({
      id,
      item: itemName,
      category: mapCategory(currentSection),
      priority,
      status,
      owner,
      github,
    });
  }

  return items;
}

interface PrdSummary { done: number; inProgress: number; notStarted: number; deferred: number; total: number }

function computePrdSummary(items: PrdItem[]): PrdSummary {
  const summary: PrdSummary = { done: 0, inProgress: 0, notStarted: 0, deferred: 0, total: items.length };
  for (const item of items) {
    if (item.status === 'Done') summary.done++;
    else if (item.status === 'In Progress') summary.inProgress++;
    else if (item.status === 'Deferred') summary.deferred++;
    else summary.notStarted++;
  }
  return summary;
}

interface Blocker { number: string; priority: string; item: string; status: string }
interface RevenueGate { gate: string; type: string; status: string }

function parseBlockers(content: string): { blockers: Blocker[]; gates: RevenueGate[] } {
  const blockers: Blocker[] = [];
  const gates: RevenueGate[] = [];

  const blockerSection = extractSection(content, 'Open Blockers');
  for (const row of parseMarkdownTable(blockerSection)) {
    if (row.cells.length >= 4) {
      blockers.push({ number: row.cells[0], priority: row.cells[1], item: row.cells[2], status: row.cells[3] });
    }
  }

  const gateSection = extractSection(content, 'Revenue Gates');
  for (const row of parseMarkdownTable(gateSection)) {
    if (row.cells.length >= 3) {
      gates.push({ gate: row.cells[0], type: row.cells[1], status: row.cells[2] });
    }
  }

  return { blockers, gates };
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function GrovakidPage() {
  const [prdMd, testMd, trackerMd, closedIssues, releases, health] = await Promise.all([
    fetchPrdChecklist(),
    fetchTestMatrix(),
    fetchGrovakidTracker(),
    fetchRecentClosedIssues(14),
    fetchAllReleases(),
    fetchLearnieHealth(),
  ]);

  const prdItems = prdMd ? parsePrdItems(prdMd) : [];
  const prd = computePrdSummary(prdItems);
  const { blockers, gates } = trackerMd ? parseBlockers(trackerMd) : { blockers: [], gates: [] };
  const learnieIssues = closedIssues.filter((i: GitHubIssue) => i.repo === 'learnie-ai');
  const learnieRelease = releases.find(r => r.repo === 'learnie-ai');

  const donePercent = prd.total > 0 ? Math.round((prd.done / prd.total) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Education — GrovaKid</h1>
            <SignalPill label="S4 BUILD" tone="info" />
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-green-500/10 text-green-400">Forge</span>
          </div>
          <div className="flex items-center gap-3">
            <ViewSource repo="learnie-ai" path="docs/product/GROVAKID_TRACKER.md" />
            <StatusDot status={health.ok ? 'good' : 'bad'} size="sm" />
            <span className="text-xs text-muted-foreground font-mono">{health.ok ? 'Live' : 'Down'} ({health.status})</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm font-mono text-muted-foreground">
          <span>{prd.total} PRD items</span>
          <span>{blockers.length} blockers</span>
          <span>{gates.length} revenue gates</span>
          <a href="https://learnie-ai-ten.vercel.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline no-underline ml-auto">Live App →</a>
        </div>
      </div>

      {/* ── Section 1: Summary KPIs ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">PDLC Stage</div>
          <div className="text-sm font-bold font-mono text-foreground mt-1">S4 BUILD</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Company</div>
          <div className="mt-1"><span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-green-500/10 text-green-400">Forge</span></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</div>
          <div className="text-sm font-mono text-foreground mt-1">Subscription</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Live Status</div>
          <div className="flex items-center gap-1.5 mt-1">
            <StatusDot status={health.ok ? 'good' : 'bad'} size="sm" />
            <span className="text-sm font-mono text-foreground">{health.ok ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">PRD Progress</div>
          <div className="text-sm font-bold font-mono text-foreground mt-1">{donePercent}%</div>
          <div className="text-[10px] text-muted-foreground">{prd.done}/{prd.total} done</div>
        </div>
      </div>

      {/* ── Section 2: PRD Checklist (category bars + filterable table) ── */}
      <SectionCard title={`PRD Checklist — ${prd.total} Items`} className="mb-6">
        {prdItems.length > 0 ? (
          <PrdChecklist items={prdItems} repoSlug="learnie-ai" />
        ) : (
          <p className="text-sm text-muted-foreground">No PRD checklist data available</p>
        )}
      </SectionCard>

      {/* ── Section 2b: Blockers + Revenue Gates ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Open Blockers">
          <div className="space-y-3">
            {blockers.map((b, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${b.priority === 'P0' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{b.priority}</span>
                <span className="text-foreground flex-1">{b.item}</span>
                <a href={`https://github.com/ahfeiathome/learnie-ai/issues/${b.number}`} target="_blank" rel="noopener noreferrer" className="text-primary text-xs no-underline hover:underline">#{b.number}</a>
              </div>
            ))}
            {blockers.length === 0 && <div className="text-sm text-green-600">No open blockers</div>}
          </div>
          {gates.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Revenue Gates</div>
              <div className="space-y-2">
                {gates.map((g, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">{g.type}</span>
                    <span className="text-foreground flex-1">{g.gate}</span>
                    <span className="text-xs text-muted-foreground">{g.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        {/* Live App + Health */}
        <SectionCard title="Live App">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusDot status={health.ok ? 'good' : 'bad'} size="md" />
              <div>
                <div className="text-sm font-semibold text-foreground">{health.ok ? 'Online' : 'Offline'}</div>
                <div className="text-xs text-muted-foreground font-mono">HTTP {health.status}</div>
              </div>
              <a href="https://learnie-ai-ten.vercel.app" target="_blank" rel="noopener noreferrer" className="text-xs text-primary no-underline hover:underline ml-auto">Visit →</a>
            </div>
            {learnieRelease && (
              <div className="border-t border-border pt-3">
                <div className="text-xs text-muted-foreground">Last release</div>
                <a href={learnieRelease.url} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground no-underline hover:underline">
                  {learnieRelease.tag} — {learnieRelease.name}
                </a>
                <div className="text-[10px] text-muted-foreground">{new Date(learnieRelease.publishedAt).toLocaleDateString()}</div>
              </div>
            )}
          </div>
        </SectionCard>
      </div>

      {/* ── Section 3: Project Status ───────────────────────────── */}
      <SectionCard title="Recent Activity" className="mb-6">
        {learnieIssues.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recently closed issues</div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {learnieIssues.slice(0, 10).map((issue: GitHubIssue) => (
              <a key={issue.number} href={issue.url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 rounded-lg p-2 hover:bg-muted transition-colors no-underline">
                <StatusDot status="good" size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">#{issue.number} {issue.title}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(issue.updatedAt).toLocaleDateString()}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
