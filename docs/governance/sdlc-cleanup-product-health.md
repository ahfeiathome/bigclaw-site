# EXECUTION BRIEF — SDLC Cleanup + Product Health Page

**Date:** 2026-04-05 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1

## Current SDLC sub-pages — what stays vs moves

| Route | Content | Action |
|---|---|---|
| sdlc/process | 8-stage code pipeline | KEEP — only page under SDLC |
| sdlc/gates | Quality gates matrix | MOVE → Product Health |
| sdlc/violations | Violations log | MOVE → Product Health |
| sdlc/rca | Bug root cause analysis | MOVE → Product Health |
| sdlc/actions | Improvement actions | MOVE → Product Health |
| sdlc/lessons | Lessons learned | MOVE → Product Health |

---

## Step 1 — New page: src/app/dashboard/products/health/page.tsx

Consolidates all 5 moved pages. Same data sources, same fetch functions.
All wrapped in CollapsibleSection:

A. Gates Matrix (default open) — fetchSDLCGatesMatrix()
B. Violations (default open) — fetchSDLCViolations()
C. Bug RCA (default collapsed) — fetchLearnings()
D. Improvement Actions (default collapsed) — fetchSDLCGatesMatrix()
E. Lessons Learned (default collapsed) — fetchLessonsLearned()

Page title: "Product Health"
Subtitle: "Gates, violations, bugs, and improvement actions across all products"

DONE: /dashboard/products/health loads all 5 sections with real data.

---

## Step 2 — Sidebar update

Under SDLC: single link only → /dashboard/sdlc/process. No sub-links.

Under PRODUCTS: add Product Health FIRST (before Foundry and RADAR):
[PRODUCTS]
  Products       → /dashboard/products
  Product Health → /dashboard/products/health   ← first sub-link
  Foundry        → /dashboard/foundry
  RADAR          → /dashboard/radar

---

## Step 3 — Redirect old SDLC sub-routes

In each file, replace content with redirect:

```tsx
import { redirect } from 'next/navigation';
export default function Page() { redirect('/dashboard/products/health'); }
```

Apply to: sdlc/gates, sdlc/violations, sdlc/rca, sdlc/actions, sdlc/lessons.

---

## Verification
- /dashboard/sdlc/process still works
- /dashboard/sdlc/gates redirects to /dashboard/products/health
- /dashboard/products/health loads all 5 sections
- Sidebar: SDLC has no sub-links

DO NOT delete sdlc/* page files — redirect them.
DO NOT touch sdlc/process/page.tsx.
