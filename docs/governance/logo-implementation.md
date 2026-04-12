# EXECUTION BRIEF — Logo Implementation

**Date:** 2026-04-05 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1

## Assets (already in repo)
- /public/images/bigclaw-logo.png — original (white background)
- /public/images/bigclaw-logo-transparent.jpeg — transparent version (use this)

---

## Step 1 — Login page: large centered logo
File: src/app/dashboard/login/page.tsx

Place above the login form, centered, ~240px wide:
```tsx
<img src="/images/bigclaw-logo-transparent.jpeg" alt="BigClaw AI" width={240}
  className="mx-auto mb-6" style={{ mixBlendMode: 'luminosity' }} />
```

DONE: Login page shows logo prominently above form. Looks good on mobile.

---

## Step 2 — Sidebar: replace emoji with logo (small)
File: src/components/sidebar-nav.tsx

Current brand line has 🦀 emoji. Replace with logo image ~32px height, keep text:
```tsx
<img src="/images/bigclaw-logo-transparent.jpeg" alt=""
  className="h-8 w-auto" style={{ mixBlendMode: 'luminosity' }} />
<span>BigClaw AI</span>
```

DONE: Sidebar shows logo image (small) + "BigClaw AI" text. No emoji.

---

## Step 3 — Mobile TopBar: same treatment
File: src/app/dashboard/layout.tsx — TopBar component.

Same replacement: emoji → logo image ~24px height, keep text.

---

## Step 4 — Watermark on all dashboard pages
File: src/app/dashboard/layout.tsx — outermost wrapper div.

Add as first child inside the wrapper:
```tsx
{/* Watermark */}
<div
  aria-hidden="true"
  style={{
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    backgroundImage: 'url(/images/bigclaw-logo-transparent.jpeg)',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center center',
    backgroundSize: '480px auto',
    opacity: 0.06,
    mixBlendMode: 'luminosity',
  }}
/>
```

Ensure all existing children (sidebar, main) have z-index >= 1.

DONE: Watermark visible behind all dashboard pages. Not on login page.

---

## Step 5 — Commit and deploy

git add public/images/bigclaw-logo-transparent.jpeg public/images/bigclaw-logo.png
Preview deploy → visual check login (large logo), sidebar (small), watermark.
Promote to production after visual check passes.

DO NOT add white background box around logo.
DO NOT add watermark to login page (already has large logo).
