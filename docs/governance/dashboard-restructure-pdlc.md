# EXECUTION BRIEF — Dashboard Restructure: PDLC + Nav + Data Hygiene

**Date:** 2026-04-05 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1

## Obsidian sources already written (do not touch):
- knowledge/PDLC_REGISTRY.md — product PDLC status
- bigclaw-site/data/manifest.json — updated to v2, pdlcRegistry + pdlcProcess added

---

## Step 1 — Sidebar (src/components/sidebar-nav.tsx)

New structure:
```
BigClaw AI [brand]
Mission Control
Finance
[PRODUCTS]
  Products     → /dashboard/products
  Foundry      → /dashboard/foundry
  RADAR        → /dashboard/radar
[PIPELINE]
  PDLC         → /dashboard/pdlc       ← NEW
  SDLC         → /dashboard/sdlc/process
  Team         → /dashboard/organization/team
Resources
```

Remove: Education, FinTech, E-Commerce, Business sub-links.

---

## Step 2 — New PDLC page (src/app/dashboard/pdlc/page.tsx)

Reads from data/pdlcRegistry.md (synced from knowledge/PDLC_REGISTRY.md).

Four sections:
A. Stage Reference table (collapsible, default collapsed) — S1-S8 with names
B. Active Products table (always visible) — Company | Stage badge | Status | Next Gate | Blocker
   Stage badges: S1-S3=gray, S4-S5=amber, S6-S8=green
   Blocker col: if contains 💳/⚖️/🧠 → amber highlight (Michael gate)
C. Foundry Pipeline (SectionCard) — Axiom Apple IAP apps + apple dev $99 alert
D. Shelved Products (collapsible, default collapsed) — muted styling

DONE: /dashboard/pdlc loads all four sections from Obsidian data. No hardcoding.

---

## Step 3 — Fix Products page: remove hardcoded PRODUCT_META

src/app/dashboard/products/page.tsx has hardcoded PRODUCT_META object.
Replace: read from data/registry.md + data/pdlcRegistry.md dynamically.
Fall back only for URL fields not in Obsidian.

DONE: adding product to REGISTRY.md appears on Products page after sync.

---

## Step 4 — Fix Foundry page: remove hardcoded AppInfo[]

src/app/dashboard/foundry/page.tsx hardcodes app list.
Replace: read from data/pdlcRegistry.md, filter Company=Axiom + Apple IAP rows.

DONE: REHEARSAL appears on Foundry page after sync without code change.

---

## Step 5 — Sync data/registry.md

Run data sync so data/registry.md matches REGISTRY.md (OpenClaw→Nexus, REHEARSAL added).

---

## Step 6 — Audit orphaned pages

| Directory | Action |
|---|---|
| /dashboard/business | DELETE |
| /dashboard/departments | DELETE if empty |
| /dashboard/portfolio | VERIFY content → sidebar or delete |
| /dashboard/projects | VERIFY → if duplicate of Products, delete |
| /dashboard/axiom | VERIFY → sidebar or delete |
| /dashboard/forge | VERIFY → sidebar or delete |
| /dashboard/sponsor | KEEP → add SubLink under Mission Control |
| /dashboard/settings | KEEP → sidebar (after user-management-page.md) |
| /dashboard/infra | KEEP → SubLink under Resources |
| /dashboard/learnings | KEEP → SubLink under Resources |

---

## Verification
- /dashboard/pdlc loads, all sections, Obsidian-sourced
- Sidebar: PDLC above SDLC, Products section correct
- /dashboard/products: no hardcoded PRODUCT_META
- /dashboard/foundry: reads dynamically
- data/registry.md: Nexus + REHEARSAL present
- No dead sidebar links

DO NOT merge PDLC into SDLC — different concepts entirely.
