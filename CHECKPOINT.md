---
title: BigClaw Site — Checkpoint
type: checkpoint
updated: 2026-03-26
---

# CHECKPOINT.md — bigclaw-site

HIL_DEV: OFF

---

## 🔴 OPEN TODO INDEX — Read This First Every Session

| CP | Priority | Summary |
|----|----------|---------|
| CP-121 | P0 | Restore dashboard to pre-incident clean state | ✅ DONE — verified 2026-03-27 |
| CP-118 | P1 | Nav fix + content refresh — route groups, about page, projects page, home page |
| CP-117 | P1 | Dashboard full redesign — operator terminal aesthetic (do after CP-118) |

---

## CP-121 — Restore Dashboard to Clean State

**Status:** ✅ DONE (2026-03-27)
**Owner:** Code CLI
**Priority:** P0
**What:** Verify bigclaw-site is showing the correct pre-incident state. Target commit: `63d2b0c`.
**Evidence:**
- Main branch HEAD = `63d2b0c` (target commit) — confirmed
- Homepage returns 200, shows "Big Claw" branding, all 5 products listed correctly
- Dashboard redirects to `/dashboard/login` (expected auth), returns 200
- Zero instances of "UNKNOWN" in HTML output
- No remediation needed — site was already clean

---

## CP-118 — Nav Fix + Content Refresh

**Status:** TODO
**Owner:** Code CLI
**Priority:** P1 — after CP-121
**Spec:** `/Users/michaelliu/Projects/bigclaw-site/CP-118-SITE-CONTENT-NAV-FIX.md`
**What:** Fix double navigation bug and refresh all stale content.
**Session A:** Route group restructure + About page (correct M2 agent roster)
**Session B:** Home page + Projects page (add VERDE, VAULT, CORTEX) + Sidebar labels

---

## CP-117 — Dashboard Full Redesign

**Status:** TODO
**Owner:** Code CLI
**Priority:** P1 — after CP-118
**Spec:** `/Users/michaelliu/Projects/bigclaw-site/CP-117-DASHBOARD-REDESIGN.md`
**What:** Operator terminal aesthetic — dark tokens, compact PDLC rows, Zone 1/2/3 layout.
**Note:** Do NOT start until CP-118 Session A is confirmed done — touches same layout files.
