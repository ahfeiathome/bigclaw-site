import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';
import { ViewSource } from '@/components/view-source';
import Link from 'next/link';
import type { GitHubIssue } from '@/lib/github';

// ── Types ──────────────────────────────────────────────────────────────────

interface ProductKPIs {
  pdlcStage: string;
  company: string;
  companyColor: 'green' | 'blue' | 'purple';
  revenueModel: string;
  liveStatus?: { online: boolean; url?: string };
  openIssues: { p0: number; p1: number; p2: number; total: number };
}

interface ProductStatusSection {
  pdlcProgress?: { current: number; total: number; stages: { name: string; status: 'done' | 'active' | 'pending' }[] };
  revenueGates?: { gate: string; type: string; status: string }[];
  dependencies?: { name: string; status: string; blocker?: boolean }[];
  launchChecklist?: { item: string; done: boolean }[];
}

interface ProjectStatusSection {
  issues: GitHubIssue[];
  recentClosed?: GitHubIssue[];
}

interface ProductPageProps {
  name: string;
  description: string;
  kpis: ProductKPIs;
  productStatus: ProductStatusSection;
  projectStatus: ProjectStatusSection;
  viewSourceRepo?: string;
  viewSourcePath?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function companyBadge(company: string, color: string) {
  const colorClass = color === 'green' ? 'bg-green-500/10 text-green-400' : color === 'purple' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400';
  return <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${colorClass}`}>{company}</span>;
}

function statusTone(status: string): 'success' | 'warning' | 'info' | 'neutral' {
  if (status === 'LIVE' || status === 'Launched') return 'success';
  if (status === 'PAPER' || status === 'BUILD') return 'warning';
  if (status.includes('S4') || status.includes('S3')) return 'info';
  return 'neutral';
}

// ── Component ──────────────────────────────────────────────────────────────

export function ProductPageTemplate({ name, description, kpis, productStatus, projectStatus, viewSourceRepo, viewSourcePath }: ProductPageProps) {
  const { pdlcStage, company, companyColor, revenueModel, liveStatus, openIssues } = kpis;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{name}</h1>
            <SignalPill label={pdlcStage} tone={statusTone(pdlcStage)} />
            {companyBadge(company, companyColor)}
          </div>
          <div className="flex items-center gap-3">
            {viewSourceRepo && viewSourcePath && <ViewSource repo={viewSourceRepo} path={viewSourcePath} />}
            {liveStatus && (
              <>
                <StatusDot status={liveStatus.online ? 'good' : 'bad'} size="sm" />
                <span className="text-xs text-muted-foreground font-mono">{liveStatus.online ? 'Live' : 'Offline'}</span>
              </>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* ── Section 1: Summary / KPIs ───────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">PDLC Stage</div>
          <div className="text-sm font-bold font-mono text-foreground mt-1">{pdlcStage}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Company</div>
          <div className="mt-1">{companyBadge(company, companyColor)}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Revenue</div>
          <div className="text-sm font-mono text-foreground mt-1">{revenueModel}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Live Status</div>
          <div className="flex items-center gap-1.5 mt-1">
            {liveStatus ? (
              <>
                <StatusDot status={liveStatus.online ? 'good' : 'bad'} size="sm" />
                <span className="text-sm font-mono text-foreground">{liveStatus.online ? 'Online' : 'Offline'}</span>
              </>
            ) : (
              <span className="text-sm font-mono text-muted-foreground">Not deployed</span>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Open Issues</div>
          <div className="text-sm font-bold font-mono text-foreground mt-1">{openIssues.total}</div>
          {openIssues.p0 > 0 && <span className="text-[10px] text-red-400 font-bold">{openIssues.p0} P0</span>}
        </div>
      </div>

      {/* ── Section 2: Product Status ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* PDLC Progress */}
        {productStatus.pdlcProgress && (
          <SectionCard title="PDLC Progress">
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Stage {productStatus.pdlcProgress.current} of {productStatus.pdlcProgress.total}</span>
                <span className="font-mono">{Math.round((productStatus.pdlcProgress.current / productStatus.pdlcProgress.total) * 100)}%</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                <div className="bg-blue-500" style={{ width: `${(productStatus.pdlcProgress.current / productStatus.pdlcProgress.total) * 100}%` }} />
              </div>
            </div>
            <div className="space-y-1 text-xs">
              {productStatus.pdlcProgress.stages.map((stage) => (
                <div key={stage.name} className="flex items-center gap-2">
                  <StatusDot status={stage.status === 'done' ? 'good' : stage.status === 'active' ? 'warn' : 'neutral'} size="sm" />
                  <span className={stage.status === 'active' ? 'text-foreground font-medium' : stage.status === 'done' ? 'text-foreground' : 'text-muted-foreground'}>{stage.name}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Launch Checklist */}
        {productStatus.launchChecklist && (
          <SectionCard title="Launch Checklist">
            <div className="space-y-2 text-sm">
              {productStatus.launchChecklist.map((check, i) => (
                <div key={i} className="flex items-center gap-2">
                  <StatusDot status={check.done ? 'good' : 'neutral'} size="sm" />
                  <span className={check.done ? 'text-foreground' : 'text-muted-foreground'}>{check.item}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Revenue Gates */}
        {productStatus.revenueGates && productStatus.revenueGates.length > 0 && (
          <SectionCard title="Revenue Gates">
            <div className="space-y-2">
              {productStatus.revenueGates.map((g, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono">{g.type}</span>
                  <span className="text-foreground flex-1">{g.gate}</span>
                  <span className="text-xs text-muted-foreground">{g.status}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Dependencies */}
        {productStatus.dependencies && productStatus.dependencies.length > 0 && (
          <SectionCard title="Dependencies">
            <div className="space-y-2 text-sm">
              {productStatus.dependencies.map((dep, i) => (
                <div key={i} className="flex items-center gap-2">
                  <StatusDot status={dep.blocker ? 'warn' : 'good'} size="sm" />
                  <span className="text-foreground">{dep.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono ml-auto">{dep.status}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* No product status data at all */}
        {!productStatus.pdlcProgress && !productStatus.launchChecklist && !productStatus.revenueGates && !productStatus.dependencies && (
          <SectionCard title="Product Status">
            <p className="text-sm text-muted-foreground">No product status data yet</p>
          </SectionCard>
        )}
      </div>

      {/* ── Section 3: Project Status ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SectionCard title="Active Issues">
          {projectStatus.issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open issues</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projectStatus.issues.slice(0, 10).map(issue => (
                <a key={issue.number} href={issue.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm no-underline hover:bg-muted rounded p-1.5 transition-colors">
                  <StatusDot status={issue.labels.includes('P0') ? 'bad' : issue.labels.includes('P1') ? 'warn' : 'neutral'} size="sm" />
                  <span className="text-foreground flex-1 truncate">#{issue.number} {issue.title}</span>
                  {(issue.labels.includes('P0') || issue.labels.includes('P1')) && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${issue.labels.includes('P0') ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {issue.labels.includes('P0') ? 'P0' : 'P1'}
                    </span>
                  )}
                </a>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Recent Activity">
          {(!projectStatus.recentClosed || projectStatus.recentClosed.length === 0) ? (
            <p className="text-sm text-muted-foreground">No recently closed issues</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {projectStatus.recentClosed.slice(0, 10).map(issue => (
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

      {/* Live app link */}
      {liveStatus?.url && (
        <div className="flex items-center gap-3 text-sm mb-6 px-1">
          <StatusDot status={liveStatus.online ? 'good' : 'bad'} size="sm" />
          <a href={liveStatus.url} target="_blank" rel="noopener noreferrer" className="text-primary no-underline hover:underline">
            Visit live site →
          </a>
        </div>
      )}
    </div>
  );
}
