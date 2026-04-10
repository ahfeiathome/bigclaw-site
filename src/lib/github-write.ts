// GitHub Contents API — write files back to the repo
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'ahfeiathome';

interface GitHubFileContent {
  content: string;
  encoding: string;
  sha: string;
}

export async function getRepoFileSha(repo: string, path: string): Promise<{ content: string; sha: string } | null> {
  try {
    const headers: Record<string, string> = { Accept: 'application/vnd.github.v3+json' };
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`,
      { headers, cache: 'no-store' },
    );
    if (!res.ok) return null;
    const data: GitHubFileContent = await res.json();
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return { content, sha: data.sha };
  } catch {
    return null;
  }
}

export async function writeRepoFile(
  repo: string,
  path: string,
  newContent: string,
  sha: string,
  commitMessage: string,
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(newContent).toString('base64'),
          sha,
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[github-write] PUT failed ${res.status}: ${body}`);
    }
    return res.ok;
  } catch (err) {
    console.error('[github-write] writeRepoFile error:', err);
    return false;
  }
}
