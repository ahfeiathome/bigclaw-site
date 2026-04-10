# EXECUTION BRIEF — Fix Dashboard Red Flags (Data Layer)

**Date:** 2026-04-09 | **To:** Code CLI (lc-bigclaw) | **Priority:** P0
**Context:** Consultant audited every red flag on the live dashboard. Some are display bugs, some are real product issues routed to lc-forge/lc-axiom. This spec covers DISPLAY/DATA bugs only.

---

## RED FLAG 1: Market Intelligence — 8 products show "🔴 Missing — needs S1 research"

**Reality:** All 10 products HAVE S1_COMPETITIVE_RESEARCH.md files. Dashboard cannot find them.

**Root cause:** Product docs live inside the `bigclaw-ai` monorepo at non-standard paths:
- Axiom products: `bigclaw-ai/axiom/<product>/docs/product/S1_COMPETITIVE_RESEARCH.md`
- RADAR: `bigclaw-ai/forge/scripts/radar/docs/product/S1_COMPETITIVE_RESEARCH.md`
- GrovaKid: in `ahfeiathome/learnie-ai` GitHub repo (not local monorepo clone)

The dashboard likely looks at GitHub API for `ahfeiathome/<repo>/docs/product/S1_*.md`. If the files are in the monorepo but not in the standalone GitHub repos, the lookup fails.

**Fix:** For each product, determine where the file actually lives on GitHub (which repo, which path). Map product slug → GitHub owner/repo/path in product-intel.ts. Test each mapping returns 200 from GitHub API.

**Verification:** Zero products show "Missing — needs S1 research."

---

## RED FLAG 2: GrovaKid shows "🔴 Outdated — flag to Sage" (Last Refresh: 2026-03-17)

**Reality:** Sage produced 6 new KH entries on Apr 8. COMPETITIVE_LOG.md exists. The dashboard is reading the S1_COMPETITIVE_RESEARCH.md file date (March 17) instead of the COMPETITIVE_LOG.md date (much more recent).

**Fix:** "Last Refresh" should read the most recent of:
- S1_COMPETITIVE_RESEARCH.md last commit date
- COMPETITIVE_LOG.md last commit date
- KNOWLEDGE_HUB.md entries tagged with this product

If any of these are <7 days old → ✅ Current. If 7-30 days → ⚠️ Stale. If >30 days → 🔴 Outdated.

---

## RED FLAG 3: Mission Control — "▼ Critical /100" Company Health score

**What it shows:** 0/100 with "Critical" flag.
**Problem:** Unclear metric. What's being scored? How is it calculated?

**Fix:** Either:
- A) Define the score: Company Health = weighted average of (products with blockers, P0 count, agent health, CI pass rate, doc freshness). Show tooltip explaining formula.
- B) Remove the score and replace with concrete metrics: "3 products blocked, 5 P0 issues, 1/6 agents active"

Option B is better — concrete numbers are more actionable than an abstract score.

---

## RED FLAG 4: Mission Control — "5 blocking" Open P0s

**Verify:** Are there actually 5 P0 issues? Check issues-snapshot.md files. If the number is wrong, fix the data source. If correct, this is a real product issue (routed to lc-forge/lc-axiom below).

---

## RED FLAG 5: Mission Control — RADAR company shows "BigClaw AI"

REGISTRY.md execution sessions table assigns RADAR to Forge (lc-forge). Dashboard shows "BigClaw AI."

**Fix:** Map product → company from REGISTRY.md `## Execution Sessions` table.

---

## RED FLAG 6: Mission Control — FairConnect shows "S3 DESIGN"

REGISTRY.md says FairConnect is S4 BUILD (PR #1 has 7 commits, all P0 features). Dashboard shows S3 DESIGN — stale.

**Fix:** Read stage from REGISTRY.md dynamically. If the dashboard caches stages, add a cache-bust or TTL.

---

## RED FLAG 7: Per-product pages — Self-contradiction (✅ Complete + 🔴 Missing)

KeepTrack shows S1 ✅ "Complete" in the checklist then "🔴 Missing — needs S1 research" in the status line. Two code paths checking the same thing.

**Fix:** Single function `getProductDocStatus(product, docType)` used everywhere.

---

## RED FLAG 8: GrovaKid — PRD shows wrong data

Shows "33% (26/80)" — actual is 54% (33/61).

**Fix:** PRD parser needs to read the summary table at top of PRD_CHECKLIST.md, not count individual lines.

---

## EXECUTION ORDER

1. Fix 1 (path mapping) — root cause of all "Missing" red flags
2. Fix 2 (competitive refresh date)
3. Fix 5 + 6 (company/stage from REGISTRY.md)
4. Fix 7 (self-contradiction)
5. Fix 8 (PRD parser)
6. Fix 3 (Company Health metric)
7. Fix 4 (verify P0 count)
