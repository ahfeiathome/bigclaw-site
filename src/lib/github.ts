const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'ahfeiathome';

interface GitHubFileContent {
  content: string;
  encoding: string;
}

export async function fetchRepoFile(
  repo: string,
  path: string,
): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
    }

    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`,
      {
        headers,
        next: { revalidate: 300 }, // cache 5 min
      },
    );

    if (!res.ok) return null;

    const data: GitHubFileContent = await res.json();
    return Buffer.from(data.content, 'base64').toString('utf-8');
  } catch {
    return null;
  }
}


export async function fetchFinanceData(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'FINANCE.md');
}

export async function fetchIssuesSnapshot(repo: string = 'the-firm'): Promise<string | null> {
  return fetchRepoFile(repo, 'docs/status/issues-snapshot.md');
}

export async function fetchBandwidth(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/operations/BANDWIDTH.md');
}

export async function fetchMarketing(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/growth/MARKETING.md');
}

export async function fetchHealth(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/operations/HEALTH.md');
}

export async function fetchProjects(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'ceo/PROJECTS.md');
}


export async function fetchTooling(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/operations/TOOLING.md');
}

export async function fetchPrdChecklist(
  repo: string = 'learnie-ai',
  path: string = 'docs/product/PRD_CHECKLIST.md',
): Promise<string | null> {
  return fetchRepoFile(repo, path);
}


export async function fetchReleasePlan(repo: string): Promise<string | null> {
  return fetchRepoFile(repo, 'docs/product/RELEASE_PLAN.md');
}

export async function fetchTestHealth(repo: string): Promise<string | null> {
  return fetchRepoFile(repo, 'docs/status/test-health.md');
}

export async function fetchVerificationReport(repo: string): Promise<string | null> {
  return fetchRepoFile(repo, 'ops/gemini/VERIFICATION_REPORT.md');
}

export async function fetchMichaelTodo(): Promise<string | null> {
  // Try new path first, fall back to old for backwards compat
  const result = await fetchRepoFile('bigclaw-ai', 'founder/FOUNDER_TODO.md');
  if (result) return result;
  return fetchRepoFile('bigclaw-ai', 'sponsor/MICHAEL_TODO.md');
}

export async function fetchKnowledgeHub(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'knowledge/KNOWLEDGE_HUB.md');
}

export async function fetchDevKnowledgeHub(): Promise<string | null> {
  // DEV_KNOWLEDGE_HUB.md retired (2026-04-10) — replaced by KNOWLEDGE_HUB.md
  return fetchKnowledgeHub();
}

export async function fetchSDLCProcess(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'knowledge/SDLC_PROCESS.md');
}

export async function fetchSDLCViolations(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'growth/SDLC_VIOLATIONS.md');
}

export async function fetchSDLCGatesMatrix(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'knowledge/SDLC_GATES_MATRIX.md');
}

export async function fetchLearnings(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'growth/LEARNINGS.md');
}

export async function fetchLessonsLearned(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'knowledge/lessons-learned.md');
}

export async function fetchMorningBrainLog(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'ops/morning-brain.log');
}

export async function fetchDailyCosts(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'ops/DAILY_COSTS.md');
}

export async function fetchPortfolioSummary(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'knowledge/PORTFOLIO_SUMMARY.md');
}

export async function fetchAgentSystem(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/operations/PI5_AGENT_SYSTEM.md');
}

export async function fetchPi5Health(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/operations/HEALTH.md');
}

export async function fetchOvernightReport(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'ops/OVERNIGHT_REPORT.md');
}

export async function fetchAgentOpsIndex(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'knowledge/AGENT_OPS_INDEX.md');
}

export async function fetchCooInbox(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'COO_INBOX.md');
}

export async function fetchPDLCRegistry(): Promise<string | null> {
  // PDLC_REGISTRY.md was deleted (2026-04-10) — replaced by REGISTRY.md
  // Return null so consumers fall back to fetchProducts() from content.ts
  return null;
}

export async function fetchRadarStatus(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/projects/radar/TRADE_LOG.md');
}

export async function fetchRadarScorecard(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/projects/radar/STRATEGY_SCORECARD.md');
}

export async function fetchPatrolReport(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'PATROL_REPORT.md');
}

export async function fetchRadarConstitution(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/projects/radar/RADAR_CONSTITUTION.md');
}

export async function fetchRadarDashboard(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/projects/radar/RADAR_DASHBOARD.md');
}

export async function fetchPositionMatrix(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/projects/radar/POSITION_MATRIX.md');
}

export async function fetchAgentsMd(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'AGENTS.md');
}

export async function fetchLearnieHealth(): Promise<{
  status: number;
  ok: boolean;
}> {
  try {
    const res = await fetch('https://learnie-ai-ten.vercel.app', {
      method: 'HEAD',
      next: { revalidate: 60 },
    });
    return { status: res.status, ok: res.ok };
  } catch {
    return { status: 0, ok: false };
  }
}


// --- GitHub Issues & Releases (cross-repo) ---

// Forge repos
export const FORGE_REPOS = new Set(['learnie-ai', 'bigclaw-site', 'the-firm']);
// Axiom repos
export const AXIOM_REPOS = new Set(['axiom', 'iris-studio', 'fatfrogmodels', 'fairconnect', 'keeptrack', 'subcheck', 'cortex', 'radar-site', 'rehearsal']);
// All repos for cross-repo queries
const ALL_REPOS = [...FORGE_REPOS, ...AXIOM_REPOS, 'bigclaw-ai'];

export interface GitHubIssue {
  repo: string;
  number: number;
  title: string;
  state: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  url: string;
}

export interface GitHubRelease {
  repo: string;
  tag: string;
  name: string;
  publishedAt: string;
  url: string;
}

async function fetchIssuesForRepo(repo: string, state: 'open' | 'closed' = 'open', since?: string): Promise<GitHubIssue[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const params = new URLSearchParams({ state, per_page: '50', sort: 'updated' });
  if (since) params.set('since', since);

  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${repo}/issues?${params}`,
      { headers, next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    const data = await res.json() as Array<{
      number: number; title: string; state: string;
      labels: Array<{ name: string }>; created_at: string;
      updated_at: string; closed_at?: string; html_url: string; pull_request?: unknown;
    }>;
    return data
      .filter(i => !i.pull_request)
      .map(i => ({
        repo,
        number: i.number,
        title: i.title,
        state: i.state,
        labels: i.labels.map(l => l.name),
        createdAt: i.created_at,
        updatedAt: i.updated_at,
        closedAt: i.closed_at,
        url: i.html_url,
      }));
  } catch { return []; }
}

/** Fetch issues for a single repo — use this in product pages to avoid exhausting rate limits */
export async function fetchRepoIssues(repo: string): Promise<GitHubIssue[]> {
  return fetchIssuesForRepo(repo, 'open');
}

/** Fetch recently closed issues for a single repo */
export async function fetchRepoClosedIssues(repo: string, days = 90): Promise<GitHubIssue[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const issues = await fetchIssuesForRepo(repo, 'closed', since);
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return issues.filter(i => i.closedAt && new Date(i.closedAt).getTime() >= cutoff);
}

export async function fetchAllIssues(): Promise<GitHubIssue[]> {
  const results: GitHubIssue[] = [];
  await Promise.all(ALL_REPOS.map(async repo => {
    const issues = await fetchIssuesForRepo(repo, 'open');
    results.push(...issues);
  }));

  return results.sort((a, b) => {
    const priority = (labels: string[]) => labels.includes('P0') ? 0 : labels.includes('P1') ? 1 : labels.includes('P2') ? 2 : 3;
    return priority(a.labels) - priority(b.labels) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

export async function fetchRecentClosedIssues(days = 7): Promise<GitHubIssue[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const results: GitHubIssue[] = [];

  await Promise.all(
    ALL_REPOS.map(async (repo) => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${OWNER}/${repo}/issues?state=closed&since=${since}&per_page=50&sort=updated`,
          { headers, next: { revalidate: 300 } },
        );
        if (!res.ok) return;
        const data = await res.json() as Array<{
          number: number;
          title: string;
          state: string;
          labels: Array<{ name: string }>;
          created_at: string;
          updated_at: string;
          closed_at: string;
          html_url: string;
          pull_request?: unknown;
        }>;
        for (const issue of data) {
          if (issue.pull_request) continue;
          if (!issue.closed_at) continue;
          const closedAt = new Date(issue.closed_at).getTime();
          if (closedAt < Date.now() - days * 24 * 60 * 60 * 1000) continue;
          results.push({
            repo,
            number: issue.number,
            title: issue.title,
            state: issue.state,
            labels: issue.labels.map((l) => l.name),
            createdAt: issue.created_at,
            updatedAt: issue.updated_at,
            closedAt: issue.closed_at,
            url: issue.html_url,
          });
        }
      } catch { /* skip repo on error */ }
    }),
  );

  return results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function fetchAllReleases(): Promise<GitHubRelease[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const results: GitHubRelease[] = [];

  await Promise.all(
    ALL_REPOS.map(async (repo) => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${OWNER}/${repo}/releases?per_page=5`,
          { headers, next: { revalidate: 300 } },
        );
        if (!res.ok) return;
        const data = await res.json() as Array<{
          tag_name: string;
          name: string | null;
          published_at: string;
          html_url: string;
        }>;
        for (const rel of data) {
          results.push({
            repo,
            tag: rel.tag_name,
            name: rel.name || rel.tag_name,
            publishedAt: rel.published_at,
            url: rel.html_url,
          });
        }
      } catch { /* skip */ }
    }),
  );

  return results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

// --- Recent Commits (cross-repo, last 24h) ---

export interface GitHubCommit {
  repo: string;
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export async function fetchRecentCommits(hours = 24): Promise<GitHubCommit[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const results: GitHubCommit[] = [];

  await Promise.all(
    ALL_REPOS.map(async (repo) => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${OWNER}/${repo}/commits?since=${since}&per_page=10`,
          { headers, next: { revalidate: 300 } },
        );
        if (!res.ok) return;
        const data = await res.json() as Array<{
          sha: string;
          commit: { message: string; author: { name: string; date: string } };
          html_url: string;
        }>;
        for (const c of data) {
          results.push({
            repo,
            sha: c.sha.slice(0, 7),
            message: c.commit.message.split('\n')[0],
            author: c.commit.author.name,
            date: c.commit.author.date,
            url: c.html_url,
          });
        }
      } catch { /* skip */ }
    }),
  );

  return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// --- CI Runs ---

export interface GitHubCiRun {
  name: string;
  status: string;
  conclusion: string | null;
  updatedAt: string;
}

export async function fetchLatestCiRun(repo: string): Promise<GitHubCiRun | null> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  try {
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${repo}/actions/runs?per_page=1`,
      { headers, next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const data = await res.json() as { workflow_runs: Array<{ name: string; status: string; conclusion: string | null; updated_at: string }> };
    const run = data.workflow_runs?.[0];
    if (!run) return null;
    return { name: run.name, status: run.status, conclusion: run.conclusion, updatedAt: run.updated_at };
  } catch {
    return null;
  }
}

export async function fetchPrdTestMatrixForRepo(repo: string): Promise<string | null> {
  const matrix = await fetchRepoFile(repo, 'docs/product/PRD_TEST_MATRIX.md');
  if (matrix) return matrix;
  // Fallback: PRD_CHECKLIST.md also has PRD rows and can serve as test coverage source
  return fetchRepoFile(repo, 'docs/product/PRD_CHECKLIST.md');
}

export function extractMichaelBlockers(
  ...sources: (string | null)[]
): string[] {
  const blockers: string[] = [];
  const patterns = [
    /needs Michael/i,
    /Michael:/i,
    /💳/,
    /credit card/i,
    /⚖️/,
    /blocked.*Michael/i,
    /Michael.*credit/i,
    /Apple Developer/i,
    /Google Play Console/i,
    /\bDNS\b/i,
  ];

  for (const content of sources) {
    if (!content) continue;
    for (const line of content.split('\n')) {
      if (patterns.some((p) => p.test(line))) {
        const cleaned = line.replace(/^\|?\s*/, '').replace(/\s*\|?\s*$/, '').trim();
        if (cleaned && !blockers.includes(cleaned)) {
          blockers.push(cleaned);
        }
      }
    }
  }

  return blockers;
}
