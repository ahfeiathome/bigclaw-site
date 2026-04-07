import { fetchAllIssues, fetchRecentClosedIssues } from '@/lib/github';
import { SectionCard, SignalPill, StatusDot } from './dashboard';
import { PrdChecklist, type PrdItem } from './prd-checklist';
import { ProductIntelligencePanel } from './product-intelligence';
import { fetchProductIntel } from '@/lib/product-intel';

interface ProductPageProps {
  name: string;
  company: 'Forge' | 'Axiom' | 'Nexus' | 'BigClaw AI';
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
  'BigClaw AI': 'bg-purple-500/10 text-purple-400',
};

const PDLC_STAGES = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'];

function stageTone(stage: string): 'neutral' | 'info' | 'warning' | 'success' {
  if (stage.includes('S1') || stage.includes('S2') || stage.includes('S3')) return 'info';
  if (stage.includes('S4') || stage.includes('S5')) return 'warning';
  if (stage.includes('S6') || stage.includes('S7') || stage.includes('S8')) return 'success';
  return 'neutral';
}

function hasGate(text: string): boolean {
  return text.includes('💳') || text.includes('⚖️') || text.includes('🧠');
}

function currentStageNum(stage: string): number {
  const match = stage.match(/S(\d)/);
  return match ? parseInt(match[1]) : 0;
}

export async function ProductPage(props: ProductPageProps) {
  const { name, company, pdlcStage, status, previewUrl, productionUrl, repoSlug, prdItems, description, nextGate, blocker, revenueModel, shelvedReason, revivalCondition } = props;

  const [allIssues, closedIssues, intel] = await Promise.all([
    repoSlug ? fetchAllIssues() : Promise.resolve([]),
    repoSlug ? fetchRecentClosedIssues(30) : Promise.resolve([]),
    fetchProductIntel(name),
  ]);

  const productIssues = repoSlug ? allIssues.filter(i => i.repo === repoSlug) : [];
  const productClosed = repoSlug ? closedIssues.filter(i => i.repo === repoSlug) : [];
  const p0Count = productIssues.filter(i => i.labels.includes('P0')).length;
  const p1Count = productIssues.filter(i => i.labels.includes('P1')).length;

  let liveStatus: 'online' | 'offline' | 'none' = 'none';
  const liveUrl = productionUrl || previewUrl;
  if (liveUrl) {
    try {
      const res = await fetch(liveUrl, { method: 'HEAD', next: { revalidate: 300 } });
      liveStatus = res.ok ? 'online' : 'offline';
    } catch { liveStatus = 'offline'; }
  }

  const stageNum = currentStageNum(pdlcStage);

  return (
    <div className={status === 'shelved' ? 'opacity-70' : ''}>
      {/* ── SECTION 1: Product Summary ──────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h1 style={{ fontSize: '28px', fontWeight: 700 }}>{name}</h1>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${COMPANY_COLORS[company] || 'bg-blue-500/10 text-blue-400'}`}>{company}</span>
          <SignalPill label={pdlcStage} tone={stageTone(pdlcStage)} />
          {liveStatus !== 'none' && (
            <div className="flex items-center gap-1.5 ml-auto">
              <StatusDot status={liveStatus === 'online' ? 'good' : 'bad'} size="sm" />
              <span className="text-xs text-muted-foreground font-mono">{liveStatus === 'online' ? 'Online' : 'Offline'}</span>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>

        {status === 'shelved' && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-4 text-sm">
            <span className="text-amber-400 font-semibold">Shelved</span>
            {shelvedReason && <span className="text-muted-foreground"> — {shelvedReason}</span>}
            {revivalCondition && <div className="text-xs text-muted-foreground mt-1">Revival: {revivalCondition}</div>}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Stage</div>
            <div className="text-sm font-bold font-mono text-foreground mt-1">{pdlcStage}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</div>
            <div className="text-sm font-mono text-foreground mt-1">{revenueModel || '—'}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Issues</div>
            <div className="text-sm font-mono text-foreground mt-1">
              {productIssues.length} open
              {p0Count > 0 && <span className="ml-1 text-red-400 text-xs">{p0Count} P0</span>}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Live URL</div>
            <div className="mt-1">
              {liveUrl
                ? <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary no-underline hover:underline font-mono truncate block">{liveUrl.replace('https://', '')}</a>
                : <span className="text-xs text-muted-foreground">—</span>}
            </div>
          </div>
        </div>

        {(nextGate || blocker) && (
          <div className={`rounded-xl border p-3 ${blocker && hasGate(blocker) ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-card'}`}>
            {nextGate && <div className="text-xs text-foreground"><span className="text-muted-foreground">Next gate:</span> {nextGate}</div>}
            {blocker && <div className={`text-xs mt-1 ${hasGate(blocker) ? 'text-amber-400' : 'text-muted-foreground'}`}><span className="text-muted-foreground">Blocker:</span> {blocker}</div>}
          </div>
        )}
      </div>

      {/* ── SECTION 2: PDLC + SDLC Progress ────────────────── */}
      <SectionCard title="PDLC + SDLC Progress" className="mb-6">
        {/* PDLC Progress Bar */}
        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">PDLC Stage Progression</div>
          <div className="flex items-center gap-1">
            {PDLC_STAGES.map((s, i) => {
              const num = i + 1;
              const isCurrent = num === stageNum;
              const isPast = num < stageNum;
              const bg = isCurrent ? 'bg-primary text-primary-foreground' : isPast ? 'bg-green-500/30 text-green-400' : 'bg-muted text-muted-foreground/50';
              return (
                <div key={s} className="flex items-center gap-1">
                  <div className={`px-2 py-1 rounded text-[10px] font-mono font-bold ${bg}`}>{s}</div>
                  {i < PDLC_STAGES.length - 1 && (
                    <div className={`w-4 h-px ${isPast ? 'bg-green-500/50' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Intelligence (S1/S2/S3 + staleness) */}
        {intel && <ProductIntelligencePanel intel={intel} />}

        {/* PRD Checklist */}
        {prdItems && prdItems.length > 0 && (
          <div className="mt-4">
            <PrdChecklist items={prdItems} repoSlug={repoSlug || ''} />
          </div>
        )}
      </SectionCard>

      {/* ── SECTION 3: Issues Trend ────────────────────────── */}
      {repoSlug && (
        <SectionCard title="Issues Trend (30 days)" className="mb-6">
          {/* Open vs Closed bar */}
          <div className="mb-4">
            <div className="flex items-center gap-4 text-xs mb-2">
              <span className="text-muted-foreground">Open: <span className="text-foreground font-mono">{productIssues.length}</span></span>
              <span className="text-muted-foreground">Closed (30d): <span className="text-foreground font-mono">{productClosed.length}</span></span>
            </div>
            <div className="flex gap-1 h-4 rounded overflow-hidden">
              {productIssues.length > 0 && (
                <div
                  className="bg-amber-500/40 rounded-l"
                  style={{ width: `${Math.max(10, (productIssues.length / Math.max(productIssues.length + productClosed.length, 1)) * 100)}%` }}
                  title={`${productIssues.length} open`}
                />
              )}
              {productClosed.length > 0 && (
                <div
                  className="bg-green-500/40 rounded-r"
                  style={{ width: `${Math.max(10, (productClosed.length / Math.max(productIssues.length + productClosed.length, 1)) * 100)}%` }}
                  title={`${productClosed.length} closed`}
                />
              )}
              {productIssues.length === 0 && productClosed.length === 0 && (
                <div className="bg-muted w-full rounded" />
              )}
            </div>
            <div className="flex gap-4 mt-1 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500/40 inline-block" /> Open</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500/40 inline-block" /> Closed</span>
            </div>
          </div>

          {/* P0/P1 badges */}
          <div className="flex items-center gap-3 mb-3 text-xs">
            {p0Count > 0 && <span className="px-2 py-1 rounded bg-red-500/20 text-red-400 font-mono font-semibold">{p0Count} P0</span>}
            {p1Count > 0 && <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 font-mono font-semibold">{p1Count} P1</span>}
            {p0Count === 0 && p1Count === 0 && productIssues.length === 0 && <span className="text-green-400">No open issues</span>}
          </div>

          {/* Open issues list */}
          {productIssues.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {productIssues.slice(0, 8).map((issue, i) => {
                const priority = issue.labels.includes('P0') ? 'P0' : issue.labels.includes('P1') ? 'P1' : '';
                return (
                  <a key={i} href={issue.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs no-underline hover:bg-muted/50 rounded p-1">
                    <span className="text-muted-foreground font-mono">#{issue.number}</span>
                    {priority && <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${priority === 'P0' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>{priority}</span>}
                    <span className="text-foreground truncate">{issue.title}</span>
                  </a>
                );
              })}
            </div>
          )}

          {/* Recently closed */}
          {productClosed.length > 0 && (
            <div className="border-t border-border/30 pt-3 mt-3">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Recently Closed</div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
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
