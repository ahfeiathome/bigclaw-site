### 📋 2026-04-11 Consultant Recommendation — GrovaKid Product Page Remaining Fixes

**Company:** BigClaw (bigclaw-site)
**What:** Two remaining issues on the GrovaKid product page (`/dashboard/products/grovakid`) after lc-forge's deployment fixed 3 of 5 original bugs.
**Why:** Issue #15 displays without a priority badge despite having a P1 label on GitHub. Gemini verification shows "Not yet run" — operational gap blocking the verification pipeline.
**Risk if skipped:** Inconsistent issue display undermines dashboard credibility. Verification pipeline stays dark — 0% verified is accurate but the system to fix it isn't wired.
**Constraints:** None — these are independent fixes.

---

## RESOLVED (verified live 2026-04-11)

- ✅ S3 PRD: Now shows "100% complete (41/41 items)" — was "Missing"
- ✅ Test matrix: Now shows "61 mapped / 0 verified" — was "No matrix"
- ✅ Competitive refresh: Now shows "2026-04-08 ✅ Current" with competitor intel bullets — was "2026-03-17 🔴 Outdated"

---

## Bug 1: Issue #15 missing priority badge

- **Field:** Open issues list → Issue #15
- **Shows:** "#15 Migrate auth from Auth0 to Better Auth" — no P-level badge
- **Contrast:** #52 shows "P0: GrovaKid execution plan..." and #64 shows "P1: LLM consistency framework..." — both display priority correctly
- **Root cause:** lc-forge confirmed #15 has a P1 label on GitHub. The dashboard likely parses priority from the issue **title prefix** (e.g., "P0: ..." or "P1: ...") rather than from GitHub labels. Issue #15's title doesn't follow this convention.
- **Fix options:** (a) Update dashboard to read GitHub labels for priority, not just title prefix, OR (b) have lc-forge rename issue #15 to "P1: Migrate auth from Auth0 to Better Auth". Option (a) is the correct fix — title-based parsing is fragile.

## Bug 2: Gemini daily shows "Not yet run"

- **Field:** Testing Pipeline → Gemini (daily)
- **Shows:** "Not yet run"
- **Root cause:** lc-forge confirmed the Gemini report file exists but has zero data rows. The 6am cron either isn't executing Gemini tests, or Gemini isn't writing results. This is an operational gap, not a dashboard rendering bug.
- **Action:** No dashboard code change needed. lc-forge to investigate Gemini cron execution and ensure `ops/gemini/VALIDATION_REPORT.md` gets populated with test results. Once data exists, the dashboard will display it.
- **Related:** Verification Report section also shows "Awaiting first verification run" — will auto-resolve when Gemini data flows.

---

## Companion spec

Source-data fixes for lc-forge: `forge/docs/specs/dashboard-grovakid-data-bugs.md`
