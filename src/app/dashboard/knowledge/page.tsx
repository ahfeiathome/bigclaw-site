import { fetchKnowledgeHub } from '@/lib/github';
import { listKnowledgeEntries } from '@/lib/content';
import { SignalPill } from '@/components/dashboard';
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

    // Extract block until next ## or end
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
      id,
      agent,
      date,
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

// Map knowledge file slugs to human-readable titles and categories
const FILE_META: Record<string, { title: string; category: string }> = {
  COST_MODEL: { title: 'Cost Model', category: 'finance' },
  DEV_KNOWLEDGE_HUB: { title: 'Dev Knowledge Hub', category: 'dev' },
  INFRASTRUCTURE_ASSESSMENT: { title: 'Infrastructure Assessment', category: 'infra' },
  INVESTMENT_PORTFOLIO: { title: 'Investment Portfolio', category: 'finance' },
  LEARNING_LOG_engineering: { title: 'Learning Log — Engineering', category: 'dev' },
  LEARNING_LOG_finance: { title: 'Learning Log — Finance', category: 'finance' },
  TRADE_JOURNAL: { title: 'Trade Journal', category: 'finance' },
};

export default async function KnowledgeHubPage() {
  const [khContent, fileList] = await Promise.all([
    fetchKnowledgeHub(),
    listKnowledgeEntries(),
  ]);

  const entries = khContent ? parseKHEntries(khContent) : [];

  // Deduplicate entries by ID (keep first occurrence = highest number typically)
  const seen = new Set<string>();
  const uniqueEntries = entries.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  // Build file list excluding KNOWLEDGE_HUB itself (already parsed above)
  const knowledgeFiles = fileList
    .filter(slug => slug !== 'KNOWLEDGE_HUB')
    .map(slug => ({
      slug,
      title: FILE_META[slug]?.title || slug.replace(/_/g, ' '),
      category: FILE_META[slug]?.category || 'general',
    }));

  // Stats
  const domains = [...new Set(uniqueEntries.map(e => e.domain))];
  const types = [...new Set(uniqueEntries.map(e => e.type))];
  const opportunities = uniqueEntries.filter(e => e.type === 'OPPORTUNITY').length;
  const risks = uniqueEntries.filter(e => e.type === 'RISK').length;

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
        <p className="text-sm text-muted-foreground">Agent intelligence feed — market research, patterns, risks, and opportunities</p>
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

      {/* Interactive section */}
      <KnowledgeHubView entries={uniqueEntries} knowledgeFiles={knowledgeFiles} />
    </div>
  );
}
