# EXECUTION BRIEF — Sidebar: Logo, Watermark, Logout, Settings Access

**Date:** 2026-04-05 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1

---

## Issue 1 — Logo too small, needs full-width treatment

File: src/components/sidebar-nav.tsx

Current brand block shows small logo + "BigClaw AI" text side by side.

Replace with stacked layout — logo full sidebar width, text below:

```tsx
<Link
  href="/dashboard/mission-control"
  className="flex flex-col items-center px-3 py-4 mb-2 no-underline gap-2"
>
  <img
    src="/images/bigclaw-logo-transparent.jpeg"
    alt="BigClaw AI"
    className="w-full rounded-lg"
    style={{ maxHeight: '120px', objectFit: 'contain', mixBlendMode: 'luminosity' }}
  />
  <span style={{ fontSize: '14px', fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>
    BigClaw AI
  </span>
</Link>
```

DONE: Logo spans full sidebar width. "BigClaw AI" text sits centred below it.

---

## Issue 2 — Watermark too small

File: src/app/dashboard/layout.tsx

Current watermark div has backgroundSize: '480px auto'.

Change to make it fill ~80% of the viewport:

```tsx
backgroundSize: '70vw auto',
opacity: 0.05,
```

DONE: Watermark visibly large behind all dashboard pages.

---

## Issue 3 — No logout button

There is no way to log out. Add logout in two places:

### 3a — Logout API route: src/app/api/auth/logout/route.ts

```ts
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set('bigclaw-auth', '', { maxAge: 0, path: '/' });
  response.cookies.set('bigclaw-user', '', { maxAge: 0, path: '/' });
  return response;
}
```

### 3b — Logout button in sidebar (bottom, all roles)

Add at the very bottom of the sidebar nav, outside all role blocks:

```tsx
<div className="px-2 pb-4 mt-auto border-t border-border/30 pt-3">
  <button
    onClick={async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/dashboard/login';
    }}
    className="w-full px-3 py-1.5 rounded-md text-left text-muted-foreground
      hover:text-foreground hover:bg-muted/50 transition-all duration-150
      bg-transparent border-none cursor-pointer"
    style={{ fontSize: '13px' }}
  >
    Sign out
  </button>
</div>
```

DONE: "Sign out" visible at bottom of sidebar for all users.
Clicking clears both cookies and redirects to login page.

---

## Issue 4 — Settings inaccessible (Access denied)

The Settings page returns 403 because the admin cookie check fails.
Root cause: Michael's session cookie is stale (set before recent auth changes).

Fix: after logout is built (Issue 3), Michael logs out and back in.
Fresh cookie will have correct role=admin and Settings will work.

Additionally — remove /dashboard/settings from INTERNAL_PREFIXES in middleware.ts
OR ensure admin bypass fires before the internal check (verify order is correct).

Check middleware.ts — confirm this order:
1. if role === 'admin' → return NextResponse.next()  ← must be FIRST
2. if isInternal → return Forbidden

If order is wrong, fix it.

DONE: Admin can access /dashboard/settings/users after re-login.

---

## Verification

- Sidebar: logo full width, "BigClaw AI" below, Sign out at bottom
- Watermark: visibly large background image on all dashboard pages
- Click Sign out → clears session → lands on login page
- Log back in as admin → /dashboard/settings/users accessible

Screenshot sidebar with new logo layout as DONE evidence.
