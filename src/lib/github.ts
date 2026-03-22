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
