# EXECUTION BRIEF — Wire PRD Checklist to GrovaKid Dashboard Page

**Date:** 2026-04-07 | **To:** Code CLI (lc-bigclaw) | **Priority:** P0
**Status:** MANDATORY — Michael reviews PRD progress with co-founder Mr. L. Must work.

## SITUATION

The `PrdChecklist` component in `src/components/prd-checklist.tsx` is fully built — category progress bars, done/in-progress/deferred counters, filterable + sortable table, GitHub issue links. BUT the GrovaKid page at `src/app/dashboard/products/grovakid/page.tsx` has an empty `parsePrdItems()` that returns `[]`. The component renders nothing.

The data exists at `learnie-ai/docs/product/PRD_CHECKLIST.md` — 61 items across 9 categories with status, owner, priority, and GitHub issue links.

## FIX

### STEP 1: Implement parsePrdItems() to parse PRD_CHECKLIST.md

The markdown file has tables like:
```
| PRD-001 | AI Generation Engine — LLM for K-5 STEAM | AI/ML | In Progress | Code CLI | Apr 2026 | #53 |
```

Parse each table row into:
```typescript
{
  id: 'PRD-001',
  item: 'AI Generation Engine — LLM for K-5 STEAM',
  category: 'AI/ML',
  status: 'In Progress', // Done | In Progress | Not Started | Deferred
  owner: 'Code CLI',
  priority: 'P0', // Derive from which table section (P0/P1/P2) the row is in
  github: '#53'
}
```

The PRD_CHECKLIST.md has three sections: `## P0 — Must Ship`, `## P1 — Important`, `## P2 — Later`. Use the section header to determine priority.

### STEP 2: Wire fetchPrdChecklist → parsePrdItems → ProductPage

In `grovakid/page.tsx`:
```typescript
export default async function GrovakidProductPage() {
  const prdContent = await fetchPrdChecklist();
  const prdItems = prdContent ? parsePrdItems(prdContent) : [];
  
  return ProductPage({
    ...existingProps,
    prdItems,
  });
}
```

### STEP 3: Verify rendering

After wiring, the GrovaKid page should show:
- Category summary bars: AI/ML (0/7), Functional (3/7), UI/UX (0/7), etc.
- Counter: "9 of 61 done · 17 in progress · 30 not started · 5 deferred"
- Full sortable/filterable table with all 61 items
- GitHub issue links clickable

### STEP 4: Consider adding PRD summary to the Product Intelligence panel

Add a compact PRD progress indicator to the Product Intelligence panel so it appears on ALL product pages (not just GrovaKid):
```
PRD: 15% complete (9/61 done) — 17 in progress, 5 deferred
```

Read from `docs/product/S3_PRD.md` or `S3_PRD_CHECKLIST.md` — parse checkbox or table rows.

## DONE CRITERIA

- [ ] GrovaKid page shows PRD category progress bars
- [ ] Counter shows 9 done / 17 in progress / 30 not started / 5 deferred
- [ ] Table is filterable by category, priority, status
- [ ] GitHub issue links (#53, #30, etc.) are clickable
- [ ] Michael can show this page to Mr. L on a screen share
