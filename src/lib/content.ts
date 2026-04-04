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

  // sponsor/todo
  if (parts[0] === 'sponsor' && parts[1] === 'todo') {
    return {
      source: { repo: REPO_MAP.parent, path: 'sponsor/MICHAEL_TODO.md' },
      title: 'Michael TODO',
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

// ── Navigation tree ──────────────────────────────────────────────────────

export const NAV_TREE: NavItem[] = [
  { label: 'CEO Overview', href: '/dashboard' },
  { label: 'RADAR', href: '/dashboard/radar' },
  {
    label: 'Products',
    href: '/dashboard/products',
    children: [
      { label: 'GrovaKid', href: '/dashboard/products/grovakid' },
      { label: 'FairConnect', href: '/dashboard/products/fairconnect' },
      { label: 'KeepTrack', href: '/dashboard/products/keeptrack' },
      { label: 'SubCheck', href: '/dashboard/products/subcheck' },
      { label: 'iris-studio', href: '/dashboard/products/iris-studio' },
      { label: 'fatfrogmodels', href: '/dashboard/products/fatfrogmodels' },
    ],
  },
  {
    label: 'Departments',
    href: '/dashboard/departments',
    children: [
      { label: 'Finance (CFO)', href: '/dashboard/departments/finance' },
      { label: 'Operations (COO)', href: '/dashboard/departments/operations' },
      { label: 'Infrastructure (CIO)', href: '/dashboard/departments/infrastructure' },
      { label: 'Knowledge Hub (BDM)', href: '/dashboard/departments/knowledge' },
      { label: 'Marketing (CMO)', href: '/dashboard/departments/marketing' },
    ],
  },
  { label: 'Sponsor TODO', href: '/dashboard/sponsor/todo' },
  { label: 'Settings', href: '/dashboard/settings' },
  {
    label: 'Legacy Views',
    href: '/dashboard/forge',
    children: [
      { label: 'Forge', href: '/dashboard/forge' },
      { label: 'Axiom', href: '/dashboard/axiom' },
      { label: 'Learnings', href: '/dashboard/learnings' },
      { label: 'Portfolio', href: '/dashboard/portfolio' },
    ],
  },
];
