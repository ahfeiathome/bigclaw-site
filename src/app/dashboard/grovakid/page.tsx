import { fetchPrdChecklist, fetchTestMatrix, fetchGrovakidTracker, fetchRecentClosedIssues, fetchAllReleases, fetchLearnieHealth } from '@/lib/github';
import type { GitHubIssue } from '@/lib/github';
import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';
import { CollapsibleSection } from '@/components/collapsible-section';

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

interface PrdSummary { done: number; inProgress: number; notStarted: number; deferred: number; total: number }

function parsePrdSummary(content: string): PrdSummary {
  const summary = { done: 0, inProgress: 0, notStarted: 0, deferred: 0, total: 0 };
  const section = extractSection(content, 'Summary');
  const rows = parseMarkdownTable(section);
  for (const row of rows) {
    const status = row.cells[0]?.toLowerCase() || '';
    const count = parseInt(row.cells[1] || '0', 10);
    if (status.includes('done')) summary.done = count;
    else if (status.includes('progress')) summary.inProgress = count;
    else if (status.includes('not started')) summary.notStarted = count;
    else if (status.includes('defer')) summary.deferred = count;
  }
  summary.total = summary.done + summary.inProgress + summary.notStarted + summary.deferred;
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

interface TestFeature { feature: string; unit: string; e2e: string; regression: number; gaps: string }

function parseTestMatrix(content: string): TestFeature[] {
  const section = extractSection(content, 'Coverage Summary');
  const rows = parseMarkdownTable(section);
  return rows
    .filter(r => r.cells.length >= 5 && r.cells[1]?.toLowerCase().includes('learnie'))
    .map(r => ({
      feature: r.cells[0],
      unit: r.cells[2],
      e2e: r.cells[3],
      regression: parseInt(r.cells[4] || '0', 10),
      gaps: r.cells[5] || '',
    }));
}

function coverageColor(level: string): string {
  if (level === 'Full') return 'text-green-400';
  if (level === 'Partial') return 'text-amber-400';
  return 'text-red-400';
}

function coverageBg(level: string): string {
  if (level === 'Full') return 'bg-green-500/20';
  if (level === 'Partial') return 'bg-amber-500/20';
  return 'bg-red-500/20';
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

  const prd = prdMd ? parsePrdSummary(prdMd) : { done: 0, inProgress: 0, notStarted: 0, deferred: 0, total: 57 };
  const { blockers, gates } = trackerMd ? parseBlockers(trackerMd) : { blockers: [], gates: [] };
  const testFeatures = testMd ? parseTestMatrix(testMd) : [];
  const learnieIssues = closedIssues.filter((i: GitHubIssue) => i.repo === 'learnie-ai');
  const learnieRelease = releases.find(r => r.repo === 'learnie-ai');

  const noneCount = testFeatures.filter(f => f.unit === 'None' && f.e2e === 'None').length;
  const fullCount = testFeatures.filter(f => f.unit === 'Full' && f.e2e !== 'None').length;
  const partialCount = testFeatures.length - fullCount - noneCount;

  // PRD progress percentages
  const donePercent = prd.total > 0 ? Math.round((prd.done / prd.total) * 100) : 0;
  const progressPercent = prd.total > 0 ? Math.round((prd.inProgress / prd.total) * 100) : 0;

  // P0 items from PRD checklist
  const p0Section = prdMd ? extractSection(prdMd, 'P0') : '';
  const p0Items = parseMarkdownTable(p0Section);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">GrovaKid</h1>
            <SignalPill label="S4 BUILD" tone="info" />
            <span className="text-xs text-muted-foreground font-mono mt-1">Forge flagship</span>
          </div>
          <div className="flex items-center gap-2">
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

      {/* ── Panel 1: PRD Progress ────────────────────────────────── */}
      <SectionCard title="PRD Progress" className="mb-6">
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{prd.done} done · {prd.inProgress} in progress · {prd.notStarted} not started · {prd.deferred} deferred</span>
            <span className="font-mono">{donePercent}% complete</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
            {prd.done > 0 && <div className="bg-green-500" style={{ width: `${donePercent}%` }} />}
            {prd.inProgress > 0 && <div className="bg-blue-500" style={{ width: `${progressPercent}%` }} />}
          </div>
        </div>

        {/* P0 items expanded */}
        {p0Items.length > 0 && (
          <CollapsibleSection title={`P0 Must Ship (${p0Items.length})`} defaultOpen={false}>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {p0Items.map((row, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <StatusDot status={row.cells[2]?.includes('Done') ? 'good' : row.cells[2]?.includes('Progress') ? 'warn' : 'neutral'} size="sm" />
                  <span className="text-foreground flex-1">{row.cells[0]}</span>
                  <span className="text-muted-foreground font-mono">{row.cells[2]}</span>
                  {row.cells[5]?.trim().match(/^#?\d+$/) && <a href={`https://github.com/ahfeiathome/learnie-ai/issues/${row.cells[5].replace('#', '').trim()}`} target="_blank" rel="noopener noreferrer" className="text-primary text-[10px] no-underline hover:underline">{row.cells[5].trim()}</a>}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        )}
      </SectionCard>

      {/* ── Panel 2: Open Blockers ───────────────────────────────── */}
      <SectionCard title="Open Blockers" className="mb-6">
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

        {/* Revenue gates */}
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

      {/* ── Panel 3: Test Coverage Matrix ────────────────────────── */}
      <SectionCard title="Test Coverage" className="mb-6">
        <div className="flex gap-4 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Full: {fullCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Partial: {partialCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> None: {noneCount}</span>
        </div>
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {testFeatures.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-border last:border-0">
              <span className="text-foreground w-36 shrink-0 truncate">{f.feature}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${coverageBg(f.unit)} ${coverageColor(f.unit)}`}>Unit: {f.unit}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${coverageBg(f.e2e)} ${coverageColor(f.e2e)}`}>E2E: {f.e2e}</span>
              {f.gaps && <span className="text-muted-foreground truncate ml-auto text-[10px]">{f.gaps.slice(0, 40)}</span>}
            </div>
          ))}
          {testFeatures.length === 0 && <div className="text-sm text-muted-foreground">No test matrix data</div>}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* ── Panel 4: Recent Activity ─────────────────────────────── */}
        <SectionCard title="Recent Activity">
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

        {/* ── Panel 5: Live App + Health ───────────────────────────── */}
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
    </div>
  );
}
