import { readDataFile } from './shared';

export interface Issue {
  repo: string;
  number: number;
  title: string;
  status: string;
  labels: string[];
}

export interface IssuesData {
  issues: Issue[];
  p0Count: number;
  p1Count: number;
  byRepo: Record<string, Issue[]>;
}

export function parseIssues(key: 'issuesForge' | 'issuesAxiom'): IssuesData | null {
  const content = readDataFile(key);
  if (!content) return null;

  const issues: Issue[] = [];
  let currentRepo = '';

  for (const line of content.split('\n')) {
    const repoMatch = line.match(/^## (?:Forge |Axiom )?(.+)/);
    if (repoMatch) {
      currentRepo = repoMatch[1].trim();
      continue;
    }

    const issueMatch = line.match(/^- \[(\w+)\]\s*#(\d+):\s*(.+?)(?:\s*\[(.+?)\])?$/);
    if (issueMatch) {
      const labels = issueMatch[4] ? issueMatch[4].split(',').map(l => l.trim()) : [];
      issues.push({
        repo: currentRepo,
        number: parseInt(issueMatch[2]),
        title: issueMatch[3].trim(),
        status: issueMatch[1],
        labels,
      });
    }
  }

  const p0Count = issues.filter(i => i.labels.includes('P0') && i.status === 'OPEN').length;
  const p1Count = issues.filter(i => i.labels.includes('P1') && i.status === 'OPEN').length;

  const byRepo: Record<string, Issue[]> = {};
  for (const issue of issues) {
    if (!byRepo[issue.repo]) byRepo[issue.repo] = [];
    byRepo[issue.repo].push(issue);
  }

  return { issues, p0Count, p1Count, byRepo };
}

export function parseAllIssues(): IssuesData {
  const forge = parseIssues('issuesForge');
  const axiom = parseIssues('issuesAxiom');

  const issues = [...(forge?.issues || []), ...(axiom?.issues || [])];
  const p0Count = (forge?.p0Count || 0) + (axiom?.p0Count || 0);
  const p1Count = (forge?.p1Count || 0) + (axiom?.p1Count || 0);

  const byRepo: Record<string, Issue[]> = { ...(forge?.byRepo || {}), ...(axiom?.byRepo || {}) };

  return { issues, p0Count, p1Count, byRepo };
}
