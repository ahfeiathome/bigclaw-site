import { fetchKnowledgeHub, fetchSDLCProcess, fetchSDLCViolations } from '@/lib/github';
import { listKnowledgeEntries } from '@/lib/content';
import { SignalPill, SectionCard, StatusDot } from '@/components/dashboard';
import { ViewSource } from '@/components/view-source';
import { KnowledgeHubView } from '@/components/knowledge-hub-view';
import type { KHEntry } from '@/components/knowledge-hub-view';

function parseKHEntries(content: string): KHEntry[] {
  const entries: KHEntry[] = [];
  const entryRegex = /^## (KH-\d+)\s*—\s*(\S+)\s*—\s*(\S+)/gm;
  let match;

  while ((match = entryRegex.exec(content)) !== null) {
    const id = match[1];
    const agent = match[2];
    const date = match[3];

    const start = match.index + match[0].length;
    const nextEntry = content.indexOf('\n## ', start);
    const block = content.slice(start, nextEntry === -1 ? undefined : nextEntry);

    const typeMatch = block.match(/\*\*Type:\*\*\s*(\S+)/);
    const domainMatch = block.match(/\*\*Domain:\*\*\s*(\S+)/);
    const whatMatch = block.match(/\*\*What:\*\*\s*(.+)/);
    const sourceMatch = block.match(/\*\*Source:\*\*\s*(.+)/);
    const appliedMatch = block.match(/\*\*Applied:\*\*\s*(.+)/);
    const tagsMatch = block.match(/\*\*Tags:\*\*\s*(.+)/);

    entries.push({
      id, agent, date,
      type: typeMatch?.[1] || 'LEARN',
      domain: domainMatch?.[1] || 'general',
      what: whatMatch?.[1]?.trim() || '',
      source: sourceMatch?.[1]?.trim() || '',
      applied: appliedMatch?.[1]?.trim() || '',
      tags: tagsMatch?.[1]?.match(/#[\w-]+/g)?.map(t => t.slice(1)) || [],
    });
  }

  return entries;
}

const FILE_META: Record<string, { title: string; category: string }> = {
  COST_MODEL: { title: 'Cost Model', category: 'finance' },
  DEV_KNOWLEDGE_HUB: { title: 'Dev Knowledge Hub', category: 'dev' },
  INFRASTRUCTURE_ASSESSMENT: { title: 'Infrastructure Assessment', category: 'infra' },
  INVESTMENT_PORTFOLIO: { title: 'Investment Portfolio', category: 'finance' },
  LEARNING_LOG_engineering: { title: 'Learning Log — Engineering', category: 'dev' },
  LEARNING_LOG_finance: { title: 'Learning Log — Finance', category: 'finance' },
  TRADE_JOURNAL: { title: 'Trade Journal', category: 'finance' },
};

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-400',
  High: 'bg-amber-500/20 text-amber-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
};

interface SDLCViolation { date: string; project: string; code: string; severity: string; description: string }
interface SDLCStage { stage: string; who: string; gate: string; enforcedBy: string }

function parseTable(content: string): Record<string, string>[] {
  const lines = content.split('\n').filter(l => l.includes('|'));
  if (lines.length < 2) return [];
  const headers = lines[0].split('|').map(c => c.trim()).filter(Boolean);
  const dataLines = lines.slice(1).filter(l => !l.match(/^\|[\s-:|]+\|$/));
  return dataLines.map(line => {
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cells[i] || ''; });
    return row;
  });
}

function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`^## ${heading}`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^## /)) { end = i; break; }
  }
  return lines.slice(0, end).join('\n');
}

export default async function ResourcesPage() {
  const [khContent, fileList, processMd, violationsMd] = await Promise.all([
    fetchKnowledgeHub(),
    listKnowledgeEntries(),
    fetchSDLCProcess(),
    fetchSDLCViolations(),
  ]);

  const entries = khContent ? parseKHEntries(khContent) : [];
  const seen = new Set<string>();
  const uniqueEntries = entries.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  const knowledgeFiles = fileList
    .filter(slug => slug !== 'KNOWLEDGE_HUB')
    .map(slug => ({
      slug,
      title: FILE_META[slug]?.title || slug.replace(/_/g, ' '),
      category: FILE_META[slug]?.category || 'general',
    }));

  const domains = [...new Set(uniqueEntries.map(e => e.domain))];
  const opportunities = uniqueEntries.filter(e => e.type === 'OPPORTUNITY').length;
  const risks = uniqueEntries.filter(e => e.type === 'RISK').length;

  // Parse SDLC data from GitHub API
  const stages: SDLCStage[] = processMd
    ? parseTable(extractSection(processMd, '8-Stage Pipeline \\(every code change\\)')).map(r => ({
        stage: r['Stage'] || '', who: r['Who'] || '', gate: r['Gate'] || '', enforcedBy: r['Enforced by'] || '',
      }))
    : [];

  const violations: SDLCViolation[] = violationsMd
    ? parseTable(violationsMd).map(r => ({
        date: r['Date'] || '', project: r['Project'] || '', code: r['Code'] || '',
        severity: r['Severity'] || '', description: r['Description'] || '',
      }))
    : [];

  const criticalCount = violations.filter(v => v.severity === 'Critical').length;
  const highCount = violations.filter(v => v.severity === 'High').length;
  const mediumCount = violations.filter(v => v.severity === 'Medium').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Resources</h1>
            <SignalPill label={`${uniqueEntries.length} entries`} tone="info" />
          </div>
          <ViewSource repo="bigclaw-ai" path="knowledge/KNOWLEDGE_HUB.md" />
        </div>
        <p className="text-sm text-muted-foreground">Knowledge hub, SDLC process, and governance</p>
      </div>

      {/* ── SDLC PROCESS ─────────────────────────────────────── */}
      {stages.length > 0 && (
        <>
          <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
            SDLC Process
          </div>
          <SectionCard title="8-Stage Pipeline" className="mb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border bg-muted">
                    <th className="text-left py-2.5 pl-3 pr-2">Stage</th>
                    <th className="text-left py-2.5 px-2">Who</th>
                    <th className="text-left py-2.5 px-2">Gate</th>
                    <th className="text-left py-2.5 pl-2 pr-3">Enforced By</th>
                  </tr>
                </thead>
                <tbody>
                  {stages.map((s, i) => (
                    <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                      <td className="py-2 pl-3 pr-2 font-medium text-foreground">{s.stage}</td>
                      <td className="py-2 px-2 text-muted-foreground">{s.who}</td>
                      <td className="py-2 px-2 text-muted-foreground">{s.gate}</td>
                      <td className="py-2 pl-2 pr-3 text-muted-foreground font-mono text-[10px]">{s.enforcedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

      {/* ── RECENT VIOLATIONS ────────────────────────────────── */}
      {violations.length > 0 && (
        <>
          <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
            Recent Violations
          </div>
          <SectionCard
            title={`${violations.length} violations logged`}
            className="mb-6"
          >
            <div className="flex items-center gap-4 mb-4 text-xs">
              {criticalCount > 0 && (
                <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 font-mono font-semibold">
                  {criticalCount} Critical
                </span>
              )}
              {highCount > 0 && (
                <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 font-mono font-semibold">
                  {highCount} High
                </span>
              )}
              {mediumCount > 0 && (
                <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 font-mono font-semibold">
                  {mediumCount} Medium
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border bg-muted">
                    <th className="text-left py-2.5 pl-3 pr-2">Date</th>
                    <th className="text-left py-2.5 px-2">Project</th>
                    <th className="text-left py-2.5 px-2">Violation</th>
                    <th className="text-left py-2.5 px-2">Severity</th>
                    <th className="text-left py-2.5 pl-2 pr-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {violations.map((v, i) => (
                    <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                      <td className="py-2 pl-3 pr-2 font-mono text-muted-foreground whitespace-nowrap">{v.date}</td>
                      <td className="py-2 px-2 text-foreground font-medium">{v.project}</td>
                      <td className="py-2 px-2"><span className="font-mono text-primary">{v.code}</span></td>
                      <td className="py-2 px-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SEVERITY_STYLES[v.severity] || 'bg-muted text-muted-foreground'}`}>
                          {v.severity}
                        </span>
                      </td>
                      <td className="py-2 pl-2 pr-3 text-muted-foreground max-w-[300px]">{v.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </>
      )}

      {/* ── KNOWLEDGE HUB ────────────────────────────────────── */}
      <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
        Knowledge Hub
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Total Entries</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{uniqueEntries.length}</div>
          <div className="text-xs text-muted-foreground mt-1">{domains.length} domains</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Opportunities</div>
          <div className="text-2xl font-bold font-mono text-green-400 mt-1">{opportunities}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Risks</div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1">{risks}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Documents</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{knowledgeFiles.length}</div>
          <div className="text-xs text-muted-foreground mt-1">reference files</div>
        </div>
      </div>

      {/* Interactive knowledge hub */}
      <KnowledgeHubView entries={uniqueEntries} knowledgeFiles={knowledgeFiles} />
    </div>
  );
}
