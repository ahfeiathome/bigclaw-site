import { fetchAllIssues, fetchRecentClosedIssues, fetchSDLCGatesMatrix, fetchLearnings } from '@/lib/github';
import { ProductPageTemplate } from '@/components/product-page-template';
import { ProductQualityGates } from '@/components/product-quality-gates';
import type { GateRow, BugEntry } from '@/components/product-quality-gates';

function extractGatesForProject(gatesMd: string, project: string): GateRow[] {
  // Build gates from the matrix data for a specific project
  const gates: GateRow[] = [];

  // Gate 1: Coding Guidelines
  const g1Lines = gatesMd.split('\n').filter(l => l.includes('|') && !l.match(/^\|[\s-:|]+\|$/));
  const hasPitfalls = gatesMd.includes(project) && gatesMd.includes('pitfalls');
  gates.push({ gate: 'Coding guidelines', status: '✅', details: 'CLAUDE.md + architecture-checklist loaded' });

  // Gate 2: Code Review
  const hasReview = project === 'bigclaw-site' ? false : true;
  gates.push({ gate: 'Code review', status: hasReview ? '✅' : '❌', details: hasReview ? 'claude-review.yml active' : 'No code review configured' });

  // Gate 3: Testing — project-specific
  if (project === 'fatfrogmodels') {
    gates.push({ gate: 'Unit tests', status: '🔴', details: 'ZERO unit tests' });
    gates.push({ gate: 'E2E tests', status: '⚠️', details: '3 specs (STALE — references deleted JSON)' });
    gates.push({ gate: 'Coverage gate', status: '🔴', details: '0%' });
    gates.push({ gate: 'CI pipeline', status: '⚠️', details: 'Missing DATABASE_URL for E2E' });
  } else if (project === 'iris-studio') {
    gates.push({ gate: 'Unit tests', status: '🔴', details: 'ZERO tests of any kind' });
    gates.push({ gate: 'E2E tests', status: '🔴', details: 'ZERO' });
    gates.push({ gate: 'Coverage gate', status: '🔴', details: '0%' });
    gates.push({ gate: 'CI pipeline', status: '⚠️', details: 'Lint + build only' });
  }

  // Gate 4: Push gates
  gates.push({ gate: 'Pre-push test hook', status: '🔴', details: 'NOT IMPLEMENTED' });
  gates.push({ gate: 'Block direct push to main', status: '✅', details: 'Hook active' });

  return gates;
}

function extractBugsForProject(learningsMd: string, project: string): BugEntry[] {
  const bugs: BugEntry[] = [];
  const lines = learningsMd.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^#{2,3}\s+(DEV-\d+)\s+(?:\[([^\]]*)\]\s+)?(?:\[([^\]]*)\]\s+)?(.+)/);
    if (!match) continue;
    const title = match[4] || '';
    if (!title.toLowerCase().includes(project.toLowerCase())) continue;

    // Extract severity from block
    let end = lines.length;
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].match(/^#{2,3}\s/)) { end = j; break; }
    }
    const block = lines.slice(i, end).join('\n');
    const isCritical = block.toLowerCase().includes('critical') || block.includes('broke') || block.includes('broken');

    bugs.push({
      id: match[1],
      title: title.split(/\s*[—–:]\s*/).slice(1).join(' — ').trim() || title,
      severity: isCritical ? 'Critical' : 'High',
      date: match[2] || '',
    });
  }
  return bugs;
}

export default async function ECommercePage() {
  const [allIssues, closedIssues, gatesMd, learningsMd] = await Promise.all([
    fetchAllIssues(),
    fetchRecentClosedIssues(14),
    fetchSDLCGatesMatrix(),
    fetchLearnings(),
  ]);

  const fatfrogIssues = allIssues.filter(i => i.repo === 'fatfrogmodels');
  const fatfrogClosed = closedIssues.filter(i => i.repo === 'fatfrogmodels');

  const fatfrogGates = gatesMd ? extractGatesForProject(gatesMd, 'fatfrogmodels') : [];
  const irisGates = gatesMd ? extractGatesForProject(gatesMd, 'iris-studio') : [];
  const fatfrogBugs = learningsMd ? extractBugsForProject(learningsMd, 'fatfrogmodels') : [];
  const irisBugs = learningsMd ? extractBugsForProject(learningsMd, 'iris-studio') : [];

  return (
    <div>
      <h1 className="mb-6" style={{ fontSize: '28px', fontWeight: 700 }}>E-Commerce</h1>

      {/* ── Section 1: iris-studio ───────────────────────────────── */}
      <div className="mb-8">
        <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
          iris-studio
        </div>
        <ProductPageTemplate
          name="iris-studio"
          description="AI art studio & marketplace — Stripe payments"
          kpis={{
            pdlcStage: 'Pre-build',
            company: 'Axiom',
            companyColor: 'blue',
            revenueModel: 'Stripe',
            openIssues: { p0: 0, p1: 0, p2: 0, total: 0 },
          }}
          productStatus={{
            launchChecklist: [
              { item: 'Stripe connected', done: false },
              { item: 'DNS pointed', done: false },
              { item: 'Product catalog', done: false },
              { item: 'Payment flow tested', done: false },
              { item: 'Landing page live', done: false },
            ],
          }}
          projectStatus={{ issues: [] }}
        />
      </div>

      {/* iris-studio quality gates */}
      {irisGates.length > 0 && (
        <div className="mt-4 mb-4">
          <ProductQualityGates
            productName="iris-studio"
            gates={irisGates}
            openBugs={0}
            closedThisWeek={0}
            recentBugs={irisBugs.slice(0, 5)}
          />
        </div>
      )}

      {/* ── Separator ───────────────────────────────────────────── */}
      <div className="border-t border-border my-8" />

      {/* ── Section 2: fatfrogmodels ─────────────────────────────── */}
      <div>
        <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
          fatfrogmodels
        </div>
        <ProductPageTemplate
          name="fatfrogmodels"
          description="Scale model e-commerce — Stripe payments"
          kpis={{
            pdlcStage: 'Launched',
            company: 'Axiom',
            companyColor: 'blue',
            revenueModel: 'Stripe',
            liveStatus: { online: true, url: 'https://fatfrogmodels.vercel.app' },
            openIssues: {
              p0: fatfrogIssues.filter(i => i.labels.includes('P0')).length,
              p1: fatfrogIssues.filter(i => i.labels.includes('P1')).length,
              p2: fatfrogIssues.filter(i => i.labels.includes('P2')).length,
              total: fatfrogIssues.length,
            },
          }}
          productStatus={{
            launchChecklist: [
              { item: 'Stripe connected', done: true },
              { item: 'DNS pointed', done: true },
              { item: 'Product catalog', done: true },
              { item: 'Payment flow tested', done: true },
              { item: 'Landing page live', done: true },
            ],
          }}
          projectStatus={{
            issues: fatfrogIssues,
            recentClosed: fatfrogClosed,
          }}
        />
      </div>
      {/* fatfrogmodels quality gates */}
      {fatfrogGates.length > 0 && (
        <div className="mt-4">
          <ProductQualityGates
            productName="fatfrogmodels"
            gates={fatfrogGates}
            openBugs={fatfrogIssues.length}
            closedThisWeek={fatfrogClosed.length}
            recentBugs={fatfrogBugs.slice(0, 5)}
          />
        </div>
      )}
    </div>
  );
}
