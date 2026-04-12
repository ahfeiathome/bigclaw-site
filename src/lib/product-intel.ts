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

// Map product names to their GitHub repo + docs path
interface RepoMapping { repo: string; docsPath: string }
const PRODUCT_REPOS: Record<string, RepoMapping> = {
  GrovaKid: { repo: 'learnie-ai', docsPath: 'docs/product' },
  'iris-studio': { repo: 'iris-studio', docsPath: 'docs/product' },
  fatfrogmodels: { repo: 'fatfrogmodels', docsPath: 'docs/product' },
  FairConnect: { repo: 'fairconnect', docsPath: 'docs/product' },
  KeepTrack: { repo: 'keeptrack', docsPath: 'docs/product' },
  SubCheck: { repo: 'subcheck', docsPath: 'docs/product' },
  CORTEX: { repo: 'cortex', docsPath: 'docs/product' },
  REHEARSAL: { repo: 'axiom', docsPath: 'rehearsal/docs/product' },
  RADAR: { repo: 'the-firm', docsPath: 'scripts/radar/docs/product' },
};

function parseUpdatedDate(content: string): string | null {
  const match = content.match(/(?:updated|date|Updated):\s*(\d{4}-\d{2}-\d{2})/);
  return match?.[1] || null;
}

function calcStaleness(dateStr: string | null): ProductIntel['staleness'] {
  // File exists but has no parseable date — treat as stale, not missing
  // 'missing' is reserved for when the file itself cannot be found
  if (!dateStr) return 'stale';
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
    // Support both "## YYYY-MM-DD" heading format and "| YYYY-MM-DD | ..." table row format
    const headingMatch = line.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
    const tableMatch = line.match(/^\|\s*(\d{4}-\d{2}-\d{2})\s*\|/);
    const dateMatch = headingMatch || tableMatch;
    if (dateMatch && !lastDate) lastDate = dateMatch[1];

    // Table rows: extract "What changed" column (3rd pipe-delimited cell)
    if (tableMatch && changes.length < 3 && !line.match(/^\|[\s-:|]+\|/)) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 3 && cells[1] && cells[2]) {
        changes.push(`${cells[1]}: ${cells[2]}`);
      }
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch && changes.length < 3) changes.push(bulletMatch[1].trim());
  }

  return { lastDate, changes };
}

function parsePrdCompletion(content: string): { done: number; total: number } | null {
  // Best method: parse the Summary section directly (most reliable)
  // Format: | Done | 33 | or | **Total** | 61 |
  const doneMatch = content.match(/\|\s*Done\s*\|\s*(\d+)\s*\|/);
  // Simplified total regex — matches "| Total | 61 |" or "| **Total** | 61 |"
  const totalLine = content.match(/\|\s*\*?\*?Total\*?\*?\s*\|\s*\*?\*?(\d+)\*?\*?\s*\|/);
  if (doneMatch && totalLine) {
    return { done: parseInt(doneMatch[1]), total: parseInt(totalLine[1]) };
  }

  // Fallback: count PRD-### rows with "Done" status
  const lines = content.split('\n');
  let done = 0;
  let total = 0;
  for (const line of lines) {
    if (!line.includes('|') || line.match(/^\|[\s-:|]+\|$/)) continue;
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (!cells[0]?.startsWith('PRD-')) continue;
    total++;
    const status = cells[3]?.replace(/\*\*/g, '').trim().toLowerCase() || '';
    if (status === 'done') done++;
  }
  if (total > 0) return { done, total };

  // Last fallback: checkbox format
  for (const line of lines) {
    if (line.match(/^\s*-\s*\[x\]/i)) { done++; total++; }
    else if (line.match(/^\s*-\s*\[\s*\]/)) { total++; }
  }
  return total > 0 ? { done, total } : null;
}

export async function fetchProductIntel(product: string): Promise<ProductIntel | null> {
  const mapping = PRODUCT_REPOS[product];
  if (!mapping) return null;

  const { repo, docsPath } = mapping;

  // Fetch docs with alternate filename fallbacks
  const [s1Primary, s1Alt, s2, s3Primary, s3Alt, s3Checklist, compLog] = await Promise.all([
    fetchRepoFile(repo, `${docsPath}/S1_COMPETITIVE_RESEARCH.md`),
    fetchRepoFile(repo, `${docsPath}/POSITIONING_BRIEF.md`),
    fetchRepoFile(repo, `${docsPath}/S2_MRD.md`),
    fetchRepoFile(repo, `${docsPath}/S3_PRD.md`),
    fetchRepoFile(repo, `${docsPath}/S3_PRD_CHECKLIST.md`),
    fetchRepoFile(repo, `${docsPath}/PRD_CHECKLIST.md`),
    fetchRepoFile(repo, `${docsPath}/COMPETITIVE_LOG.md`),
  ]);

  const s1 = s1Primary || s1Alt;
  const s3 = s3Primary || s3Alt || s3Checklist;
  const prdForCompletion = s3Checklist || s3Alt || s3Primary;

  const compData = compLog ? parseCompetitiveLog(compLog) : { lastDate: null, changes: [] };
  const s3Comp = prdForCompletion ? parsePrdCompletion(prdForCompletion) : null;

  // Use most recent date for staleness: competitive log, s1, or s2 dates
  const s1Date = s1 ? parseUpdatedDate(s1) : null;
  const s2Date = s2 ? parseUpdatedDate(s2) : null;
  const s3Date = s3 ? parseUpdatedDate(s3) : null;
  const refreshDate = compData.lastDate || s1Date || s2Date;

  return {
    product,
    repo: mapping.repo,
    s1Exists: !!s1,
    s1Date,
    s2Exists: !!s2,
    s2Date,
    s3Exists: !!s3,
    s3Date,
    s3Completion: s3Comp,
    lastCompetitiveRefresh: refreshDate,
    recentChanges: compData.changes,
    staleness: (s1 || compLog) ? calcStaleness(refreshDate) : 'missing',
  };
}

export async function fetchAllProductIntel(): Promise<ProductIntel[]> {
  const products = Object.keys(PRODUCT_REPOS);
  const results = await Promise.all(products.map(p => fetchProductIntel(p)));
  return results.filter((r): r is ProductIntel => r !== null);
}
