# EXECUTION BRIEF — PRD Checklists for ALL Products (No Exceptions)

**Date:** 2026-04-08 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1
**Replaces:** `docs/governance/prd-checklists-all-products.md` (previous version skipped products)

## SITUATION

Every product follows the same PDLC pipeline. The stage determines what's filled in, not
whether the structure exists. Currently only GrovaKid has a PRD checklist wired to the
dashboard. This is a governance gap across the entire portfolio.

### Current state (10 products)

| Product | Stage | Has S3 PRD? | Has Checklist? | Dashboard wired? |
|---------|-------|-------------|----------------|------------------|
| GrovaKid | S4 | ✅ | ✅ 61 items | ✅ |
| FairConnect | S4 | ✅ | ❌ | ❌ |
| KeepTrack | S5 | ✅ | ❌ | ❌ |
| REHEARSAL | S3 | ✅ | ❌ | ❌ |
| iris-studio | S4 | ❌ MISSING | ❌ | ❌ |
| fatfrogmodels | S7 | ❌ MISSING | ❌ | ❌ |
| CORTEX | S4 | ❌ MISSING | ❌ | ❌ |
| RADAR | S4 | ❌ MISSING | ❌ | ❌ |
| SubCheck | S1 | N/A (S1) | N/A | ❌ |
| Dashboard | Ops | N/A (internal) | N/A | N/A |

### Two workstreams

**Workstream A (Consultant):** Create PRD_CHECKLIST.md for the 3 products with PRDs.
Write S3_PRD.md shells for the 4 products missing PRDs. Consultant delivers these files
directly — no spec needed for Code.

**Workstream B (Code = this spec):** Generalize the dashboard so ANY product with a
PRD_CHECKLIST.md in its repo renders the checklist automatically.

---

## STEP 0: Move wire-prd-checklist.md to done/

GrovaKid's checklist is confirmed wired and rendering. Move `docs/governance/wire-prd-checklist.md` → `docs/governance/done/`.

## STEP 1: Extract parsePrdItems to shared utility

Move `parsePrdItems()` from `src/app/dashboard/products/grovakid/page.tsx` to `src/lib/prd-parser.ts`. Export it. Import in grovakid page (no behavior change).

## STEP 2: Generalize fetchPrdChecklist()

In `src/lib/github.ts`, change:
```typescript
export async function fetchPrdChecklist(
  repo: string = 'learnie-ai',
  path: string = 'docs/product/PRD_CHECKLIST.md'
): Promise<string | null> {
  return fetchRepoFile(repo, path);
}
```

## STEP 3: Wire ALL product pages

Every product page that has a PRD_CHECKLIST.md in its repo should fetch and render it.
Use the same pattern as GrovaKid:

```typescript
import { fetchPrdChecklist } from '@/lib/github';
import { parsePrdItems } from '@/lib/prd-parser';

export default async function ProductPageXyz() {
  const prdContent = await fetchPrdChecklist('REPO_NAME');
  const prdItems = prdContent ? parsePrdItems(prdContent) : [];
  return ProductPage({ ...existingProps, prdItems });
}
```

Wire these product pages (Consultant will deliver the PRD_CHECKLIST.md files):
- `fairconnect/page.tsx` → repo `fairconnect`
- `keeptrack/page.tsx` → repo `keeptrack`
- `rehearsal/page.tsx` → repo `rehearsal`
- `iris-studio/page.tsx` → repo `iris-studio`
- `fatfrogmodels/page.tsx` → repo `fatfrogmodels`
- `cortex/page.tsx` → repo `cortex`  (TBD — may be under axiom/)
- `radar/page.tsx` → repo `radar-site` or wherever RADAR lives

For products where PRD_CHECKLIST.md doesn't exist yet, `fetchPrdChecklist()` returns null
and `parsePrdItems` returns `[]` — the component gracefully shows nothing. As Consultant
delivers checklist files, they'll automatically appear on the dashboard.

## STEP 4: SubCheck gets a stage-appropriate section

SubCheck is at S1 — it shouldn't have a PRD checklist yet. But its product page should
show what S1 docs exist (competitive research) and what the next PDLC gate is (S2 MRD).
Add a simple text block: "S1 DISCOVER complete. Next gate: S2 MRD."

## DONE CRITERIA

- [ ] `parsePrdItems()` extracted to `src/lib/prd-parser.ts`
- [ ] `fetchPrdChecklist()` accepts repo + path params
- [ ] All 8 product pages (excluding Dashboard, SubCheck) attempt to fetch PRD_CHECKLIST.md
- [ ] GrovaKid still works (regression)
- [ ] Products without checklist files render gracefully (no error, no empty component)
- [ ] SubCheck shows stage-appropriate text
- [ ] `wire-prd-checklist.md` moved to done/

## DEPENDENCY

This spec can run immediately. The dashboard will show checklists as Consultant delivers
PRD_CHECKLIST.md files to each repo. No blocking dependency — empty gracefully.
# ADDENDUM to prd-checklists-all-products.md

## STEP 6: Update data-manifest.json

Add all product checklists to `bigclaw-ai/config/data-manifest.json` so the build-time
sync pipeline picks them up. Currently only GrovaKid's checklist is mapped.

Add these entries to the manifest's `sources` object:

```json
"prdChecklistFairconnect":  { "path": "axiom/fairconnect/docs/product/PRD_CHECKLIST.md",   "required": false, "dashboardPages": ["products"] },
"prdChecklistKeeptrack":    { "path": "axiom/keeptrack/docs/product/PRD_CHECKLIST.md",     "required": false, "dashboardPages": ["products"] },
"prdChecklistRehearsal":    { "path": "axiom/rehearsal/docs/product/PRD_CHECKLIST.md",     "required": false, "dashboardPages": ["products"] },
"prdChecklistIrisStudio":   { "path": "axiom/iris-studio/docs/product/PRD_CHECKLIST.md",   "required": false, "dashboardPages": ["products"] },
"prdChecklistFatfrogmodels": { "path": "axiom/fatfrogmodels/docs/product/PRD_CHECKLIST.md", "required": false, "dashboardPages": ["products"] },
"prdChecklistCortex":       { "path": "axiom/cortex/docs/product/PRD_CHECKLIST.md",        "required": false, "dashboardPages": ["products"] },
"prdChecklistRadar":        { "path": "forge/scripts/radar/docs/product/PRD_CHECKLIST.md", "required": false, "dashboardPages": ["products"] },
"mrdFairconnect":           { "path": "axiom/fairconnect/docs/product/S2_MRD.md",          "required": false, "dashboardPages": ["products"] },
"mrdKeeptrack":             { "path": "axiom/keeptrack/docs/product/S2_MRD.md",            "required": false, "dashboardPages": ["products"] },
"mrdRehearsal":             { "path": "axiom/rehearsal/docs/product/S2_MRD.md",            "required": false, "dashboardPages": ["products"] },
"mrdIrisStudio":            { "path": "axiom/iris-studio/docs/product/S2_MRD.md",          "required": false, "dashboardPages": ["products"] },
"mrdFatfrogmodels":         { "path": "axiom/fatfrogmodels/docs/product/S2_MRD.md",        "required": false, "dashboardPages": ["products"] },
"mrdCortex":                { "path": "axiom/cortex/docs/product/S2_MRD.md",               "required": false, "dashboardPages": ["products"] },
"mrdRadar":                 { "path": "forge/scripts/radar/docs/product/S2_MRD.md",        "required": false, "dashboardPages": ["products"] }
```

Also update `bigclaw-site/data/manifest.json` (the committed copy) with the same entries.

## STEP 7: Add standing rules to each session's CLAUDE.md

Each session's CLAUDE.md should include:

```markdown
## Standing Rule: PRD Checklist Updates
After completing any work that changes a PRD item's status:
1. Update `docs/product/PRD_CHECKLIST.md` — change status to Done/In Progress
2. Update `docs/product/S3_PRD.md` if the feature scope changed
3. Commit both files in the same commit as the feature work
This is part of the DONE criteria — feature is not DONE until checklist is updated.
```

Add to:
- `forge/learnie-ai/CLAUDE.md` (GrovaKid)
- `axiom/fairconnect/CLAUDE.md` (FairConnect)
- `axiom/keeptrack/CLAUDE.md` (KeepTrack)
- `axiom/iris-studio/CLAUDE.md` (iris-studio)
- `axiom/fatfrogmodels/CLAUDE.md` (fatfrogmodels)
- `axiom/cortex/CLAUDE.md` (CORTEX)
- `axiom/rehearsal/CLAUDE.md` (REHEARSAL)
- `forge/scripts/radar/CLAUDE.md` or wherever RADAR's CLAUDE.md lives

## DONE CRITERIA (addendum)

- [ ] data-manifest.json updated with all product checklist + MRD entries
- [ ] bigclaw-site/data/manifest.json updated (committed copy)
- [ ] Standing rule added to all 8 product CLAUDE.md files
- [ ] sync-data.mjs successfully copies all new files on `npm run build`
