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
  return fetchRepoFile('company', 'FINANCE.md');
}

export async function fetchCheckpoint(): Promise<string | null> {
  return fetchRepoFile('learnie-ai', 'CHECKPOINT.md');
}

export async function fetchCeoInbox(): Promise<string | null> {
  return fetchRepoFile('company', 'CEO_INBOX.md');
}

export async function fetchBandwidth(): Promise<string | null> {
  return fetchRepoFile('company', 'BANDWIDTH.md');
}

export async function fetchMarketing(): Promise<string | null> {
  return fetchRepoFile('company', 'MARKETING.md');
}
