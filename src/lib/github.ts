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

export async function fetchAgentsTasks(): Promise<string[]> {
  const content = await fetchRepoFile('learnie-ai', 'AGENTS.md');
  if (!content) return [];

  const lines = content.split('\n');
  return lines.filter(
    (line) =>
      line.includes('TASK-') &&
      (line.includes('✅ DONE') ||
        line.includes('⏳ TODO') ||
        line.includes('BLOCKED') ||
        line.includes('LATER')),
  );
}

export async function fetchFinanceData(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'FINANCE.md');
}

export async function fetchCheckpoint(): Promise<string | null> {
  return fetchRepoFile('learnie-ai', 'CHECKPOINT.md');
}

export async function fetchCeoInbox(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'CEO_INBOX.md');
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

export async function fetchCompanyCheckpoint(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'CHECKPOINT.md');
}

export async function fetchTooling(): Promise<string | null> {
  return fetchRepoFile('the-firm', 'docs/operations/TOOLING.md');
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

export async function fetchAllTasks(): Promise<string[]> {
  const [learnieContent, companyContent] = await Promise.all([
    fetchRepoFile('learnie-ai', 'AGENTS.md'),
    fetchRepoFile('the-firm', 'CHECKPOINT.md'),
  ]);

  const lines: string[] = [];

  if (learnieContent) {
    lines.push(
      ...learnieContent
        .split('\n')
        .filter(
          (l) =>
            (l.includes('TASK-') || l.includes('CP-')) &&
            (l.includes('⏳ TODO') ||
              l.includes('🕐 LATER') ||
              l.includes('BLOCKED')),
        ),
    );
  }

  return lines;
}

// --- GitHub Issues & Releases (cross-repo) ---

const ALL_REPOS = [
  'learnie-ai',
  'bigclaw-site',
  'radar',
  'cortex',
  'fatfrogmodels',
  'plantdoc',
  'receiptsnap',
  'calsnap',
  'axiom',
];

export interface GitHubIssue {
  repo: string;
  number: number;
  title: string;
  state: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
}

export interface GitHubRelease {
  repo: string;
  tag: string;
  name: string;
  publishedAt: string;
  url: string;
}

export async function fetchAllIssues(): Promise<GitHubIssue[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  const results: GitHubIssue[] = [];

  await Promise.all(
    ALL_REPOS.map(async (repo) => {
      try {
        const res = await fetch(
          `https://api.github.com/repos/${OWNER}/${repo}/issues?state=open&per_page=50&sort=updated`,
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
          html_url: string;
          pull_request?: unknown;
        }>;
        for (const issue of data) {
          if (issue.pull_request) continue; // skip PRs
          results.push({
            repo,
            number: issue.number,
            title: issue.title,
            state: issue.state,
            labels: issue.labels.map((l) => l.name),
            createdAt: issue.created_at,
            updatedAt: issue.updated_at,
            url: issue.html_url,
          });
        }
      } catch { /* skip repo on error */ }
    }),
  );

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

export async function fetchArchitectureMode(): Promise<'AGENTS' | 'CODE_ONLY'> {
  const content = await fetchRepoFile('the-firm', 'COMPANY.md');
  if (!content) return 'AGENTS';
  const match = content.match(/ARCHITECTURE:\s*(AGENTS|CODE_ONLY)/);
  return (match?.[1] as 'AGENTS' | 'CODE_ONLY') || 'AGENTS';
}

export function extractMichaelBlockers(
  learnieAgents: string | null,
  companyCheckpoint: string | null,
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

  for (const content of [learnieAgents, companyCheckpoint]) {
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
