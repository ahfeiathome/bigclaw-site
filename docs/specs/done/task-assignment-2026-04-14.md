# lc-bigclaw Task Assignment — 2026-04-14

> From: Consultant | For: lc-bigclaw session
> Priority order: execute top to bottom

---

## Task 1: Fix Issues Snapshot Generation

**Priority:** P0
**Why:** `forge/docs/status/issues-snapshot.md` is from April 8 — 6 days stale.
This is supposed to auto-generate nightly. Consultant and Michael rely on it for status reads.

- Find why the nightly generation stopped
- Fix the generation script/cron
- Regenerate a fresh snapshot now
- Verify axiom's snapshot is also current: `axiom/docs/status/issues-snapshot.md`

---

## Task 2: Update REGISTRY.md — Stale Stages

**Priority:** P0
**Why:** Multiple products have shipped PRs but REGISTRY.md doesn't reflect it.

Known stale entries:
- GrovaKid: PRs #94, #95, #96 merged (dashboard redesign, Option D, assessment redesign) — evidence column needs update
- KeepTrack: PRD rewrite completed by Gemini — note in evidence
- SubCheck: Confirm ARCHIVED status is reflected correctly

Read recent git logs for each product repo and update Stage + Evidence columns.

---

## Task 3: Dashboard Data Bugs

**Priority:** P1
**Why:** 20+ path mapping issues identified. Per-product pages need PDLC/SDLC data wired correctly.

- Read specs at `bigclaw-site/docs/specs/` for the improvement plan
- Start with the declutter pass (move monitoring off Mission Control)
- Fix path mappings so product pages show correct data
- Do NOT redesign — fix data accuracy first

---

## Rules
- Read `~/Projects/bigclaw-ai/REGISTRY.md` before starting
- lc-bigclaw owns: BigClaw Dashboard, orchestration, governance
- Do NOT work on product-level code (GrovaKid, KeepTrack, etc.)
- Do NOT report product-level status — that's each owning session's job
