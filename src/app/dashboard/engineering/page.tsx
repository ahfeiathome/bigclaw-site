export const dynamic = 'force-dynamic';

import { fetchSDLCGatesMatrix, fetchSDLCViolations, fetchAllIssues, fetchRecentClosedIssues, fetchLatestCiRun, fetchPrdTestMatrixForRepo, fetchRepoFile } from '@/lib/github';
import { parsePrdItems } from '@/lib/prd-parser';
import { SectionCard, SignalPill } from '@/components/dashboard';
import { IssueTrendChart } from '@/components/issues-trend-chart';
import { parseMarkdownTable, extractSection } from '@/app/dashboard/sdlc/helpers';
import Link from 'next/link';

const SEVERITY_STYLES: Record<string, string> = {
  Critical: 'bg-red-500/20 text-red-400',
  High: 'bg-amber-500/20 text-amber-400',
  Medium: 'bg-yellow-500/20 text-yellow-400',
};

function statusCell(text: string) {
  const color = text.includes('✅') ? 'text-green-400' : text.includes('⚠') ? 'text-amber-400' : text.includes('❌') || text.includes('🔴') ? 'text-red-400' : 'text-muted-foreground';
  return <span className={`${color} font-mono`}>{text}</span>;
}

// Products with PRD_CHECKLIST.md (repo → display name)
const PRD_REPOS: Array<{ repo: string; name: string }> = [
  { repo: 'learnie-ai', name: 'GrovaKid' },
];

export default async function EngineeringOverviewPage() {
  const [gatesMd, violationsMd, allIssues, closedIssues, ...prdData] = await Promise.all([
    fetchSDLCGatesMatrix(),
    fetchSDLCViolations(),
    fetchAllIssues(),
    fetchRecentClosedIssues(90),
    ...PRD_REPOS.flatMap(({ repo }) => [
      fetchRepoFile(repo, 'docs/product/PRD_CHECKLIST.md'),
      fetchLatestCiRun(repo),
      fetchPrdTestMatrixForRepo(repo),
    ]),
  ]);

  // Build per-product verification rows
  interface VerificationSummary {
    name: string;
    repo: string;
    totalItems: number;
    done: number;
    verified: number;
    verifiedRate: number;
    ciConclusion: string | null;
    ciUpdatedAt: string | null;
    testMatrixTotal: number;
    testMatrixVerified: number;
  }
  const verificationSummary: VerificationSummary[] = PRD_REPOS.map(({ repo, name }, i) => {
    const prdMd = prdData[i * 3] as string | null;
    const ci = prdData[i * 3 + 1] as { name: string; status: string; conclusion: string | null; updatedAt: string } | null;
    const matrixMd = prdData[i * 3 + 2] as string | null;

    const items = prdMd ? parsePrdItems(prdMd) : [];
    const done = items.filter(it => it.status === 'Done').length;
    const verified = items.filter(it => it.verified).length;

    let matrixTotal = 0;
    let matrixVerified = 0;
    if (matrixMd) {
      for (const line of matrixMd.split('\n')) {
        if (!line.startsWith('|') || line.match(/^\|[\s-:|]+\|$/) || line.includes('| ID ') || line.includes('| PRD ID ')) continue;
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        if (!cells[0]?.startsWith('PRD-')) continue;
        matrixTotal++;
        if (cells[cells.length - 1]?.includes('✅')) matrixVerified++;
      }
    }

    return {
      name,
      repo,
      totalItems: items.length,
      done,
      verified,
      verifiedRate: done > 0 ? Math.round((verified / done) * 100) : 0,
      ciConclusion: ci?.conclusion ?? null,
      ciUpdatedAt: ci?.updatedAt ?? null,
      testMatrixTotal: matrixTotal,
      testMatrixVerified: matrixVerified,
    };
  });

  const p0Count = allIssues.filter(i => i.labels.includes('P0')).length;
  const p1Count = allIssues.filter(i => i.labels.includes('P1')).length;
  const violationRows = violationsMd ? parseMarkdownTable(extractSection(violationsMd, 'Raw Violations Log')) : [];

  // Gate 4 summary
  const gate4Rows = gatesMd ? parseMarkdownTable(extractSection(gatesMd, 'Gate 4: Push → Review → Approval → Production')) : [];

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Engineering Overview</h1>
      <p className="text-sm text-muted-foreground mb-6">Aggregate quality metrics across all products</p>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Open Issues</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{allIssues.length}</div>
          <div className="flex gap-2 mt-1">
            {p0Count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">{p0Count} P0</span>}
            {p1Count > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">{p1Count} P1</span>}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Closed (90d)</div>
          <div className="text-2xl font-bold font-mono text-green-400 mt-1">{closedIssues.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Violations (all time)</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1">{violationRows.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Gate Coverage</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{gate4Rows.length} gates</div>
        </div>
      </div>

      {/* PRD Verification Summary */}
      {verificationSummary.length > 0 && (
        <SectionCard title="PRD Verification Summary" className="mb-6">
          <p className="text-xs text-muted-foreground mb-3">Items marked Done in PRD Checklist that have been independently verified (Gemini + CI). Products without a PRD checklist are omitted.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3 pr-2">Product</th>
                  <th className="text-right py-2 px-2">Total</th>
                  <th className="text-right py-2 px-2">Done</th>
                  <th className="text-right py-2 px-2">Verified</th>
                  <th className="text-right py-2 px-2">Rate</th>
                  <th className="text-right py-2 px-2">Test Matrix</th>
                  <th className="text-right py-2 pl-2 pr-3">CI</th>
                </tr>
              </thead>
              <tbody>
                {verificationSummary.map((row, i) => (
                  <tr key={row.repo} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2 pl-3 pr-2 text-foreground font-medium">{row.name}</td>
                    <td className="py-2 px-2 text-right font-mono text-muted-foreground">{row.totalItems}</td>
                    <td className="py-2 px-2 text-right font-mono text-muted-foreground">{row.done}</td>
                    <td className="py-2 px-2 text-right font-mono text-green-400">{row.verified}</td>
                    <td className="py-2 px-2 text-right">
                      <span className={`font-mono ${row.verifiedRate >= 80 ? 'text-green-400' : row.verifiedRate >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                        {row.verifiedRate}%
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-muted-foreground">
                      {row.testMatrixTotal > 0 ? `${row.testMatrixVerified}/${row.testMatrixTotal}` : '—'}
                    </td>
                    <td className="py-2 pl-2 pr-3 text-right">
                      {row.ciConclusion === 'success' ? (
                        <span className="text-green-400">✅</span>
                      ) : row.ciConclusion === 'failure' ? (
                        <span className="text-red-400">❌</span>
                      ) : row.ciConclusion ? (
                        <span className="text-amber-400">⏳</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Untested Done items: {verificationSummary.reduce((sum, r) => sum + (r.done - r.verified), 0)} (Done but not yet verified)
          </p>
        </SectionCard>
      )}

      {/* Aggregate Issues Trend */}
      <SectionCard title="Issues Trend (all products, 90 days)" className="mb-6">
        <IssueTrendChart openIssues={allIssues} closedIssues={closedIssues} days={90} />
      </SectionCard>

      {/* Gate Matrix (Gate 4 — push/review/approval) */}
      {gate4Rows.length > 0 && (
        <SectionCard title="Gate 4: Push → Review → Approval" className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3 pr-2">Gate</th>
                  <th className="text-left py-2 px-2">lc-forge</th>
                  <th className="text-left py-2 px-2">lc-axiom</th>
                  <th className="text-left py-2 pl-2 pr-3">lc-bigclaw</th>
                </tr>
              </thead>
              <tbody>
                {gate4Rows.map((row, i) => (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2 pl-3 pr-2 text-foreground">{row.cells[0]}</td>
                    <td className="py-2 px-2">{statusCell(row.cells[1] || '')}</td>
                    <td className="py-2 px-2">{statusCell(row.cells[2] || '')}</td>
                    <td className="py-2 pl-2 pr-3">{statusCell(row.cells[3] || '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Recent Violations */}
      {violationRows.length > 0 && (
        <SectionCard title={`Recent Violations (${violationRows.length})`} className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3 pr-2">Date</th>
                  <th className="text-left py-2 px-2">Product</th>
                  <th className="text-left py-2 px-2">Code</th>
                  <th className="text-left py-2 px-2">Severity</th>
                  <th className="text-left py-2 pl-2 pr-3">Description</th>
                </tr>
              </thead>
              <tbody>
                {violationRows.slice(0, 10).map((row, i) => (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2 pl-3 pr-2 font-mono text-muted-foreground">{row.cells[0]}</td>
                    <td className="py-2 px-2 text-foreground font-medium">
                      <Link href={`/dashboard/engineering/${row.cells[1]?.toLowerCase().replace(/\s+/g, '-')}`} className="no-underline hover:text-primary">{row.cells[1]}</Link>
                    </td>
                    <td className="py-2 px-2 font-mono text-primary">{row.cells[2]}</td>
                    <td className="py-2 px-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${SEVERITY_STYLES[row.cells[3]] || 'bg-muted text-muted-foreground'}`}>{row.cells[3]}</span>
                    </td>
                    <td className="py-2 pl-2 pr-3 text-muted-foreground max-w-[300px]">{row.cells[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Issues by Product */}
      <SectionCard title="Issues by Product" className="mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2 pl-3 pr-2">Product</th>
                <th className="text-right py-2 px-2">Open</th>
                <th className="text-right py-2 px-2">P0</th>
                <th className="text-right py-2 px-2">P1</th>
                <th className="text-right py-2 pl-2 pr-3">Closed (90d)</th>
              </tr>
            </thead>
            <tbody>
              {['learnie-ai', 'iris-studio', 'fatfrogmodels', 'fairconnect', 'keeptrack', 'subcheck', 'cortex', 'the-firm', 'axiom', 'bigclaw-ai'].map((repo, i) => {
                const open = allIssues.filter(iss => iss.repo === repo);
                const closed = closedIssues.filter(iss => iss.repo === repo);
                if (open.length === 0 && closed.length === 0) return null;
                const repoP0 = open.filter(iss => iss.labels.includes('P0')).length;
                const repoP1 = open.filter(iss => iss.labels.includes('P1')).length;
                return (
                  <tr key={repo} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2 pl-3 pr-2 text-foreground font-mono">{repo}</td>
                    <td className="py-2 px-2 text-right font-mono">{open.length}</td>
                    <td className="py-2 px-2 text-right font-mono">{repoP0 > 0 ? <span className="text-red-400">{repoP0}</span> : '—'}</td>
                    <td className="py-2 px-2 text-right font-mono">{repoP1 > 0 ? <span className="text-amber-400">{repoP1}</span> : '—'}</td>
                    <td className="py-2 pl-2 pr-3 text-right font-mono text-green-400">{closed.length || '—'}</td>
                  </tr>
                );
              }).filter(Boolean)}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
