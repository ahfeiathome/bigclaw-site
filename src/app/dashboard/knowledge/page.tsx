export const dynamic = 'force-dynamic';

import { fetchGraphReport, fetchKnowledgeHub, fetchLearnings, fetchLessonsLearned } from '@/lib/github';
import { listKnowledgeEntries } from '@/lib/content';
import { SectionCard, SignalPill } from '@/components/dashboard';
import { ViewSource } from '@/components/view-source';
import { KnowledgeHubView } from '@/components/knowledge-hub-view';
import type { KHEntry } from '@/components/knowledge-hub-view';

// ── Graph Report parsers ───────────────────────────────────────────────

interface GraphStats {
  nodes: number;
  edges: number;
  communities: number;
  extractedPct: number;
  buildDate: string;
}

function parseGraphStats(content: string): GraphStats | null {
  const dateMatch = content.match(/# Graph Report.*?\((\d{4}-\d{2}-\d{2})\)/);
  const summaryMatch = content.match(/(\d+)\s+nodes\s+·\s+(\d+)\s+edges\s+·\s+(\d+)\s+communities/);
  const extractedMatch = content.match(/(\d+)%\s+EXTRACTED/);
  if (!summaryMatch) return null;
  return {
    nodes: parseInt(summaryMatch[1]),
    edges: parseInt(summaryMatch[2]),
    communities: parseInt(summaryMatch[3]),
    extractedPct: extractedMatch ? parseInt(extractedMatch[1]) : 0,
    buildDate: dateMatch?.[1] || '',
  };
}

interface GodNode { rank: number; name: string; edges: number }

function parseGodNodes(content: string): GodNode[] {
  const section = content.split('## God Nodes')[1]?.split('\n##')[0] || '';
  const nodes: GodNode[] = [];
  for (const line of section.split('\n')) {
    const m = line.match(/^(\d+)\.\s+`([^`]+)`\s+-\s+(\d+)\s+edges?/);
    if (m) nodes.push({ rank: parseInt(m[1]), name: m[2], edges: parseInt(m[3]) });
  }
  return nodes.slice(0, 10);
}

interface SurprisingConnection { from: string; rel: string; to: string; confidence: string; fromFile: string; toFile: string }

function parseSurprisingConnections(content: string): SurprisingConnection[] {
  const section = content.split('## Surprising Connections')[1]?.split('\n##')[0] || '';
  const connections: SurprisingConnection[] = [];
  const lines = section.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^-\s+`([^`]+)`\s+--([^-]+)-->\s+`([^`]+)`\s+\[(\w+)\]/);
    if (m) {
      const fileLine = lines[i + 1]?.trim() || '';
      const [fromFile, toFile] = fileLine.split(' → ');
      connections.push({
        from: m[1], rel: m[2], to: m[3], confidence: m[4],
        fromFile: fromFile || '', toFile: toFile || '',
      });
    }
  }
  return connections.slice(0, 5);
}

interface SuggestedQuestion { question: string; reason: string }

function parseSuggestedQuestions(content: string): SuggestedQuestion[] {
  const section = content.split('## Suggested Questions')[1]?.split('\n##')[0] || '';
  const questions: SuggestedQuestion[] = [];
  for (const line of section.split('\n')) {
    const m = line.match(/^\*\*(.+?)\*\*/);
    if (m) {
      const reason = line.match(/_(.+)_/)?.[1] || '';
      questions.push({ question: m[1], reason });
    }
  }
  return questions.slice(0, 5);
}

// ── KH entry parser ────────────────────────────────────────────────────
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
    entries.push({
      id,
      agent,
      date,
      type: block.match(/\*\*Type:\*\*\s*(\S+)/)?.[1] || 'LEARN',
      domain: block.match(/\*\*Domain:\*\*\s*(\S+)/)?.[1] || 'general',
      what: block.match(/\*\*What:\*\*\s*(.+)/)?.[1]?.trim() || '',
      source: block.match(/\*\*Source:\*\*\s*(.+)/)?.[1]?.trim() || '',
      applied: block.match(/\*\*Applied:\*\*\s*(.+)/)?.[1]?.trim() || '',
      tags: block.match(/\*\*Tags:\*\*\s*(.+)/)?.[1]?.match(/#[\w-]+/g)?.map(t => t.slice(1)) || [],
    });
  }
  return entries;
}

// ── Lesson parser ──────────────────────────────────────────────────────
interface LessonEntry {
  id: string; date: string; project: string; title: string;
  rootCause: string; prevention: string; tags: string[];
}

function parseLessons(content: string): LessonEntry[] {
  const entries: LessonEntry[] = [];
  const regex = /^### (DEV-\d+\s+)?\[(\d{4}-\d{2}-\d{2})\]\s+\[([^\]]+)\]\s+(?:[^\s]+\s+)?—\s+(.+)/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const start = match.index + match[0].length;
    const nextEntry = content.indexOf('\n### ', start);
    const block = content.slice(start, nextEntry === -1 ? undefined : nextEntry);
    entries.push({
      id: match[1]?.trim() || '',
      date: match[2],
      project: match[3],
      title: match[4].trim(),
      rootCause: block.match(/\*\*Root Cause:\*\*\s*(.+)/)?.[1]?.trim() || '',
      prevention: block.match(/\*\*Prevention:\*\*\s*(.+)/)?.[1]?.trim() || '',
      tags: block.match(/\*\*Tags:\*\*\s*(.+)/)?.[1]?.match(/#[\w-]+/g)?.map(t => t.slice(1)) || [],
    });
  }
  return entries;
}

// ── God node color by rank ─────────────────────────────────────────────
function godNodeColor(rank: number): string {
  if (rank <= 2) return 'text-red-400';
  if (rank <= 4) return 'text-orange-400';
  if (rank <= 6) return 'text-amber-400';
  if (rank <= 8) return 'text-yellow-400';
  return 'text-green-400';
}

function godNodeDot(rank: number): string {
  if (rank <= 2) return 'bg-red-400';
  if (rank <= 4) return 'bg-orange-400';
  if (rank <= 6) return 'bg-amber-400';
  if (rank <= 8) return 'bg-yellow-400';
  return 'bg-green-400';
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

// ── Page ──────────────────────────────────────────────────────────────

export default async function KnowledgePage() {
  const [graphReport, khContent, learningsContent, lessonsContent, fileList] = await Promise.all([
    fetchGraphReport().catch(() => null),
    fetchKnowledgeHub().catch(() => null),
    fetchLearnings().catch(() => null),
    fetchLessonsLearned().catch(() => null),
    listKnowledgeEntries().catch(() => [] as string[]),
  ]);

  // Graph data
  const graphStats = graphReport ? parseGraphStats(graphReport) : null;
  const godNodes = graphReport ? parseGodNodes(graphReport) : [];
  const surprisingConnections = graphReport ? parseSurprisingConnections(graphReport) : [];
  const suggestedQuestions = graphReport ? parseSuggestedQuestions(graphReport) : [];

  // KH entries
  const rawEntries = khContent ? parseKHEntries(khContent) : [];
  const seen = new Set<string>();
  const entries = rawEntries.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });

  // Lessons
  const lessons = learningsContent ? parseLessons(learningsContent) : [];

  const knowledgeFiles = fileList
    .filter(slug => slug !== 'KNOWLEDGE_HUB')
    .map(slug => ({
      slug,
      title: FILE_META[slug]?.title || slug.replace(/_/g, ' '),
      category: FILE_META[slug]?.category || 'general',
    }));

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Knowledge Hub</h1>
            {graphStats && <SignalPill label={`${graphStats.nodes.toLocaleString()} nodes`} tone="info" />}
          </div>
          <ViewSource repo="bigclaw-ai" path="graphify-out/GRAPH_REPORT.md" />
        </div>
        <p className="text-sm text-muted-foreground">
          Codebase knowledge graph — {graphStats
            ? `${graphStats.edges.toLocaleString()} edges · ${graphStats.communities} communities · built ${graphStats.buildDate}`
            : 'Graphify report unavailable'}
        </p>
      </div>

      {/* ── No graph fallback ────────────────────────────────────── */}
      {!graphStats && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 mb-6 text-center">
          <div className="text-2xl mb-2">🕸️</div>
          <div className="text-sm font-semibold text-foreground mb-1">No knowledge graph built yet</div>
          <div className="text-xs text-muted-foreground mb-3">Run Graphify to build the codebase graph: <code className="font-mono text-primary">graphify build .</code></div>
          <a href="/dashboard/knowledge/KNOWLEDGE_CAPTURE_FLOW" className="text-xs text-primary hover:underline">
            See setup guide →
          </a>
        </div>
      )}

      {graphStats && (
        <>
          {/* ── Stats row ──────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Nodes</div>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{graphStats.nodes.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">functions · files · concepts</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Edges</div>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{graphStats.edges.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{graphStats.extractedPct}% extracted</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Communities</div>
              <div className="text-2xl font-bold font-mono text-foreground mt-1">{graphStats.communities}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Leiden clusters</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Built</div>
              <div className="text-xl font-bold font-mono text-foreground mt-1">{graphStats.buildDate || '—'}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">last run</div>
            </div>
          </div>

          {/* ── God Nodes ──────────────────────────────────────────── */}
          {godNodes.length > 0 && (
            <SectionCard title="God Nodes — Most Connected Abstractions" className="mb-5">
              <p className="text-[11px] text-muted-foreground mb-3">
                Nodes with the highest edge count — your most critical abstractions. Changes here have the widest blast radius.
              </p>
              <div className="space-y-2">
                {godNodes.map(node => (
                  <div key={node.rank} className="flex items-center gap-3">
                    <span className="text-[10px] text-muted-foreground font-mono w-4 text-right">{node.rank}.</span>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${godNodeDot(node.rank)}`} />
                    <code className={`text-xs font-mono font-bold flex-1 ${godNodeColor(node.rank)}`}>{node.name}</code>
                    <span className="text-[10px] text-muted-foreground font-mono">{node.edges} edges</span>
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${godNodeDot(node.rank)}`}
                        style={{ width: `${Math.min(100, (node.edges / (godNodes[0]?.edges || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* ── Surprising Connections + Suggested Questions ────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {surprisingConnections.length > 0 && (
              <SectionCard title="Surprising Connections">
                <p className="text-[11px] text-muted-foreground mb-3">Cross-repo relationships the graph discovered.</p>
                <div className="space-y-3">
                  {surprisingConnections.map((conn, i) => (
                    <div key={i} className="text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <code className="text-primary font-mono">{conn.from}</code>
                        <span className="text-muted-foreground text-[10px]">--{conn.rel}--{'>'}</span>
                        <code className="text-green-400 font-mono">{conn.to}</code>
                        <span className={`text-[9px] px-1 py-0.5 rounded font-mono ${
                          conn.confidence === 'EXTRACTED' ? 'bg-green-500/10 text-green-400' :
                          conn.confidence === 'INFERRED' ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>{conn.confidence}</span>
                      </div>
                      {conn.fromFile && (
                        <div className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                          {conn.fromFile.split('/').slice(-2).join('/')} → {conn.toFile.split('/').slice(-2).join('/')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {suggestedQuestions.length > 0 && (
              <SectionCard title="Suggested Questions">
                <p className="text-[11px] text-muted-foreground mb-3">Questions this graph is uniquely positioned to answer.</p>
                <div className="space-y-3">
                  {suggestedQuestions.map((q, i) => (
                    <div key={i} className="text-xs">
                      <div className="text-foreground font-medium mb-0.5">{q.question}</div>
                      {q.reason && <div className="text-[10px] text-muted-foreground/70 italic">{q.reason.slice(0, 100)}{q.reason.length > 100 ? '…' : ''}</div>}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        </>
      )}

      {/* ── Article Capture (not configured yet) ───────────────────── */}
      <div className="rounded-xl border border-border/40 bg-muted/20 p-4 mb-5 flex items-start gap-3">
        <span className="text-lg mt-0.5">📥</span>
        <div>
          <div className="text-xs font-semibold text-foreground mb-0.5">Article Capture — Not Configured</div>
          <div className="text-[11px] text-muted-foreground">
            Hermes Capture isn&apos;t running yet. Once set up, this section will show capture activity,
            recent articles, and how they connect to the product portfolio.
          </div>
          <a href="/dashboard/knowledge/KNOWLEDGE_CAPTURE_FLOW" className="text-[11px] text-primary hover:underline mt-1 block">
            See knowledge/KNOWLEDGE_CAPTURE_FLOW.md →
          </a>
        </div>
      </div>

      {/* ── Lessons Learned ────────────────────────────────────────── */}
      {lessons.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Lessons Learned</h2>
            <span className="text-[10px] text-muted-foreground">{lessons.length} entries from LEARNINGS.md</span>
          </div>
          <div className="space-y-2">
            {lessons.slice(0, 15).map((l, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {l.id && <span className="text-[10px] font-bold font-mono text-primary">{l.id}</span>}
                    <span className="text-xs font-medium text-foreground">{l.title}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">{l.project} · {l.date}</span>
                </div>
                {l.rootCause && (
                  <p className="text-[11px] text-muted-foreground mb-1">
                    <span className="text-muted-foreground/60">Root cause: </span>
                    {l.rootCause.length > 120 ? l.rootCause.slice(0, 120) + '…' : l.rootCause}
                  </p>
                )}
                {l.prevention && (
                  <p className="text-[11px] text-green-400/80">
                    <span className="text-muted-foreground/60">Prevention: </span>
                    {l.prevention.length > 120 ? l.prevention.slice(0, 120) + '…' : l.prevention}
                  </p>
                )}
                {l.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {l.tags.slice(0, 6).map(t => (
                      <span key={t} className="text-[10px] text-muted-foreground font-mono">#{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {lessons.length > 15 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Showing 15 of {lessons.length} — view full log in LEARNINGS.md
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Intelligence Feed (KH entries) ────────────────────────── */}
      {entries.length > 0 && (
        <div className="border-t border-border/30 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Intelligence Feed</h2>
            <span className="text-[10px] text-muted-foreground">{entries.length} entries · KNOWLEDGE_HUB.md</span>
          </div>
          <KnowledgeHubView entries={entries} knowledgeFiles={knowledgeFiles} />
        </div>
      )}
    </div>
  );
}
