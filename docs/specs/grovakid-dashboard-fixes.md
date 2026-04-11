### 🚨 URGENT — GrovaKid Dashboard Page Fixes

**Priority:** Do NOW — lc-forge has pushed, path is clear
**Source of truth:** `learnie-ai/docs/product/PRD_CHECKLIST.md` (single file, confirmed)

---

## Data Fixes

### 1. PRD parser ignores verification columns
`src/lib/prd-parser.ts` reads 7 columns. The checklist needs 10.

Update `PrdItem` interface in `src/components/prd-checklist.tsx`:
```typescript
export interface PrdItem {
  id: string;
  item: string;
  category: string;
  priority: string;
  status: 'Done' | 'In Progress' | 'Not Started' | 'Deferred';
  owner: string;
  github?: string;
  verifyG: '✅' | '❌' | 'N/A';  // Gemini (automated browser test, 6am)
  verifyC: '✅' | '❌' | 'N/A';  // Consultant (monthly audit)
  verifyM: '✅' | '❌' | 'N/A';  // Michael (phone review)
}
```

Update parser to read columns 7, 8, 9 (V-G, V-C, V-M).

### 2. PRD table needs three verification columns
Add V-G, V-C, V-M columns to the PRD table:
- ✅ = green, ❌ = red, N/A = gray
- Overall counter: "41 Done | G:0 C:0 M:0 Verified"
- "Fully verified" = all applicable columns are ✅

### 3. Category summary bars need verification breakdown
Current: `AI/ML 7/7 (100%)`
New: `AI/ML 7/7 Done | G:0 C:0 M:0`

### 4. Remove GitHub links from PRD table
Show PR numbers as plain text. Remove all `<a href>` to GitHub.

### 5. Fix old the-firm repo references
Search `src/lib/github.ts` for `the-firm`. Update or remove:
- fetchFinanceData, fetchHealth, fetchBandwidth, fetchMarketing


---

## New Sections to Add

### Release Pipeline section
Read `docs/product/RELEASE_PLAN.md` from learnie-ai repo via fetchRepoFile.
Add between PDLC Progress and Issues sections.

Table format:
| Release | PRDs | Status |
|---------|------|--------|
| v0.9.0 | 016,017,018,020,023,026 | ✅ On main |
| v0.10.0 | 008,009,022,034 | 🔲 Next |

### Verification Report section
Read `ops/gemini/VERIFICATION_REPORT.md` via fetchRepoFile.
Show latest Gemini results per PRD item.
If file doesn't exist yet: show "Awaiting first verification run."

---

## PRD Checklist Table Format (lc-forge must update too)

The checklist file needs matching columns. Tell lc-forge to update
`PRD_CHECKLIST.md` table headers to:

```
| ID | Item | Category | Status | Owner | Target | GitHub | V-G | V-C | V-M |
```

Where:
- V-G = Gemini verification (✅/❌/N/A) — updated by Gemini 6am
- V-C = Consultant verification (✅/❌/N/A) — updated monthly
- V-M = Michael verification (✅/❌/N/A) — updated at production gate

All start as ❌. Only the designated verifier can change their column.

---

## Checklist

- [ ] Update PrdItem interface with verifyG, verifyC, verifyM
- [ ] Update prd-parser.ts to read columns 7-9
- [ ] Add V-G, V-C, V-M columns to PRD table component
- [ ] Update category summary to show verification counts
- [ ] Remove GitHub href links from PRD table
- [ ] Fix the-firm repo references in github.ts
- [ ] Add Release Pipeline section to product-page.tsx
- [ ] Add Verification Report section to product-page.tsx
- [ ] Deploy and verify on preview URL


---

## Remove References to Retired Product Files

lc-forge is deleting these 5 files from learnie-ai. Dashboard must stop
referencing them or it will show null/empty data.

### In `src/lib/github.ts`, remove or update:

```
fetchTestMatrix()        → reads 'docs/product/TEST_MATRIX.md'        → DELETE function
fetchGrovakidTracker()   → reads 'docs/product/GROVAKID_TRACKER.md'   → DELETE function
```

Search for any other references to:
- PRD_REVIEW_CHECKLIST.md
- PRD_GAP_ANALYSIS.md
- PRD_TEST_MATRIX.md

Remove all fetch functions and component references to these files.
The dashboard should only read:
- `docs/product/PRD_CHECKLIST.md` (master checklist with V-G/V-C/V-M)
- `docs/product/RELEASE_PLAN.md` (release pipeline)
- `docs/product/S2_MRD.md` (market positioning — already working)
- `docs/product/COMPETITIVE_LOG.md` (competitor intel)
- `docs/product/COST_MODEL.md` (finance section)

### Updated checklist:

- [ ] Remove fetchTestMatrix() from github.ts
- [ ] Remove fetchGrovakidTracker() from github.ts
- [ ] Search entire src/ for any imports of deleted functions — remove
- [ ] Remove any dashboard components that render data from retired files
- [ ] Verify build passes after removals
