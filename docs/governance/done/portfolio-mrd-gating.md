# EXECUTION BRIEF — Portfolio Overview: MRD Summaries + PDLC Gating Table

**Date:** 2026-04-07 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1
**Status:** Michael wants product summaries and gate status on the Portfolio Overview page.

## SITUATION

The Portfolio Overview page (`/dashboard/products/page.tsx`) shows a product table, market intelligence, and P0/P1 issues. Missing: (1) static MRD summaries per product, and (2) a PDLC gating table showing which stages each product has passed.

Data source: `knowledge/PORTFOLIO_SUMMARY.md` — contains both tables. This file is mostly static (MRDs freeze after S2 gate). Updates only when a product advances to a new stage.

## ADD TO PORTFOLIO OVERVIEW

### Section A: Product Summaries (above the current Active Products table)

Fetch `knowledge/PORTFOLIO_SUMMARY.md` via GitHub API. Parse the "Product Summaries" table. Render as expandable cards or a compact table:

| Product | Problem | Positioning |
|---------|---------|-------------|
| GrovaKid | Parents lack personalized K-5 practice... | Print-scan-grade loop, zero screen time |
| FairConnect | Solo vendors manage contacts via notes... | Mobile-first CRM built BY a vendor |

Keep it compact — one line per product. The "Problem" and "Positioning" columns are the most important for Michael's co-founder reviews. "Target User" and "Revenue Model" can be shown on hover or in an expanded row.

### Section B: PDLC Gate Status (below the Active Products table)

Parse the "PDLC Gate Status" table. Render as a visual matrix:

```
Product        S1  S2  S3  S4  S5  S6  S7  S8
GrovaKid       ✅  ✅  ✅  🔄  —   —   —   —
FairConnect    ✅  ✅  ✅  🔄  —   —   —   —
KeepTrack      ✅  ✅  ✅  ✅  🔄  —   —   —
fatfrogmodels  ✅  ✅  ✅  ✅  ✅  ✅  ✅  —
iris-studio    ✅  ✅  ✅  ✅  —   —   —   —
```

Use colored dots or icons: green (✅ passed), amber (🔄 current), gray (— not started).

Product names should link to their individual product pages.

## DATA SOURCE

```typescript
// In github.ts — add:
export async function fetchPortfolioSummary(): Promise<string | null> {
  return fetchRepoFile('bigclaw-ai', 'knowledge/PORTFOLIO_SUMMARY.md');
}
```

Parse both tables from the markdown. The parser pattern already exists in `page.tsx` (`parseMarkdownTable` + `extractSection`).

## DONE CRITERIA

- [ ] MRD summaries visible on Portfolio Overview (Problem + Positioning per product)
- [ ] PDLC gating table visible with color-coded dots (green/amber/gray)
- [ ] Product names link to individual product pages
- [ ] Data reads from `knowledge/PORTFOLIO_SUMMARY.md` via GitHub API
- [ ] Renders correctly on mobile (responsive table or card layout)
