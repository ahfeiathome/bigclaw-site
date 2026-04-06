# EXECUTION BRIEF — Mr. L Login + Full UM Fix

**Date:** 2026-04-05 | **To:** Code CLI (lc-bigclaw) | **Priority:** P0

## Bugs Found (6 total — 2 fixed by Consultant, 4 for Code)

Already fixed in config/access.json and src/app/api/auth/route.ts:
- bin.lam@outlook.com added to access list
- products array now written to bigclaw-user cookie

Code must fix these 4:

---

## Bug 1 — Route mismatch (CRITICAL)

Middleware checks pathname.startsWith('/dashboard/products/') for product-viewer.
GrovaKid page lives at /dashboard/grovakid/ — pattern never fires.

Fix in src/middleware.ts — replace product-viewer block:

```ts
if (role === 'product-viewer') {
  const allowedProducts: string[] = user.products || [];
  const PRODUCT_ROUTES: Record<string, string> = {
    grovakid: '/dashboard/grovakid',
    radar: '/dashboard/radar',
    fairconnect: '/dashboard/foundry',
  };
  const allowed = allowedProducts.map(p => PRODUCT_ROUTES[p]).filter(Boolean);
  const ALWAYS_ALLOWED = ['/dashboard/login'];
  const isAllowed = [...ALWAYS_ALLOWED, ...allowed].some(p => pathname.startsWith(p));
  if (!isAllowed) {
    return NextResponse.redirect(new URL(allowed[0] || '/dashboard/login', request.url));
  }
}
```

DONE: bin.lam@outlook.com hitting /dashboard/finance redirects to /dashboard/grovakid.

---

## Bug 2 — Post-login redirects to Mission Control

Fix src/app/api/auth/route.ts — add redirect field to success response:

```ts
let redirectTo = '/dashboard';
if (access.role === 'product-viewer' && access.products?.length) {
  const PRODUCT_ROUTES: Record<string, string> = {
    grovakid: '/dashboard/grovakid',
    radar: '/dashboard/radar',
  };
  redirectTo = PRODUCT_ROUTES[access.products[0]] || '/dashboard';
} else if (access.role === 'investor') {
  redirectTo = '/dashboard/mission-control';
}
// Add redirect to the JSON response:
return NextResponse.json({ ok: true, role: access.role, redirect: redirectTo });
```

Fix src/app/dashboard/login/page.tsx — use redirect from response:

```ts
if (res.ok) {
  const data = await res.json();
  const from = searchParams.get('from') || data.redirect || '/dashboard';
  router.push(from);
  router.refresh();
}
```

DONE: bin.lam@outlook.com logs in → lands directly on /dashboard/grovakid.

---

## Bug 3 — Sidebar shows all links to all roles

Fix src/components/sidebar-nav.tsx — read role from cookie, filter links:

```ts
function getRoleFromCookie(): { role: string; products: string[] } {
  if (typeof document === 'undefined') return { role: 'admin', products: [] };
  try {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('bigclaw-user='));
    if (!cookie) return { role: 'admin', products: [] };
    return JSON.parse(decodeURIComponent(cookie.split('=').slice(1).join('=')));
  } catch { return { role: 'admin', products: [] }; }
}
```

In SidebarNav: useEffect to read role, then conditionally render:
- admin → all links (unchanged)
- product-viewer → only their allowed product links
- investor → Mission Control + Finance only

DONE: bin.lam@outlook.com sees only GrovaKid in sidebar.

---

## Verification

1. Login as bin.lam@outlook.com → lands on /dashboard/grovakid
2. Navigate to /dashboard/finance → redirects to /dashboard/grovakid
3. Sidebar shows only GrovaKid
4. Login as michaelmkliu@gmail.com (password) → Mission Control, full sidebar

DO NOT break existing admin/password auth flow.
