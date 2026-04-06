# EXECUTION BRIEF — Nav + Page Renames + PDLC Relocation

**Date:** 2026-04-05 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1

---

## Changes (5 total, all straightforward)

---

## 1 — PDLC moves into Mission Control

PDLC is not a standalone nav item. It is a section within Mission Control.

In `src/app/dashboard/mission-control/page.tsx`:
Add PDLC section below the existing KPI cards and action items.
Read from `data/pdlcRegistry.md` (same fetch as the old PDLC page).
Show: Active Products table (Product | Company | Stage badge | Next Gate | Blocker).
Keep it compact — this is a summary view, not the full detail page.
Stage badges colour-coded (S1-S3=gray, S4-S5=amber, S6-S8=green).
Michael gate blockers (💳/⚖️/🧠) highlighted amber.

Remove `/dashboard/pdlc` as a standalone route.
Add redirect: `/dashboard/pdlc` → `/dashboard/mission-control`.

Update sidebar: remove PDLC from PIPELINE section entirely.

DONE: PDLC table visible on Mission Control page. /dashboard/pdlc redirects there.

---

## 2 — SDLC moves to Knowledge (was Resources), process only

Rename Resources → Knowledge throughout:
- Sidebar link label: "Resources" → "Knowledge"
- Route stays `/dashboard/resources` (no redirect needed)
- Page h1: "Resources" → "Knowledge"

Add SDLC process link as a sub-item under Knowledge in sidebar:
```
Knowledge          → /dashboard/resources
  SDLC Process     → /dashboard/sdlc/process
```

Remove SDLC from PIPELINE section in sidebar.
PIPELINE section now only contains Product Gates (see item 3).
If PIPELINE section is now empty or has only one item, remove the
PIPELINE header and promote Product Gates to a standalone link.

DONE: "Knowledge" visible in sidebar. SDLC Process nested under it.

---

## 3 — Product Health renamed to Product Gates, moves under Product Lineup

Rename "Product Health" → "Product Gates" everywhere:
- Page h1, page subtitle, sidebar label, route comment
- Route stays `/dashboard/products/health` (no redirect needed)

"Product Gates" moves under "Product Lineup" in sidebar as first sub-item:
```
Product Lineup     → /dashboard/products
  Product Gates    → /dashboard/products/health   ← first sub-item
  ── FORGE · Education & Career ──
    GrovaKid
    REHEARSAL
  ── AXIOM · Consumer Apps & Commerce ──
    ...
  ── NEXUS · FinTech & Operations ──
    RADAR
```

DONE: "Product Gates" is the first sub-link under "Product Lineup".

---

## 4 — "All Products" renamed to "Product Lineup"

Rename everywhere:
- Sidebar top-level link: "All Products" → "Product Lineup"
- Route: `/dashboard/products` (unchanged)
- Page h1: "Products" → "Product Lineup"
- Page subtitle: update to match

DONE: Sidebar shows "Product Lineup". Page title matches.

---

## 5 — Product Lineup page: align content to left

Current page has `max-w-5xl mx-auto` centering the content.
For the Product Lineup page only, remove the max-width centering so
the table runs full width (or near-full) of the main content area.

In `src/app/dashboard/products/page.tsx` or its layout wrapper:
Remove `mx-auto` / `max-w-5xl` constraint for this page.
Table columns should use the full available width.

If the centering is set in the shared dashboard layout (layout.tsx),
add a page-specific override class rather than changing the layout.

DONE: Product Lineup table uses full content area width, not centred narrow column.

---

## Final Sidebar Structure

```
BigClaw AI [logo]

Mission Control     ← includes PDLC summary section
Finance

Product Lineup      → /dashboard/products
  Product Gates     → /dashboard/products/health
  ── FORGE · Education & Career ──
    GrovaKid
    REHEARSAL
  ── AXIOM · Consumer Apps & Commerce ──
    iris-studio
    fatfrogmodels
    FairConnect
    KeepTrack
    SubCheck
    CORTEX
  ── NEXUS · FinTech & Operations ──
    RADAR

Knowledge           → /dashboard/resources
  SDLC Process      → /dashboard/sdlc/process

Settings
  [Sign out]
```

---

## Verification

- Mission Control shows PDLC product table below KPI cards
- /dashboard/pdlc redirects to /dashboard/mission-control
- Sidebar: "Knowledge" not "Resources", SDLC nested under it
- Sidebar: "Product Lineup" not "All Products"
- Sidebar: "Product Gates" as first sub-item under Product Lineup
- Product Lineup page table spans full width (not centred narrow column)
- No broken links
