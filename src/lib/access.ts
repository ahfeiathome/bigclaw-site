import accessConfig from '@/../config/access.json';

export interface UserAccess {
  email: string;
  role: string;
  pages: string[];
  controls: boolean;
  internal: boolean;
  products?: string[];
}

interface UserEntry {
  role: string;
  products?: string[];
}

interface RoleEntry {
  pages: string[];
  controls: boolean;
  internal: boolean;
}

const users = accessConfig.users as Record<string, UserEntry>;
const roles = accessConfig.roles as Record<string, RoleEntry>;

export function getUserAccess(email: string): UserAccess | null {
  const user = users[email.toLowerCase()];
  if (!user) return null;

  const role = roles[user.role];
  if (!role) return null;

  return {
    email: email.toLowerCase(),
    role: user.role,
    pages: role.pages,
    controls: role.controls,
    internal: role.internal,
    products: user.products,
  };
}

export function canAccessPage(access: UserAccess, pathname: string): boolean {
  // Admin sees everything
  if (access.pages.includes('*')) return true;

  // Strip /dashboard/ prefix for matching
  const page = pathname.replace(/^\/dashboard\/?/, '');

  // Check internal pages
  const internalPages = ['departments/operations', 'departments/infrastructure', 'sponsor', 'settings', 'forge', 'axiom', 'learnings'];
  if (internalPages.some(p => page.startsWith(p)) && !access.internal) {
    return false;
  }

  // Check page-level access
  for (const allowed of access.pages) {
    if (allowed === 'overview' && (page === '' || page === '/')) return true;
    if (allowed === 'finance' && page.startsWith('departments/finance')) return true;

    // Handle products/{product} pattern
    if (allowed === 'products/{product}' && page.startsWith('products/')) {
      const product = page.replace('products/', '').split('/')[0];
      if (access.products?.includes(product)) return true;
    }

    if (page.startsWith(allowed)) return true;
  }

  return false;
}

export function getAccessConfig() {
  return accessConfig;
}
