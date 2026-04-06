import { fetchAllIssues, fetchRecentClosedIssues } from '@/lib/github';
import { SectionCard, SignalPill, StatusDot } from './dashboard';
import { PrdChecklist, type PrdItem } from './prd-checklist';

interface ProductPageProps {
  name: string;
  company: 'Forge' | 'Axiom' | 'Nexus';
  pdlcStage: string;
  status: 'active' | 'shelved' | 'launched';
  previewUrl?: string;
  productionUrl?: string;
  repoSlug?: string;
  prdItems?: PrdItem[];
  description: string;
  nextGate?: string;
  blocker?: string;
  revenueModel?: string;
  shelvedReason?: string;
  revivalCondition?: string;
}

const COMPANY_COLORS: Record<string, string> = {
  Forge: 'bg-green-500/10 text-green-400',
  Axiom: 'bg-blue-500/10 text-blue-400',
  Nexus: 'bg-purple-500/10 text-purple-400',
};

function stageTone(stage: string): 'neutral' | 'info' | 'warning' | 'success' {
  if (stage.includes('S1') || stage.includes('S2') || stage.includes('S3')) return 'info';
  if (stage.includes('S4') || stage.includes('S5')) return 'warning';
  if (stage.includes('S6') || stage.includes('S7') || stage.includes('S8')) return 'success';
  return 'neutral';
}

function hasGate(text: string): boolean {
  return text.includes('💳') || text.includes('⚖️') || text.includes('🧠');
}

export async function ProductPage(props: ProductPageProps) {
  const { name, company, pdlcStage, status, previewUrl, productionUrl, repoSlug, prdItems, description, nextGate, blocker, revenueModel, shelvedReason, revivalCondition } = props;

  // Fetch issues if repo provided
  const [allIssues, closedIssues] = repoSlug
    ? await Promise.all([fetchAllIssues(), fetchRecentClosedIssues(14)])
    : [[], []];

  const productIssues = repoSlug ? allIssues.filter(i => i.repo === repoSlug) : [];
  const productClosed = repoSlug ? closedIssues.filter(i => i.repo === repoSlug) : [];
  const p0Count = productIssues.filter(i => i.labels.includes('P0')).length;
  const p1Count = productIssues.filter(i => i.labels.includes('P1')).length;

  // Check live status
  let liveStatus: 'online' | 'offline' | 'none' = 'none';
  const liveUrl = productionUrl || previewUrl;
  if (liveUrl) {
    try {
      const res = await fetch(liveUrl, { method: 'HEAD', next: { revalidate: 300 } });
      liveStatus = res.ok ? 'online' : 'offline';
    } catch { liveStatus = 'offline'; }
  }

  return (
    <div className={status === 'shelved' ? 'opacity-70' : ''}>
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 style={{ fontSize: '28px', fontWeight: 700 }}>{name}</h1>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${COMPANY_COLORS[company]}`}>{company}</span>
          <SignalPill label={pdlcStage} tone={stageTone(pdlcStage)} />
          {liveStatus !== 'none' && (
            <div className="flex items-center gap-1.5 ml-auto">
              <StatusDot status={liveStatus === 'online' ? 'good' : 'bad'} size="sm" />
              <span className="text-xs text-muted-foreground font-mono">{liveStatus === 'online' ? 'Online' : 'Offline'}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* ── Shelved banner ──────────────────────────────────── */}
      {status === 'shelved' && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 mb-6 text-sm">
          <span className="text-amber-400 font-semibold">Shelved</span>
          {shelvedReason && <span className="text-muted-foreground"> — {shelvedReason}</span>}
          {revivalCondition && <div className="text-xs text-muted-foreground mt-1">Revival: {revivalCondition}</div>}
        </div>
      )}

      {/* ── Live Site links ─────────────────────────────────── */}
      {(previewUrl || productionUrl) && (
        <SectionCard title="Live Site" className="mb-6">
          <div className="flex flex-wrap gap-6 text-sm">
            {previewUrl && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Preview</span>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-primary no-underline hover:underline font-mono text-xs truncate max-w-[200px]">{previewUrl.replace('https://', '')}</a>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary no-underline hover:bg-primary/20">→ Open</a>
              </div>
            )}
            {productionUrl && productionUrl !== previewUrl && (
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Production</span>
                <a href={productionUrl} target="_blank" rel="noopener noreferrer" className="text-primary no-underline hover:underline font-mono text-xs truncate max-w-[200px]">{productionUrl.replace('https://', '')}</a>
                <a href={productionUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary no-underline hover:bg-primary/20">→ Open</a>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">PDLC Stage</div>
          <div className="text-sm font-bold font-mono text-foreground mt-1">{pdlcStage}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Company</div>
          <div className="mt-1"><span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${COMPANY_COLORS[company]}`}>{company}</span></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</div>
          <div className="text-sm font-mono text-foreground mt-1">{revenueModel || '—'}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Status</div>
          <div className="text-sm font-mono text-foreground mt-1 capitalize">{status}</div>
        </div>
      </div>

      {/* ── Next Gate + Blocker ──────────────────────────────── */}
      {(nextGate || blocker) && (
        <div className={`rounded-xl border p-4 mb-6 ${blocker && hasGate(blocker) ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-card'}`}>
          {nextGate && <div className="text-sm text-foreground mb-1"><span className="text-muted-foreground">Next gate:</span> {nextGate}</div>}
          {blocker && <div className={`text-sm ${hasGate(blocker) ? 'text-amber-400' : 'text-muted-foreground'}`}><span className="text-muted-foreground">Blocker:</span> {blocker}</div>}
        </div>
      )}

      {/* ── PRD Checklist ───────────────────────────────────── */}
      {prdItems && prdItems.length > 0 && (
        <SectionCard title={`PRD Checklist — ${prdItems.length} Items`} className="mb-6">
          <PrdChecklist items={prdItems} repoSlug={repoSlug || ''} />
        </SectionCard>
      )}

      {/* ── Open Issues ─────────────────────────────────────── */}
      {repoSlug && (
        <SectionCard title={`Issues (${productIssues.length})`} className="mb-6">
          <div className="flex items-center gap-4 mb-3 text-xs">
            {p0Count > 0 && <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 font-mono font-semibold">{p0Count} P0</span>}
            {p1Count > 0 && <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 font-mono font-semibold">{p1Count} P1</span>}
            {productIssues.length === 0 && <span className="text-green-400">No open issues</span>}
          </div>
          {productClosed.length > 0 && (
            <div className="border-t border-border pt-3">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Recently Closed</div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {productClosed.slice(0, 5).map((issue, i) => (
                  <a key={i} href={issue.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs no-underline hover:bg-muted/50 rounded p-1">
                    <StatusDot status="good" size="sm" />
                    <span className="text-foreground">#{issue.number} {issue.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}
