export const dynamic = 'force-dynamic';

import { fetchKnowledgeHub, fetchLearnings, fetchLessonsLearned } from '@/lib/github';
import { listKnowledgeEntries } from '@/lib/content';
import { SignalPill } from '@/components/dashboard';
import { ViewSource } from '@/components/view-source';
import { KnowledgeHubView } from '@/components/knowledge-hub-view';
import type { KHEntry } from '@/components/knowledge-hub-view';

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

// ── Lesson entry parser (LEARNINGS.md DEV-NNN structured entries) ──────
interface LessonEntry {
  id: string;
  date: string;
  project: string;
  title: string;
  rootCause: string;
  prevention: string;
  tags: string[];
  company: string;
}

function parseLessons(content: string): LessonEntry[] {
  const entries: LessonEntry[] = [];
  // Match both "### DEV-015 [date] [proj] — title" and "### [date] [proj] — title"
  const regex = /^### (DEV-\d+\s+)?\[(\d{4}-\d{2}-\d{2})\]\s+\[([^\]]+)\]\s+(?:[^\s]+\s+)?—\s+(.+)/gm;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const id = match[1]?.trim() || '';
    const date = match[2];
    const project = match[3];
    const title = match[4].trim();
    const start = match.index + match[0].length;
    const nextEntry = content.indexOf('\n### ', start);
    const block = content.slice(start, nextEntry === -1 ? undefined : nextEntry);
    const rootCause = block.match(/\*\*Root Cause:\*\*\s*(.+)/)?.[1]?.trim() || '';
    const prevention = block.match(/\*\*Prevention:\*\*\s*(.+)/)?.[1]?.trim() || '';
    const tags = block.match(/\*\*Tags:\*\*\s*(.+)/)?.[1]?.match(/#[\w-]+/g)?.map(t => t.slice(1)) || [];
    const company = block.match(/\*\*Company:\*\*\s*(.+)/)?.[1]?.trim() || project;
    entries.push({ id, date, project, title, rootCause, prevention, tags, company });
  }
  return entries;
}

// ── Impact map builder ─────────────────────────────────────────────────
const DOMAIN_TO_PROCESS: Record<string, string> = {
  market:   'PDLC S1 Research · S2 Define',
  product:  'PDLC S2 Define · S3 Design',
  dev:      'SDLC Build · Test · Review',
  ops:      'SDLC Deploy · Cron',
  finance:  'Finance · Budget Planning',
  infra:    'SDLC Deploy · Infra',
  security: 'SDLC Review · Deploy',
  general:  'All processes',
};

const KNOWN_PRODUCTS = ['GrovaKid', 'RADAR', 'iris-studio', 'fatfrogmodels', 'FairConnect', 'KeepTrack', 'SubCheck', 'CORTEX', 'REHEARSAL'];

function inferProjects(entries: KHEntry[], lessons: LessonEntry[]): Record<string, string[]> {
  const byDomain: Record<string, Set<string>> = {};
  for (const e of entries) {
    if (!byDomain[e.domain]) byDomain[e.domain] = new Set();
    const text = (e.what + ' ' + e.applied + ' ' + e.tags.join(' ')).toLowerCase();
    for (const p of KNOWN_PRODUCTS) {
      if (text.includes(p.toLowerCase())) byDomain[e.domain].add(p);
    }
    if (byDomain[e.domain].size === 0) byDomain[e.domain].add('All products');
  }
  for (const l of lessons) {
    const domain = l.tags.includes('nextjs') || l.tags.includes('react') || l.tags.includes('vercel') ? 'dev'
      : l.tags.includes('market') || l.tags.includes('competitor') ? 'market'
      : l.tags.some(t => ['stripe', 'revenue', 'pricing'].includes(t)) ? 'finance'
      : 'dev';
    if (!byDomain[domain]) byDomain[domain] = new Set();
    const companyLower = l.company.toLowerCase();
    if (companyLower.includes('forge')) {
      ['fatfrogmodels', 'iris-studio', 'FairConnect', 'KeepTrack'].forEach(p => byDomain[domain].add(p));
    } else if (companyLower.includes('axiom')) {
      byDomain[domain].add('RADAR');
    } else {
      byDomain[domain].add('All products');
    }
  }
  return Object.fromEntries(Object.entries(byDomain).map(([k, v]) => [k, [...v]]));
}

const FILE_META: Record<string, { title: string; category: string }> = {
  COST_MODEL:                 { title: 'Cost Model',              category: 'finance' },
  DEV_KNOWLEDGE_HUB:          { title: 'Dev Knowledge Hub',       category: 'dev' },
  INFRASTRUCTURE_ASSESSMENT:  { title: 'Infrastructure Assessment', category: 'infra' },
  INVESTMENT_PORTFOLIO:       { title: 'Investment Portfolio',     category: 'finance' },
  LEARNING_LOG_engineering:   { title: 'Learning Log — Engineering', category: 'dev' },
  LEARNING_LOG_finance:       { title: 'Learning Log — Finance',  category: 'finance' },
  TRADE_JOURNAL:              { title: 'Trade Journal',            category: 'finance' },
};

export default async function KnowledgePage() {
  const [khContent, learningsContent, lessonsContent, fileList] = await Promise.all([
    fetchKnowledgeHub().catch(() => null),
    fetchLearnings().catch(() => null),
    fetchLessonsLearned().catch(() => null),
    listKnowledgeEntries().catch(() => [] as string[]),
  ]);

  // Parse entries
  const rawEntries = khContent ? parseKHEntries(khContent) : [];
  const seen = new Set<string>();
  const entries = rawEntries.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; });

  const lessons = learningsContent ? parseLessons(learningsContent) : [];

  // Stats
  const domains = [...new Set(entries.map(e => e.domain))];
  const opportunities = entries.filter(e => e.type === 'OPPORTUNITY').length;
  const risks = entries.filter(e => e.type === 'RISK').length;

  // Impact map
  const projectsByDomain = inferProjects(entries, lessons);
  const domainCounts: Record<string, number> = {};
  for (const e of entries) domainCounts[e.domain] = (domainCounts[e.domain] || 0) + 1;
  for (const l of lessons) {
    const d = l.tags.includes('market') ? 'market' : 'dev';
    domainCounts[d] = (domainCounts[d] || 0) + 1;
  }
  const impactRows = Object.entries(DOMAIN_TO_PROCESS)
    .filter(([domain]) => domainCounts[domain] > 0)
    .map(([domain, process]) => ({
      domain,
      count: domainCounts[domain] || 0,
      process,
      projects: (projectsByDomain[domain] || ['All products']).slice(0, 4),
    }));

  const knowledgeFiles = fileList
    .filter(slug => slug !== 'KNOWLEDGE_HUB')
    .map(slug => ({
      slug,
      title: FILE_META[slug]?.title || slug.replace(/_/g, ' '),
      category: FILE_META[slug]?.category || 'general',
    }));

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 style={{ fontSize: '28px', fontWeight: 700 }}>Knowledge</h1>
            <SignalPill label={`${entries.length} KH · ${lessons.length} lessons`} tone="info" />
          </div>
          <ViewSource repo="bigclaw-ai" path="knowledge/KNOWLEDGE_HUB.md" />
        </div>
        <p className="text-sm text-muted-foreground">Intelligence hub — where each insight applies across processes and products</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">KH Entries</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{entries.length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{domains.length} domains</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Opportunities</div>
          <div className="text-2xl font-bold font-mono text-green-400 mt-1">{opportunities}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Risks</div>
          <div className="text-2xl font-bold font-mono text-red-400 mt-1">{risks}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Lessons Logged</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{lessons.length}</div>
        </div>
      </div>

      {/* Impact Map */}
      {impactRows.length > 0 && (
        <div className="rounded-xl border border-border bg-card mb-6 overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50 flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">Impact Map</span>
            <span className="text-[10px] text-muted-foreground">— where each domain's insights apply</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2.5 pl-4 pr-2">Domain</th>
                  <th className="text-left py-2.5 px-2">Items</th>
                  <th className="text-left py-2.5 px-2">Applies to Process</th>
                  <th className="text-left py-2.5 pl-2 pr-4">Applies to Project</th>
                </tr>
              </thead>
              <tbody>
                {impactRows.map((row, i) => (
                  <tr key={row.domain} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
                    <td className="py-2.5 pl-4 pr-2">
                      <span className="font-mono text-primary font-bold">{row.domain}</span>
                    </td>
                    <td className="py-2.5 px-2 text-foreground font-mono font-bold">{row.count}</td>
                    <td className="py-2.5 px-2 text-muted-foreground">{row.process}</td>
                    <td className="py-2.5 pl-2 pr-4 text-muted-foreground">
                      {row.projects.join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lessons Learned */}
      {lessons.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-3">
            Lessons Learned
            <span className="text-muted-foreground font-normal normal-case tracking-normal ml-2 text-xs">from LEARNINGS.md — logged after every bug fix &gt;10 min</span>
          </h2>
          <div className="space-y-2">
            {lessons.slice(0, 20).map((l, i) => (
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
                    <span className="text-muted-foreground/60">Root cause: </span>{l.rootCause.length > 120 ? l.rootCause.slice(0, 120) + '…' : l.rootCause}
                  </p>
                )}
                {l.prevention && (
                  <p className="text-[11px] text-green-400/80">
                    <span className="text-muted-foreground/60">Prevention: </span>{l.prevention.length > 120 ? l.prevention.slice(0, 120) + '…' : l.prevention}
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
            {lessons.length > 20 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Showing 20 of {lessons.length} lessons — view full log in LEARNINGS.md
              </p>
            )}
          </div>
        </div>
      )}

      {/* KH Entries (interactive) */}
      <div className="border-t border-border/30 pt-6">
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4">
          Intelligence Feed
          <span className="text-muted-foreground font-normal normal-case tracking-normal ml-2 text-xs">KNOWLEDGE_HUB.md — agent-sourced entries</span>
        </h2>
        <KnowledgeHubView entries={entries} knowledgeFiles={knowledgeFiles} />
      </div>
    </div>
  );
}
