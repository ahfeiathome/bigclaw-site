# EXECUTION BRIEF — Dashboard Product Intelligence Section

**Date:** 2026-04-07 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1
**Status:** MANDATORY — Add to dashboard after standardize-mrd-prd-locations spec is done.

## SITUATION

Dashboard PDLC page shows product stages but zero market intelligence. Michael can't see:
- Whether competitive research exists for a product
- When the last competitive refresh was done
- What the PRD completion status is
- Whether the market has changed since the PRD was written

This means GTM decisions are made blind — looking at build progress without market context.

## WHAT TO BUILD

### Option A: Add "Product Intelligence" panel to each product page

On each product detail page (`/dashboard/products/[product]/`), add a section below the PDLC stage info:

```
┌─────────────────────────────────────────────────────┐
│  📊 Product Intelligence                             │
├─────────────────────────────────────────────────────┤
│  S1 Research:    ✅ Complete (2026-04-01)            │
│  S2 MRD:         ✅ Complete (2026-04-05)            │
│  S3 PRD:         ✅ 15% complete (9/61 items done)   │
│  Last competitive refresh: 2026-04-07 (2 days ago)  │
│                                                      │
│  Recent competitive changes:                         │
│  • Khan Academy Khamingo launched subscription tier  │
│  • IXL pricing unchanged ($9.95-$19.95/mo)          │
│  • K-5 AI adoption gap: 42% vs 69% high school      │
│                                                      │
│  [View full research →]  [View PRD →]                │
└─────────────────────────────────────────────────────┘
```

### Option B: Add "Market Intelligence" summary to the PDLC overview page

On `/dashboard/pdlc/`, add a column or expandable section per product showing:

| Product | Stage | S1 | S2 | S3 | Last Refresh | Status |
|---------|-------|----|----|----|-------------|--------|
| GrovaKid | S4 BUILD | ✅ | ✅ | 15% | Apr 1 | ⚠️ 6 days stale |
| FairConnect | S4 BUILD | ✅ | ✅ | ✅ | — | ❌ No refresh cycle |
| KeepTrack | S5 HARDEN | ❌ | ❓ | ✅ | — | 🔴 Missing S1 |
| SubCheck | S1 DONE | ❌ | ❌ | ❌ | — | 🔴 Empty |

### Data sources

Read from each product's standardized `docs/product/` directory:
- `S1_COMPETITIVE_RESEARCH.md` exists? → ✅ / ❌
- `S2_MRD.md` exists? → ✅ / ❌
- `S3_PRD.md` exists? → ✅ / ❌
- `COMPETITIVE_LOG.md` → parse last entry date → calculate staleness
- Parse frontmatter `updated:` field from each file for dates

For GrovaKid specifically, also read:
- `S3_PRD_CHECKLIST.md` → count Done/Total for completion %

### Staleness rules

| Last refresh | Status |
|-------------|--------|
| <7 days | ✅ Current |
| 7-14 days | ⚠️ Stale — needs refresh |
| >14 days | 🔴 Outdated — flag to Sage |
| Never | 🔴 Missing — needs S1 research |

## EXECUTION STEPS

### STEP 1: Build data reader

Create a utility that scans each product's `docs/product/` directory:
```typescript
interface ProductIntel {
  product: string;
  s1Exists: boolean;
  s1Date: string | null;
  s2Exists: boolean;
  s2Date: string | null;
  s3Exists: boolean;
  s3Date: string | null;
  s3Completion: { done: number; total: number } | null;
  lastCompetitiveRefresh: string | null;
  recentChanges: string[];
  staleness: 'current' | 'stale' | 'outdated' | 'missing';
}
```

Read from the standardized locations per REGISTRY.md repo mapping.

### STEP 2: Add Product Intelligence panel to product pages

If product pages already exist, add the panel. If not, build product pages first (per product-landing-pages spec) and include the panel.

### STEP 3: Add Market Intelligence summary to PDLC overview

Add the summary table (Option B) to `/dashboard/pdlc/`. This gives Michael the at-a-glance view of which products have market research gaps.

### STEP 4: Add auto-refresh indicator

Show a banner on the PDLC page if ANY product has:
- Missing S1 research (🔴)
- Competitive refresh >14 days stale (🔴)
- No COMPETITIVE_LOG.md entries (⚠️)

## DEPENDENCY

This spec depends on `standardize-mrd-prd-locations.md` being completed first.
Without standard file locations, the data reader won't know where to look.

Execute order: standardize-mrd-prd-locations → this spec.

## DO NOT

- Do NOT hardcode product intelligence data — read from `docs/product/` files
- Do NOT skip the staleness calculation — that's the whole point
- Do NOT build this before MRD/PRD locations are standardized

## VERIFICATION

- [ ] Each product page has Product Intelligence panel
- [ ] PDLC overview has Market Intelligence summary table
- [ ] Staleness indicators work (✅ / ⚠️ / 🔴)
- [ ] Data reads from `docs/product/` directories
- [ ] Missing S1 research products are flagged visually
