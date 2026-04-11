### 🚨 URGENT — GrovaKid Dashboard Page Broken (Rollback + Fix Forward)

**Priority:** NOW — Michael sees empty page
**Root cause:** Too many changes at once. New sections reference data sources
that don't exist yet, possibly crashing the page render.

---

## Option A: Rollback (fastest)

`git revert` the last lc-bigclaw commit(s) that changed product-page.tsx.
Get the page back to showing what it had before (PRD checklist, issues,
market positioning, finance). Then re-apply changes incrementally.

## Option B: Fix Forward (keep new code, fix data issues)

If the page renders but shows empty sections, the code is fine — just
needs data. Check each new data source:

### 1. PRD Checklist — likely the main break
The parser now expects V-G/V-C/V-M columns OR legacy Verified column.
Check: does `fetchPrdChecklist('learnie-ai')` return content?
Check: does the parser handle the CURRENT file format without crashing?

Test locally: read PRD_CHECKLIST.md, run parsePrdItems() on it, verify
it returns items (not empty array, not error).

### 2. Release Plan — new section
`fetchReleasePlan('learnie-ai')` reads `docs/product/RELEASE_PLAN.md`
File exists (lc-forge confirmed pushed). Should work. If empty, check
if the section parser matches the actual markdown format.

### 3. Verification Report — new section  
`fetchVerificationReport('learnie-ai')` reads `ops/gemini/VERIFICATION_REPORT.md`
This file does NOT exist yet. Code should show "Awaiting first run" fallback.
If it throws instead of returning null, that's the crash.

### 4. CI Run — new section
`fetchLatestCiRun('learnie-ai')` calls GitHub Actions API.
Needs GITHUB_TOKEN with `actions:read` permission. If token lacks this
scope, it returns 404 → should return null, not throw.

### 5. Test Matrix — new section
`fetchPrdTestMatrixForRepo('learnie-ai')` — check what path it reads.
If the file doesn't exist, should return null gracefully.

## Debugging Steps

1. Check Vercel build logs — did the deploy succeed or fail?
2. Check Vercel function logs — any runtime errors on the product page?
3. Open browser dev tools on the dashboard → check console errors
4. If server-side error: one of the new fetch functions is throwing
5. If client-side: the PRD parser or component is crashing on unexpected data

## Fix Priority

If Option B:
- [ ] Wrap ALL new fetch calls in try-catch (fetchReleasePlan, fetchVerificationReport, fetchLatestCiRun, fetchPrdTestMatrixForRepo)
- [ ] Verify each returns null on failure, never throws
- [ ] Verify the PRD parser handles the current file format (no V-G/V-C/V-M yet)
- [ ] Deploy and confirm page renders with existing data restored
- [ ] New sections can show "No data yet" — that's fine

If Option A:
- [ ] `git revert HEAD~N` (however many commits lc-bigclaw made)
- [ ] Deploy reverted version
- [ ] Confirm page works again
- [ ] Re-apply changes one at a time, deploying and verifying after each
