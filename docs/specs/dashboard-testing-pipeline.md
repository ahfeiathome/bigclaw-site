# EXECUTION BRIEF — Dashboard: PRD Verification & Testing Pipeline Display

**Date:** 2026-04-09 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1
**Context:** New testing pipeline: PRD Checklist → PRD Test Matrix → CI + Gemini regression → Verified. Dashboard must reflect this flow on two pages.

---

## PAGE 1: Per-Product Page — Add "PRD Verification" section

Currently each product page has: Header → Market → PDLC → SDLC Gates → Issues → Finance.

**Add/enhance** the PDLC + SDLC section with PRD verification data:

### PRD Verification Status (new subsection, after PDLC stage progression)

```
PRD Verification                                    12/33 Verified (36%)
██████████░░░░░░░░░░░░░░░░░░ 36%

| Category   | Done | Verified | Gap |
|------------|------|----------|-----|
| AI/ML      | 6    | 2        | 4   |
| Functional | 7    | 5        | 2   |
| UI/UX      | 5    | 1        | 4   |
| QA/Testing | 3    | 3        | 0   |
| Auth       | 5    | 1        | 4   |
| Infra      | 4    | 4        | 0   |
| ...        |      |          |     |

Last CI run:     ✅ 437 tests passed (2 hours ago)
Last Gemini run: ✅ 8/10 browser tests passed (6:12am today)
Manual review:   ⚠️ Not yet reviewed by Michael
```

**Data sources:**
- PRD Checklist: `<repo>/docs/product/PRD_CHECKLIST.md` → count Done items per category
- PRD Test Matrix: `<repo>/docs/product/PRD_TEST_MATRIX.md` → count ✅ in Verified column
- CI results: GitHub Actions API → last run status + test count
- Gemini results: `ops/gemini/VALIDATION_REPORT.md` → parse summary line
- Manual review: `<repo>/docs/product/PRD_REVIEW_CHECKLIST.md` → count checked items (if exists)

### Testing Pipeline Visual (new subsection)

Show the pipeline as a visual flow:

```
PRD Checklist ──→ Test Matrix ──→ CI (every PR) ──→ Gemini (6am daily) ──→ Michael Review
   61 items         24 mapped      437 unit tests    10 browser tests       0 reviewed
   33 Done          12 Verified    ✅ All passing     ✅ 8/10 passing        ⚠️ Pending
```

Color-coded: green (all passing), yellow (partial), red (failures), gray (not yet run).

---

## PAGE 2: Executive Dashboard — Engineering/SDLC Panel Enhancement

The Engineering panel currently shows: Open Issues, Violations, Trend chart.

**Add** verification metrics:

### Company Verification Summary

```
VERIFICATION RATE                    36% (12/33 Done items verified)
████████░░░░░░░░░░░░░░ 36%

| Product      | Done | Verified | Rate | CI     | Gemini  |
|-------------|------|----------|------|--------|---------|
| GrovaKid    | 33   | 12       | 36%  | ✅ 437 | ✅ 8/10 |
| iris-studio | 8    | 0        | 0%   | ✅ 34  | —       |
| FairConnect | 5    | 0        | 0%   | ✅ 18  | —       |
| KeepTrack   | 12   | 0        | 0%   | ✅ 3   | —       |
| RADAR       | 10   | 0        | 0%   | ✅ 314 | —       |
| others...   |      |          |      |        |         |

Untested Done items: 21 (items claimed Done but not Verified)
Last Gemini validation: 2026-04-09 06:12 (GrovaKid only)
```

**Data sources:**
- Per product: parse each product's `PRD_TEST_MATRIX.md` if exists
- CI: GitHub Actions API per repo
- Gemini: `ops/gemini/VALIDATION_REPORT.md`
- "—" for products without Gemini test coverage yet

### Verification Trend Chart (optional, add later)

Line chart showing Verified count over time (weekly snapshots). Shows the matrix growing as more items get verified. Source: git history of PRD_TEST_MATRIX.md files.

---

## DATA SOURCE MAP

| Dashboard Element | Source File | How to Parse |
|---|---|---|
| Done count per product | `<repo>/docs/product/PRD_CHECKLIST.md` | Count rows with "Done" in Status column |
| Verified count per product | `<repo>/docs/product/PRD_TEST_MATRIX.md` | Count ✅ in Verified column |
| CI test count + status | GitHub Actions API: `GET /repos/{owner}/{repo}/actions/runs?per_page=1` | Latest run conclusion + test count from artifact |
| Gemini pass/fail | `ops/gemini/VALIDATION_REPORT.md` | Parse "X/Y Browser tests passed" summary line |
| Manual review status | `<repo>/docs/product/PRD_REVIEW_CHECKLIST.md` | Count checked `[x]` items |
| Last Gemini run timestamp | `ops/gemini/VALIDATION_REPORT.md` | Parse date header |

**Note:** Not all products have PRD_TEST_MATRIX.md yet. Show "No test matrix" for those products, not an error. Only GrovaKid has one currently.

---

## VERIFICATION

- [ ] GrovaKid product page shows "PRD Verification" section with Done/Verified counts
- [ ] GrovaKid shows last CI run status + last Gemini run status
- [ ] Executive Dashboard Engineering panel shows verification rate table
- [ ] Products without PRD_TEST_MATRIX.md show "No test matrix" gracefully
- [ ] Pipeline visual shows the MRD → PRD → Matrix → CI → Gemini → Review flow
- [ ] ✅ STANDARD — can merge directly
