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

// ── Product definitions — read dynamically from REGISTRY.md ──────────────

export interface ProductDef {
  slug: string;
  name: string;
  href: string;
  status: 'LIVE' | 'PAPER' | 'SETUP' | 'SPEC' | 'BUILD';
  stage: string;
}

// Slug mapping for products whose name differs from URL slug
const SLUG_MAP: Record<string, string> = {
  GrovaKid: 'grovakid',
  RADAR: 'radar',
  REHEARSAL: 'rehearsal',
  FairConnect: 'fairconnect',
  KeepTrack: 'keeptrack',
  SubCheck: 'subcheck',
  CORTEX: 'cortex',
  'iris-studio': 'iris-studio',
  fatfrogmodels: 'fatfrogmodels',
  'BigClaw Dashboard': 'bigclaw-dashboard',
};

function inferStatus(stage: string): ProductDef['status'] {
  if (stage.includes('S7') || stage.includes('S8') || stage.toLowerCase().includes('launch') || stage.toLowerCase().includes('active')) return 'LIVE';
  if (stage.toLowerCase().includes('paper')) return 'PAPER';
  if (stage.includes('S4') || stage.includes('S5') || stage.includes('S3')) return 'BUILD';
  if (stage.includes('S1') || stage.includes('S2')) return 'SETUP';
  return 'SPEC';
}

function parseRegistryProducts(registryMd: string): ProductDef[] {
  const products: ProductDef[] = [];
  const lines = registryMd.split('\n');

  for (const line of lines) {
    // Match table rows: | Product | Repo | Revenue | Stage | ...
    if (!line.startsWith('|') || line.match(/^\|[\s-:|]+\|$/) || line.includes('Product') && line.includes('Repo')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;

    const name = cells[0];
    const stageRaw = cells[3]; // Stage column

    // Skip non-product rows (headers, Operations section without standard stage)
    if (!stageRaw || !name || name === 'Product') continue;
    // Extract just the stage code (e.g. "S4 BUILD" from "S4 BUILD (advanced)")
    const stageMatch = stageRaw.match(/(S\d\s+\w+)/);
    if (!stageMatch && !stageRaw.toLowerCase().includes('active')) continue;

    const stage = stageMatch?.[1] || stageRaw;
    const slug = SLUG_MAP[name] || name.toLowerCase().replace(/\s+/g, '-');
    const href = slug === 'bigclaw-dashboard' ? '/dashboard' : `/dashboard/products/${slug}`;

    products.push({
      slug,
      name,
      href,
      status: inferStatus(stageRaw),
      stage,
    });
  }

  return products;
}

/**
 * Fetch products dynamically from REGISTRY.md via GitHub API.
 * Returns parsed products or falls back to minimal defaults.
 */
export async function fetchProducts(): Promise<ProductDef[]> {
  const registryMd = await fetchRepoFile('bigclaw-ai', 'REGISTRY.md');
  if (registryMd) {
    const parsed = parseRegistryProducts(registryMd);
    if (parsed.length > 0) return parsed;
  }
  // Fallback: return minimal set so dashboard doesn't break
  return [
    { slug: 'bigclaw-dashboard', name: 'BigClaw Dashboard', href: '/dashboard', status: 'LIVE', stage: 'Active' },
  ];
}

// Kept for backward compat — consumers should migrate to fetchProducts()
export const ALL_PRODUCTS: ProductDef[] = [];

export function getLiveProducts(): ProductDef[] {
  return []; // Use fetchProducts() instead
}

export function getDevProducts(): ProductDef[] {
  return []; // Use fetchProducts() instead
}

