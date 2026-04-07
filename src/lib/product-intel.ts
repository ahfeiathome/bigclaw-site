import { fetchRepoFile } from './github';

export interface ProductIntel {
  product: string;
  repo: string;
  s1Exists: boolean;
  s1Date: string | null;
  s2Exists: boolean;
  s2Date: string | null;
  s3Exists: boolean;
  s3Date: string | null;
  s3Completion: { done: number; total: number } | null;
  lastCompetitiveRefresh: string | null;
  recentChanges: string[];
  staleness: 'current' | 'stale' | 'outdated' | 'missing';
}

// Map product names to their GitHub repo
const PRODUCT_REPOS: Record<string, string> = {
  GrovaKid: 'learnie-ai',
  'iris-studio': 'iris-studio',
  fatfrogmodels: 'fatfrogmodels',
  FairConnect: 'fairconnect',
  KeepTrack: 'keeptrack',
  SubCheck: 'subcheck',
  CORTEX: 'cortex',
  REHEARSAL: 'rehearsal',
  RADAR: 'radar-site',
};

function parseUpdatedDate(content: string): string | null {
  const match = content.match(/(?:updated|date|Updated):\s*(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || null;
}

function calcStaleness(dateStr: string | null): ProductIntel['staleness'] {
  if (!dateStr) return 'missing';
  const days = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  if (days < 7) return 'current';
  if (days < 14) return 'stale';
  return 'outdated';
}

function parseCompetitiveLog(content: string): { lastDate: string | null; changes: string[] } {
  const lines = content.split('\n');
  let lastDate: string | null = null;
  const changes: string[] = [];

  for (const line of lines) {
    const dateMatch = line.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
    if (dateMatch && !lastDate) lastDate = dateMatch[1];

    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch && changes.length < 3) changes.push(bulletMatch[1].trim());
  }

  return { lastDate, changes };
}

function parsePrdCompletion(content: string): { done: number; total: number } | null {
  const lines = content.split('\n');
  let done = 0;
  let total = 0;

  for (const line of lines) {
    if (line.match(/^\s*-\s*\[x\]/i)) { done++; total++; }
    else if (line.match(/^\s*-\s*\[\s*\]/)) { total++; }
  }

  if (total === 0) {
    // Try table format: count rows with ✅ or Done
    for (const line of lines) {
      if (line.includes('|') && !line.match(/^\|[\s-:|]+\|$/)) {
        total++;
        if (line.includes('✅') || line.toLowerCase().includes('done') || line.toLowerCase().includes('complete')) done++;
      }
    }
    if (total > 0) total--; // subtract header row
  }

  return total > 0 ? { done, total } : null;
}

export async function fetchProductIntel(product: string): Promise<ProductIntel | null> {
  const repo = PRODUCT_REPOS[product];
  if (!repo) return null;

  const [s1, s2, s3, s3Checklist, compLog] = await Promise.all([
    fetchRepoFile(repo, 'docs/product/S1_COMPETITIVE_RESEARCH.md'),
    fetchRepoFile(repo, 'docs/product/S2_MRD.md'),
    fetchRepoFile(repo, 'docs/product/S3_PRD.md').then(r => r || fetchRepoFile(repo, 'docs/product/S3_PRD_CHECKLIST.md')),
    fetchRepoFile(repo, 'docs/product/S3_PRD_CHECKLIST.md'),
    fetchRepoFile(repo, 'docs/product/COMPETITIVE_LOG.md'),
  ]);

  const compData = compLog ? parseCompetitiveLog(compLog) : { lastDate: null, changes: [] };
  const s3Comp = s3Checklist ? parsePrdCompletion(s3Checklist) : (s3 ? parsePrdCompletion(s3) : null);

  // Use most recent date for staleness: competitive log date, or s1/s2/s3 dates
  const s1Date = s1 ? parseUpdatedDate(s1) : null;
  const s2Date = s2 ? parseUpdatedDate(s2) : null;
  const s3Date = s3 ? parseUpdatedDate(s3) : null;
  const refreshDate = compData.lastDate || s1Date;

  return {
    product,
    repo,
    s1Exists: !!s1,
    s1Date,
    s2Exists: !!s2,
    s2Date,
    s3Exists: !!s3,
    s3Date,
    s3Completion: s3Comp,
    lastCompetitiveRefresh: refreshDate,
    recentChanges: compData.changes,
    staleness: calcStaleness(refreshDate),
  };
}

export async function fetchAllProductIntel(): Promise<ProductIntel[]> {
  const products = Object.keys(PRODUCT_REPOS);
  const results = await Promise.all(products.map(p => fetchProductIntel(p)));
  return results.filter((r): r is ProductIntel => r !== null);
}
