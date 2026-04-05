'use client';

import { useState, useMemo } from 'react';
import { StatusDot, SignalPill } from './dashboard';
import Link from 'next/link';

export interface KHEntry {
  id: string;
  agent: string;
  date: string;
  type: string;
  domain: string;
  what: string;
  source: string;
  applied: string;
  tags: string[];
}

interface KnowledgeHubViewProps {
  entries: KHEntry[];
  knowledgeFiles: { slug: string; title: string; category: string }[];
}

const DOMAIN_COLORS: Record<string, string> = {
  market: 'bg-blue-500/10 text-blue-400',
  product: 'bg-green-500/10 text-green-400',
  dev: 'bg-purple-500/10 text-purple-400',
  ops: 'bg-amber-500/10 text-amber-400',
  finance: 'bg-emerald-500/10 text-emerald-400',
  infra: 'bg-cyan-500/10 text-cyan-400',
  security: 'bg-red-500/10 text-red-400',
};

const TYPE_TONES: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  OPPORTUNITY: 'success',
  RISK: 'error',
  PATTERN: 'info',
  LEARN: 'neutral',
};

function domainColor(domain: string): string {
  return DOMAIN_COLORS[domain.toLowerCase()] || 'bg-muted text-muted-foreground';
}

export function KnowledgeHubView({ entries, knowledgeFiles }: KnowledgeHubViewProps) {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const domains = useMemo(() => [...new Set(entries.map(e => e.domain))].sort(), [entries]);
  const types = useMemo(() => [...new Set(entries.map(e => e.type))].sort(), [entries]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return entries.filter(e => {
      if (domainFilter && e.domain !== domainFilter) return false;
      if (typeFilter && e.type !== typeFilter) return false;
      if (q && !e.what.toLowerCase().includes(q) && !e.tags.some(t => t.includes(q)) && !e.id.toLowerCase().includes(q) && !e.agent.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, search, domainFilter, typeFilter]);

  return (
    <div>
      {/* Search + filters */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search entries..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 mb-3"
        />
        <div className="flex flex-wrap gap-1.5">
          {/* Domain filters */}
          {domains.map(d => (
            <button
              key={d}
              onClick={() => setDomainFilter(domainFilter === d ? null : d)}
              className={`text-[10px] px-2 py-1 rounded-full font-mono transition-all ${
                domainFilter === d ? 'ring-1 ring-primary ' + domainColor(d) : domainColor(d) + ' opacity-60 hover:opacity-100'
              }`}
            >
              {d}
            </button>
          ))}
          <span className="text-muted-foreground text-[10px] mx-1 self-center">|</span>
          {/* Type filters */}
          {types.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? null : t)}
              className={`text-[10px] px-2 py-1 rounded-full font-mono transition-all ${
                typeFilter === t ? 'ring-1 ring-primary bg-primary/10 text-primary' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </button>
          ))}
          {(domainFilter || typeFilter || search) && (
            <button
              onClick={() => { setDomainFilter(null); setTypeFilter(null); setSearch(''); }}
              className="text-[10px] px-2 py-1 text-red-400 hover:text-red-300"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-muted-foreground mb-4 font-mono">
        {filtered.length} of {entries.length} entries
        {domainFilter && <span> in <span className="text-foreground">{domainFilter}</span></span>}
        {typeFilter && <span> of type <span className="text-foreground">{typeFilter}</span></span>}
      </div>

      {/* KH Entry Cards */}
      <div className="space-y-3 mb-8">
        {filtered.map(entry => (
          <KHEntryCard key={entry.id} entry={entry} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">No entries match your search</p>
          </div>
        )}
      </div>

      {/* Knowledge Files */}
      {knowledgeFiles.length > 0 && (
        <div className="border-t border-border pt-6">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide mb-4">Reference Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {knowledgeFiles.map(f => (
              <Link
                key={f.slug}
                href={`/dashboard/knowledge/${f.slug}`}
                className="rounded-xl border border-border bg-card p-4 hover:border-primary/30 transition-all no-underline group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary">{f.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${domainColor(f.category)}`}>{f.category}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto group-hover:text-primary">View →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KHEntryCard({ entry }: { entry: KHEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:border-border/80 transition-all">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-bold font-mono text-primary">{entry.id}</span>
            <SignalPill label={entry.type} tone={TYPE_TONES[entry.type] || 'neutral'} />
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${domainColor(entry.domain)}`}>{entry.domain}</span>
            <span className="text-[10px] text-muted-foreground font-mono ml-auto">{entry.agent} · {entry.date}</span>
          </div>
          <p
            className={`text-sm text-foreground/90 leading-relaxed ${expanded ? '' : 'line-clamp-2'} cursor-pointer`}
            onClick={() => setExpanded(!expanded)}
          >
            {entry.what}
          </p>
          {expanded && (
            <div className="mt-2 space-y-1">
              {entry.source && (
                <div className="text-[10px] text-muted-foreground">
                  <span className="text-muted-foreground/60">Source: </span>
                  <a href={entry.source.split(' + ')[0]} target="_blank" rel="noopener noreferrer" className="text-primary no-underline hover:underline break-all">
                    {entry.source.length > 80 ? entry.source.slice(0, 80) + '...' : entry.source}
                  </a>
                </div>
              )}
              <div className="text-[10px] text-muted-foreground">
                <span className="text-muted-foreground/60">Applied: </span>{entry.applied}
              </div>
            </div>
          )}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.tags.map(tag => (
                <span key={tag} className="text-[10px] text-muted-foreground font-mono">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
