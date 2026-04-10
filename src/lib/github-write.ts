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
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`,
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${GITHUB_TOKEN}`,
        },
        cache: 'no-store',
      },
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
    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${repo}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: Buffer.from(newContent).toString('base64'),
          sha,
        }),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}
