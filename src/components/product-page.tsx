import { fetchAllIssues, fetchRecentClosedIssues, fetchRepoFile, fetchDailyCosts, fetchSDLCViolations, fetchSDLCGatesMatrix, fetchReleasePlan, fetchVerificationReport, fetchLatestCiRun, fetchPrdTestMatrixForRepo } from '@/lib/github';
import { fetchProductBySlug } from '@/lib/content';
import { SectionCard, SignalPill, StatusDot } from './dashboard';
import { PrdChecklist, type PrdItem } from './prd-checklist';
import { ProductIntelligencePanel } from './product-intelligence';
import { IssueTrendChart } from './issues-trend-chart';
import { fetchProductIntel } from '@/lib/product-intel';

interface ProductPageProps {
  /** Product slug — used to fetch dynamic data from REGISTRY.md */
  slug: string;
  name: string;
  company: string;
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

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
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
  // Fetch dynamic data from REGISTRY.md — overrides hardcoded props
  const dynamic = await fetchProductBySlug(props.slug);

  const name = props.name;
  const company = dynamic?.company || props.company;
  const pdlcStage = dynamic?.stage || props.pdlcStage;
  const status = props.status;
  const repoSlug = dynamic?.repo || props.repoSlug;
  const previewUrl = dynamic?.liveUrl || props.previewUrl;
  const productionUrl = props.productionUrl;
  const revenueModel = dynamic?.revenue || props.revenueModel;
  const description = props.description;
  const nextGate = props.nextGate;
  const blocker = props.blocker;
  const prdItems = props.prdItems;
  const shelvedReason = props.shelvedReason;
  const revivalCondition = props.revivalCondition;

  const [allIssues, closedIssues, intel, mrdContent, dailyCostsMd, violationsMd, gatesMd, releasePlanMd, verificationMd, ciRun, testMatrixMd] = await Promise.all([
    repoSlug ? fetchAllIssues() : Promise.resolve([]),
    repoSlug ? fetchRecentClosedIssues(90) : Promise.resolve([]),
    fetchProductIntel(name),
    repoSlug ? fetchRepoFile(repoSlug, 'docs/product/S2_MRD.md') : Promise.resolve(null),
    fetchDailyCosts(),
    fetchSDLCViolations(),
    fetchSDLCGatesMatrix(),
    repoSlug ? fetchReleasePlan(repoSlug) : Promise.resolve(null),
    repoSlug ? fetchVerificationReport(repoSlug) : Promise.resolve(null),
    repoSlug ? fetchLatestCiRun(repoSlug) : Promise.resolve(null),
    repoSlug ? fetchPrdTestMatrixForRepo(repoSlug) : Promise.resolve(null),
  ]);

  // Parse MRD for market positioning
  const mrdSections: Record<string, string> = {};
  if (mrdContent) {
    for (const match of mrdContent.matchAll(/^##\s+(?:Section \d+[:.]\s*)?(.+)/gm)) {
      const heading = match[1].trim();
      const start = (match.index ?? 0) + match[0].length;
      const nextSection = mrdContent.indexOf('\n## ', start);
      const body = mrdContent.slice(start, nextSection > -1 ? nextSection : undefined).trim();
      mrdSections[heading.toLowerCase()] = body.slice(0, 200);
    }
  }

  // Parse SDLC violations for this product
  const allViolationLines = violationsMd ? violationsMd.split('\n').filter(l => l.startsWith('|') && !l.match(/^\|[\s-:|]+\|$/) && !l.includes('| Date ')) : [];
  const productViolations = allViolationLines.filter(l => {
    const cells = l.split('|').map(c => c.trim()).filter(Boolean);
    return cells[1]?.toLowerCase().includes(name.toLowerCase()) || cells[1]?.toLowerCase().includes(props.slug);
  }).map(l => {
    const cells = l.split('|').map(c => c.trim()).filter(Boolean);
    return { date: cells[0], project: cells[1], code: cells[2], severity: cells[3], description: cells[4] };
  });

  // Parse SDLC gates for this product's repo
  const gatesSections = gatesMd ? (() => {
    const gate3Section = gatesMd.split('## Gate 3: Testing')[1]?.split('## Gate 4')[0] || '';
    const gate3Lines = gate3Section.split('\n').filter(l => l.startsWith('|') && !l.match(/^\|[\s-:|]+\|$/));
    const nameLower = name.toLowerCase();
    const slugLower = props.slug.toLowerCase();
    const productGateRow = gate3Lines.find(l => {
      const cells = l.split('|').map(c => c.trim()).filter(Boolean);
      const cellName = cells[0]?.toLowerCase() || '';
      return cellName === nameLower || cellName === slugLower || cellName.includes(nameLower) || nameLower.includes(cellName);
    });
    if (!productGateRow) return null;
    const cells = productGateRow.split('|').map(c => c.trim()).filter(Boolean);
    return { project: cells[0], unitTests: cells[1], e2eTests: cells[2], coverage: cells[3], ci: cells[4], localTesting: cells[5] };
  })() : null;

  // Parse per-product cost from DAILY_COSTS.md
  let productCost: string | null = null;
  if (dailyCostsMd) {
    const costLines = dailyCostsMd.split('\n');
    for (const line of costLines) {
      if (line.includes('|') && (line.toLowerCase().includes(name.toLowerCase()) || line.toLowerCase().includes(props.slug))) {
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        productCost = cells[cells.length - 1] || null;
        break;
      }
    }
  }

  // Parse Release Plan: extract version blocks + their PR tables
  interface ReleaseRow { pr: string; what: string; prds: string; status: string; }
  interface Release { version: string; subtitle: string; rows: ReleaseRow[]; }
  const releases: Release[] = [];
  if (releasePlanMd) {
    const versionBlocks = releasePlanMd.split(/\n(?=### v)/);
    for (const block of versionBlocks) {
      const headerMatch = block.match(/^### (v[\d.]+[^\n]*)/);
      if (!headerMatch) continue;
      const [versionPart, ...subtitleParts] = headerMatch[1].split(' — ');
      const rows: ReleaseRow[] = [];
      for (const line of block.split('\n')) {
        if (!line.startsWith('|') || line.match(/^\|[\s-:|]+\|$/) || line.includes('| PR ')) continue;
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length < 3) continue;
        rows.push({ pr: cells[0], what: cells[1], prds: cells[2], status: cells[3] || '' });
      }
      if (rows.length > 0) {
        releases.push({ version: versionPart.trim(), subtitle: subtitleParts.join(' — ').trim(), rows });
      }
    }
  }

  // Parse Verification Report rows
  interface VerificationRow { date: string; prdId: string; test: string; result: string; notes: string; }
  const verificationRows: VerificationRow[] = [];
  if (verificationMd) {
    for (const line of verificationMd.split('\n')) {
      if (!line.startsWith('|') || line.match(/^\|[\s-:|]+\|$/) || line.includes('| Date ')) continue;
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 4) continue;
      verificationRows.push({ date: cells[0], prdId: cells[1], test: cells[2], result: cells[3], notes: cells[4] || '' });
    }
  }

  // Parse PRD Test Matrix — count total rows and verified rows
  let testMatrixTotal = 0;
  let testMatrixVerified = 0;
  if (testMatrixMd) {
    for (const line of testMatrixMd.split('\n')) {
      if (!line.startsWith('|') || line.match(/^\|[\s-:|]+\|$/) || line.includes('| ID ') || line.includes('| PRD ID ')) continue;
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (!cells[0]?.startsWith('PRD-')) continue;
      testMatrixTotal++;
      if (cells[cells.length - 1]?.includes('✅')) testMatrixVerified++;
    }
  }

  // Compute per-category verification stats from prdItems
  interface CategoryStat { done: number; verified: number; total: number; }
  const categoryStats = new Map<string, CategoryStat>();
  if (prdItems) {
    for (const item of prdItems) {
      if (!categoryStats.has(item.category)) categoryStats.set(item.category, { done: 0, verified: 0, total: 0 });
      const stat = categoryStats.get(item.category)!;
      stat.total++;
      if (item.status === 'Done') stat.done++;
      if (item.verified) stat.verified++;
    }
  }
  const totalDone = prdItems ? prdItems.filter(i => i.status === 'Done').length : 0;
  const totalVerified = prdItems ? prdItems.filter(i => i.verified).length : 0;
  const hasVerificationData = prdItems && prdItems.length > 0 && totalDone > 0;

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

      {/* ── SECTION B: Market & Positioning ─────────────────── */}
      {(intel || Object.keys(mrdSections).length > 0) && (
        <SectionCard title="Market & Positioning" className="mb-6">
          {Object.keys(mrdSections).length > 0 && (
            <div className="space-y-2 mb-4">
              {mrdSections['target customer'] && (
                <div className="text-xs"><span className="text-muted-foreground">Target:</span> <span className="text-foreground">{mrdSections['target customer'].slice(0, 150)}</span></div>
              )}
              {mrdSections['positioning'] && (
                <div className="text-xs"><span className="text-muted-foreground">Positioning:</span> <span className="text-foreground">{mrdSections['positioning'].slice(0, 150)}</span></div>
              )}
              {mrdSections['competitive landscape'] && (
                <div className="text-xs"><span className="text-muted-foreground">Competitors:</span> <span className="text-foreground">{mrdSections['competitive landscape'].slice(0, 150)}</span></div>
              )}
            </div>
          )}
          {intel && <ProductIntelligencePanel intel={intel} />}
        </SectionCard>
      )}

      {/* ── SECTION C: PDLC + SDLC Progress ────────────────── */}
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

        {/* PRD Verification Summary */}
        {hasVerificationData && (
          <div className="mt-5 border-t border-border/30 pt-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">PRD Verification</div>

            {/* Overall progress bar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500/70"
                  style={{ width: `${totalDone > 0 ? Math.round((totalVerified / totalDone) * 100) : 0}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                {totalVerified}/{totalDone} Done items verified ({totalDone > 0 ? Math.round((totalVerified / totalDone) * 100) : 0}%)
              </span>
            </div>

            {/* Per-category table */}
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border bg-muted">
                    <th className="text-left py-2 pl-3 pr-2">Category</th>
                    <th className="text-right py-2 px-2">Done</th>
                    <th className="text-right py-2 px-2">Verified</th>
                    <th className="text-right py-2 pl-2 pr-3">Gap</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(categoryStats.entries()).map(([cat, stat], i) => (
                    <tr key={cat} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
                      <td className="py-1.5 pl-3 pr-2 text-foreground">{cat}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-muted-foreground">{stat.done}</td>
                      <td className="py-1.5 px-2 text-right font-mono text-green-400">{stat.verified}</td>
                      <td className={`py-1.5 pl-2 pr-3 text-right font-mono ${stat.done - stat.verified > 0 ? 'text-amber-400' : 'text-muted-foreground'}`}>
                        {stat.done - stat.verified}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CI + Gemini status */}
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Last CI run:</span>
                {ciRun ? (
                  <span className={ciRun.conclusion === 'success' ? 'text-green-400' : ciRun.conclusion === 'failure' ? 'text-red-400' : 'text-amber-400'}>
                    {ciRun.conclusion === 'success' ? '✅' : ciRun.conclusion === 'failure' ? '❌' : '⏳'} {ciRun.name} · {relativeTime(ciRun.updatedAt)}
                  </span>
                ) : (
                  <span className="text-muted-foreground">No data</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Test matrix:</span>
                <span className="font-mono text-foreground">
                  {testMatrixMd ? `${testMatrixVerified}/${testMatrixTotal} verified` : 'No matrix'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Testing Pipeline Visual */}
        {repoSlug && prdItems && prdItems.length > 0 && (
          <div className="mt-5 border-t border-border/30 pt-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-3">Testing Pipeline</div>
            <div className="overflow-x-auto">
              <div className="flex items-start gap-1 min-w-max">
                {[
                  {
                    label: 'PRD Checklist',
                    sub1: `${prdItems.length} items`,
                    sub2: `${totalDone} Done`,
                    status: totalDone > 0 ? 'good' : 'neutral',
                  },
                  {
                    label: 'Test Matrix',
                    sub1: testMatrixMd ? `${testMatrixTotal} mapped` : 'No matrix',
                    sub2: testMatrixMd ? `${testMatrixVerified} verified` : '—',
                    status: testMatrixMd ? (testMatrixVerified > 0 ? 'good' : 'neutral') : 'neutral',
                  },
                  {
                    label: 'CI (per PR)',
                    sub1: ciRun ? ciRun.name : 'No CI data',
                    sub2: ciRun ? (ciRun.conclusion === 'success' ? '✅ Passing' : ciRun.conclusion === 'failure' ? '❌ Failed' : '⏳ Running') : '—',
                    status: ciRun?.conclusion === 'success' ? 'good' : ciRun?.conclusion === 'failure' ? 'bad' : 'neutral',
                  },
                  {
                    label: 'Gemini (daily)',
                    sub1: verificationRows.length > 0 ? `${verificationRows.length} checks` : 'Not yet run',
                    sub2: verificationRows.length > 0 ? `${verificationRows.filter(r => r.result.includes('PASS') || r.result.includes('✅')).length} passed` : '—',
                    status: verificationRows.length > 0 ? 'good' : 'neutral',
                  },
                  {
                    label: 'Michael Review',
                    sub1: totalVerified > 0 ? `${totalVerified} verified` : 'Pending',
                    sub2: totalDone > 0 ? `${Math.round((totalVerified / totalDone) * 100)}% of Done` : '—',
                    status: totalVerified > 0 ? 'good' : 'neutral',
                  },
                ].map((step, i, arr) => (
                  <div key={step.label} className="flex items-start gap-1">
                    <div className={`rounded-lg border p-2.5 min-w-[110px] ${step.status === 'good' ? 'border-green-500/40 bg-green-500/5' : step.status === 'bad' ? 'border-red-500/40 bg-red-500/5' : 'border-border bg-card/50'}`}>
                      <div className={`text-[10px] font-semibold mb-1 ${step.status === 'good' ? 'text-green-400' : step.status === 'bad' ? 'text-red-400' : 'text-muted-foreground'}`}>{step.label}</div>
                      <div className="text-[10px] font-mono text-foreground">{step.sub1}</div>
                      <div className="text-[10px] text-muted-foreground">{step.sub2}</div>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="mt-5 text-muted-foreground text-xs">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PRD Checklist */}
        {prdItems && prdItems.length > 0 && (
          <div className="mt-4">
            <PrdChecklist items={prdItems} repoSlug={repoSlug || ''} />
          </div>
        )}
      </SectionCard>

      {/* ── SECTION C2: Release Pipeline ────────────────────── */}
      {repoSlug && (
        <SectionCard title="Release Pipeline" className="mb-6">
          {releases.length === 0 ? (
            <p className="text-xs text-muted-foreground">No release plan found at <code className="font-mono text-primary">docs/product/RELEASE_PLAN.md</code>.</p>
          ) : (
            <div className="space-y-5">
              {releases.map((rel) => (
                <div key={rel.version}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold font-mono text-foreground">{rel.version}</span>
                    {rel.subtitle && <span className="text-xs text-muted-foreground">{rel.subtitle}</span>}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border bg-muted">
                          <th className="text-left py-2 pl-3 pr-2">PR</th>
                          <th className="text-left py-2 px-2">What</th>
                          <th className="text-left py-2 px-2">PRDs</th>
                          <th className="text-left py-2 pl-2 pr-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rel.rows.map((row, i) => (
                          <tr key={i} className={`border-b border-border/50 ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
                            <td className="py-1.5 pl-3 pr-2 font-mono text-primary">{row.pr}</td>
                            <td className="py-1.5 px-2 text-foreground max-w-[200px] truncate">{row.what}</td>
                            <td className="py-1.5 px-2 font-mono text-muted-foreground text-[10px]">{row.prds}</td>
                            <td className="py-1.5 pl-2 pr-3">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${row.status.includes('✅') ? 'bg-green-500/20 text-green-400' : row.status.includes('⚠️') ? 'bg-amber-500/20 text-amber-400' : 'bg-muted text-muted-foreground'}`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── SECTION C3: Verification Report ─────────────────── */}
      {repoSlug && (
        <SectionCard title="Verification Report" className="mb-6">
          <p className="text-[10px] text-muted-foreground mb-3">
            Independent verification by Gemini QA. Only PASS results update the Verified column in the PRD checklist.
          </p>
          {verificationRows.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Awaiting first verification run.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border bg-muted">
                    <th className="text-left py-2 pl-3 pr-2">Date</th>
                    <th className="text-left py-2 px-2">PRD</th>
                    <th className="text-left py-2 px-2">Test</th>
                    <th className="text-left py-2 px-2">Result</th>
                    <th className="text-left py-2 pl-2 pr-3">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {verificationRows.map((row, i) => (
                    <tr key={i} className={`border-b border-border/50 ${i % 2 === 1 ? 'bg-muted/30' : ''}`}>
                      <td className="py-1.5 pl-3 pr-2 font-mono text-muted-foreground whitespace-nowrap">{row.date}</td>
                      <td className="py-1.5 px-2 font-mono text-primary">{row.prdId}</td>
                      <td className="py-1.5 px-2 text-foreground">{row.test}</td>
                      <td className="py-1.5 px-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${row.result.includes('PASS') || row.result.includes('✅') ? 'bg-green-500/20 text-green-400' : row.result.includes('FAIL') || row.result.includes('❌') ? 'bg-red-500/20 text-red-400' : 'bg-muted text-muted-foreground'}`}>
                          {row.result}
                        </span>
                      </td>
                      <td className="py-1.5 pl-2 pr-3 text-muted-foreground max-w-[200px] truncate">{row.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── SECTION D: SDLC Gates + Violations ────────────── */}
      <SectionCard title="SDLC Gates & Violations" className="mb-6">
        {gatesSections ? (
          <div className="mb-4">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Test Health</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {[
                { label: 'Unit Tests', value: gatesSections.unitTests },
                { label: 'E2E Tests', value: gatesSections.e2eTests },
                { label: 'Coverage', value: gatesSections.coverage },
                { label: 'CI Pipeline', value: gatesSections.ci },
                { label: 'Local Testing', value: gatesSections.localTesting },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-card/50 p-2">
                  <div className="text-[9px] text-muted-foreground uppercase">{label}</div>
                  <div className={`text-xs font-mono mt-0.5 ${value?.includes('✅') || value?.includes('pass') ? 'text-green-400' : value?.includes('❌') || value?.includes('ZERO') ? 'text-red-400' : 'text-muted-foreground'}`}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground mb-4">No test health data in SDLC_GATES_MATRIX.md for this product.</div>
        )}

        {productViolations.length > 0 ? (
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Violations ({productViolations.length})</div>
            <div className="space-y-1">
              {productViolations.map((v, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-muted-foreground whitespace-nowrap">{v.date}</span>
                  <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${v.severity === 'Critical' ? 'bg-red-500/20 text-red-400' : v.severity === 'High' ? 'bg-amber-500/20 text-amber-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{v.code}</span>
                  <span className="text-muted-foreground truncate">{v.description}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs text-green-400">No violations recorded for this product.</div>
        )}
      </SectionCard>

      {/* ── SECTION 3: Issues Trend ────────────────────────── */}
      {repoSlug && (
        <SectionCard title="Issues Trend (90 days)" className="mb-6">
          {/* Line chart */}
          <div className="mb-4">
            <IssueTrendChart openIssues={productIssues} closedIssues={productClosed} days={90} />
          </div>

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

      {/* ── SECTION E: Finance / Cost ──────────────────────── */}
      <SectionCard title="Finance / Cost" className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue Model</div>
            <div className="text-sm font-mono text-foreground mt-1">{revenueModel || '—'}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Monthly Cost</div>
            <div className="text-sm font-mono text-foreground mt-1">{productCost || 'No data yet'}</div>
          </div>
          <div className="rounded-lg border border-border bg-card/50 p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Current MRR</div>
            <div className="text-sm font-mono text-foreground mt-1">$0</div>
            <div className="text-[10px] text-amber-400">Pre-revenue</div>
          </div>
        </div>
        {!productCost && (
          <p className="text-[10px] text-muted-foreground">Per-product cost data will appear when Rex populates <code className="font-mono text-primary">ops/DAILY_COSTS.md</code> with per-product breakdown.</p>
        )}
      </SectionCard>
    </div>
  );
}
