import { fetchRepoFile } from './github';

// ── Content tree mapping: URL path → GitHub source ────────────────────────

export interface ContentSource {
  repo: string;
  path: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

// Map GitHub repo names to our repo structure
// "the-firm" = forge company repo, "axiom" = axiom company repo, "bigclaw-ai" = parent
const REPO_MAP = {
  forge: 'the-firm',
  axiom: 'axiom',
  parent: 'bigclaw-ai',
} as const;

// ── Fetch markdown content by dashboard path ──────────────────────────────

/**
 * Given a dashboard URL path (e.g. "forge/status/issues-snapshot"),
 * resolve and fetch the corresponding markdown file.
 */
export async function fetchContentByPath(contentPath: string): Promise<{
  content: string | null;
  title: string;
  source: ContentSource;
}> {
  const mapping = resolveContentSource(contentPath);
  if (!mapping) {
    return { content: null, title: 'Not Found', source: { repo: '', path: '' } };
  }

  const content = await fetchRepoFile(mapping.source.repo, mapping.source.path);
  return {
    content,
    title: mapping.title,
    source: mapping.source,
  };
}

interface ContentMapping {
  source: ContentSource;
  title: string;
}

function resolveContentSource(contentPath: string): ContentMapping | null {
  const parts = contentPath.split('/').filter(Boolean);

  // forge/status/[slug]
  if (parts[0] === 'forge' && parts[1] === 'status') {
    const slug = parts[2] || 'issues-snapshot';
    return {
      source: { repo: REPO_MAP.forge, path: `docs/status/${slug}.md` },
      title: `Forge Status: ${slug}`,
    };
  }

  // forge/specs/[slug]
  if (parts[0] === 'forge' && parts[1] === 'specs') {
    const slug = parts[2];
    if (!slug) return null; // listing page handled separately
    return {
      source: { repo: REPO_MAP.forge, path: `docs/specs/${slug}.md` },
      title: `Forge Spec: ${slug}`,
    };
  }

  // forge/finance
  if (parts[0] === 'forge' && parts[1] === 'finance') {
    return {
      source: { repo: REPO_MAP.forge, path: 'FINANCE.md' },
      title: 'Forge Finance',
    };
  }

  // axiom/status/[slug]
  if (parts[0] === 'axiom' && parts[1] === 'status') {
    const slug = parts[2] || 'issues-snapshot';
    return {
      source: { repo: REPO_MAP.axiom, path: `docs/status/${slug}.md` },
      title: `Axiom Status: ${slug}`,
    };
  }

  // axiom/specs/[slug]
  if (parts[0] === 'axiom' && parts[1] === 'specs') {
    const slug = parts[2];
    if (!slug) return null;
    return {
      source: { repo: REPO_MAP.axiom, path: `docs/specs/${slug}.md` },
      title: `Axiom Spec: ${slug}`,
    };
  }

  // axiom/finance
  if (parts[0] === 'axiom' && parts[1] === 'finance') {
    return {
      source: { repo: REPO_MAP.axiom, path: 'FINANCE.md' },
      title: 'Axiom Finance',
    };
  }

  // knowledge/[slug]
  if (parts[0] === 'knowledge') {
    const slug = parts[1];
    if (!slug) return null;
    return {
      source: { repo: REPO_MAP.parent, path: `knowledge/${slug}.md` },
      title: slug,
    };
  }

  // learnings
  if (parts[0] === 'learnings') {
    return {
      source: { repo: REPO_MAP.parent, path: 'growth/LEARNINGS.md' },
      title: 'Cross-Company Learnings',
    };
  }

  // founder/todo (legacy: sponsor/todo)
  if ((parts[0] === 'founder' || parts[0] === 'sponsor') && parts[1] === 'todo') {
    return {
      source: { repo: REPO_MAP.parent, path: 'founder/FOUNDER_TODO.md' },
      title: 'Founder TODO',
    };
  }

  // portfolio
  if (parts[0] === 'portfolio') {
    return {
      source: { repo: REPO_MAP.parent, path: 'knowledge/INVESTMENT_PORTFOLIO.md' },
      title: 'Investment Portfolio',
    };
  }

  return null;
}

// ── List files in a GitHub directory ──────────────────────────────────────

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const OWNER = 'ahfeiathome';

interface GitHubTreeItem {
  path: string;
  type: string;
}

export async function listDirectoryFiles(
  repo: string,
  dirPath: string,
): Promise<string[]> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

    const res = await fetch(
      `https://api.github.com/repos/${OWNER}/${repo}/contents/${dirPath}`,
      { headers, next: { revalidate: 300 } },
    );
    if (!res.ok) return [];

    const data = (await res.json()) as GitHubTreeItem[];
    return data
      .filter((item) => item.type === 'file' && item.path.endsWith('.md'))
      .map((item) => {
        const filename = item.path.split('/').pop() || '';
        return filename.replace(/\.md$/, '');
      });
  } catch {
    return [];
  }
}

// ── Pre-defined listing fetchers ─────────────────────────────────────────

export async function listForgeSpecs(): Promise<string[]> {
  return listDirectoryFiles(REPO_MAP.forge, 'docs/specs');
}

export async function listAxiomSpecs(): Promise<string[]> {
  return listDirectoryFiles(REPO_MAP.axiom, 'docs/specs');
}

export async function listKnowledgeEntries(): Promise<string[]> {
  return listDirectoryFiles(REPO_MAP.parent, 'knowledge');
}

// ── Top bar navigation (company/ops tabs) ────────────────────────────────

export const TOP_BAR_TABS: NavItem[] = [
  { label: 'Mission Control', href: '/dashboard/mission-control' },
  { label: 'Finance', href: '/dashboard/departments/finance' },
  { label: 'Organization', href: '/dashboard/departments/infrastructure' },
  { label: 'Resources', href: '/dashboard/departments/knowledge' },
  { label: 'Marketing', href: '/dashboard/departments/marketing' },
];

// ── Product definitions for sidebar ──────────────────────────────────────

export interface ProductDef {
  slug: string;
  name: string;
  href: string;
  status: 'LIVE' | 'PAPER' | 'SETUP' | 'SPEC' | 'BUILD';
  stage: string;
}

export const ALL_PRODUCTS: ProductDef[] = [
  { slug: 'radar', name: 'RADAR', href: '/dashboard/products/radar', status: 'PAPER', stage: 'S2 DEFINE' },
  { slug: 'grovakid', name: 'GrovaKid', href: '/dashboard/products/grovakid', status: 'LIVE', stage: 'S4 BUILD' },
  { slug: 'fatfrogmodels', name: 'fatfrogmodels', href: '/dashboard/products/fatfrogmodels', status: 'LIVE', stage: 'S7 LAUNCH' },
  { slug: 'iris-studio', name: 'iris-studio', href: '/dashboard/products/iris-studio', status: 'BUILD', stage: 'S4 BUILD' },
  { slug: 'cortex', name: 'CORTEX', href: '/dashboard/products/cortex', status: 'BUILD', stage: 'S4 BUILD' },
  { slug: 'rehearsal', name: 'REHEARSAL', href: '/dashboard/products/rehearsal', status: 'BUILD', stage: 'S3 DESIGN' },
  { slug: 'fairconnect', name: 'FairConnect', href: '/dashboard/products/fairconnect', status: 'SETUP', stage: 'S2 DEFINE' },
  { slug: 'keeptrack', name: 'KeepTrack', href: '/dashboard/products/keeptrack', status: 'SETUP', stage: 'S2 DEFINE' },
  { slug: 'subcheck', name: 'SubCheck', href: '/dashboard/products/subcheck', status: 'SETUP', stage: 'S1 DONE' },
  { slug: 'bigclaw-dashboard', name: 'BigClaw Dashboard', href: '/dashboard', status: 'LIVE', stage: 'S7 LAUNCH' },
];

export function getLiveProducts(): ProductDef[] {
  return ALL_PRODUCTS.filter(p => p.status === 'LIVE' || p.status === 'PAPER');
}

export function getDevProducts(): ProductDef[] {
  return ALL_PRODUCTS.filter(p => p.status !== 'LIVE' && p.status !== 'PAPER');
}

