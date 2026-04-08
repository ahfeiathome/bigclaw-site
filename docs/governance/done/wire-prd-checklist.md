# EXECUTION BRIEF — Fix PRD Checklist Parser (One-Line Bug)

**Date:** 2026-04-07 | **To:** Code CLI (lc-bigclaw) | **Priority:** P0
**Status:** MANDATORY — Michael reviews PRD progress with co-founder Mr. L. Must work.
**Effort:** 5 minutes — one regex fix + verify.

## SITUATION

Everything is already wired — PRD_CHECKLIST.md files exist for 7 products, parser exists at `src/lib/prd-parser.ts`, all product pages call `fetchPrdChecklist(repo)` and pass `prdItems` to `ProductPage`, and the `PrdChecklist` component is fully built.

**One bug:** The parser only matches GrovaKid's `PRD-xxx` prefix. All other products use different prefixes (FC-, KT-, IS-, CX-, FF-, RH-) and get silently skipped.

## FIX — One line in `src/lib/prd-parser.ts`

Change line:
```typescript
if (cells.length < 5 || !cells[0].startsWith('PRD-')) continue;
```

To:
```typescript
if (cells.length < 5 || !cells[0].match(/^[A-Z]+-\d+/)) continue;
```

This matches any uppercase prefix followed by dash and digits: PRD-001, FC-001, KT-001, IS-001, CX-001, FF-001, RH-001.

## VERIFY

After the fix, check these product pages show PRD progress:
- [ ] /dashboard/products/grovakid — 61 items (PRD-xxx)
- [ ] /dashboard/products/fairconnect — 13 items (FC-xxx)
- [ ] /dashboard/products/keeptrack — 12 items (KT-xxx)
- [ ] /dashboard/products/iris-studio — 20 items (IS-xxx)
- [ ] /dashboard/products/fatfrogmodels — 21 items (FF-xxx)
- [ ] /dashboard/products/cortex — 15 items (CX-xxx)
- [ ] /dashboard/products/rehearsal — 13 items (RH-xxx)

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
