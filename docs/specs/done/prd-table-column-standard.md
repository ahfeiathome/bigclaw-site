### 📋 2026-04-11 — Dashboard PRD Table: Column Standard (ALL products)

**Company:** BigClaw (bigclaw-site)
**What:** Standardize PRD verification columns across all product pages using standard SDLC terminology.
**Why:** Previous iterations used role names ("Consultant", "Michael") or internal jargon ("V-G/V-C/V-M"). Columns should describe the ACTIVITY, not the person.
**Applies to:** All product pages. Supersedes all previous layout specs.

---

## Five lifecycle columns: Develop → CI Test → Flow Test → Code Review → User Test

### Column definitions

| Column | What it means | Who does it | Maps to (internal) |
|--------|--------------|-------------|-------------------|
| **Develop** | Code written and merged to main | Code CLI | Status = Done |
| **CI Test** | CI pipeline passed — lint, types, unit, build, E2E | Automatic (GitHub Actions) | PR merge gate |
| **Flow Test** | Browser flow test on live site — pages load, flows complete, forms work | Gemini CLI (6am daily) | V-G |
| **Code Review** | Code/file audit — feature exists as claimed, configs correct | Consultant (monthly) | V-C |
| **User Test** | Acceptance test on real device — UX, print quality, content accuracy | Michael (production gate) | V-M |

---

## Category Summary Table

```
Category       | Develop | CI Test | Flow Test | Code Review | User Test
---------------|---------|---------|-----------|-------------|----------
Infrastructure |   4/4   |   4/4   |     0     |      4      |     0
AI/ML          |   7/7   |   7/7   |     0     |      3      |     0
Functional     |   7/7   |   7/7   |     0     |      1      |     0
Auth/Security  |   6/7   |   6/7   |     0     |      1      |     0
UI/UX          |   6/7   |   6/7   |     0     |      0      |     0
QA/Testing     |   1/9   |   1/9   |     0     |      0      |     0
Marketing      |   2/6   |   2/6   |     0     |      0      |     0
Revenue        |   2/7   |   2/7   |     0     |      1      |     0
Strategy       |   2/7   |   2/7   |     0     |      1      |     0
```

---

## Item Checklist Table

```
ID | Item | Category | Priority | Status | Owner | PR | CI Test | Flow Test | Code Review | User Test
```

- **Status** = Develop (done) / In Progress / Not Started / Deferred
- **CI Test** = ✅ or ❌
- **Flow Test** = ✅ or ❌ or N/A
- **Code Review** = ✅ or ❌ or N/A
- **User Test** = ✅ or ❌ or N/A

---

## Bar Chart

- Bar value = lowest testing layer with data: User Test → Code Review → Flow Test → CI Test → 0
- Color: RED < 50%, BLUE 50-70%, GREEN > 70%
- Ghost bar (gray outline) = Develop % (the claim)
- Label: "4/4 Code Review (100%) · Develop: 4/4"

---

## Summary Line

```
11/61 Code Review (18%) · 37 Develop · Flow: 0 | Review: 11 | User: 0 · 8 in progress · 11 not started · 5 deferred
```

---

## PRD_CHECKLIST.md Mapping

The checklist files still use V-G/V-C/V-M internally. The dashboard translates:
- V-G → "Flow Test"
- V-C → "Code Review"
- V-M → "User Test"
- Status = Done → "Develop" column shows count
- PR merged + CI passing → "CI Test" column shows count

---

## DO NOT

- ❌ Do NOT use a single "Verified" column
- ❌ Do NOT use "V-G", "V-C", "V-M" labels on the dashboard
- ❌ Do NOT use role names as column headers ("Consultant", "Michael", "Gemini")
- ❌ Do NOT remove any of the five columns
- ❌ Do NOT deploy to all products at once — fix GrovaKid first, verify, then roll out


---

## Process Page Alignment

The Process page (`/dashboard/process`) must use the same 5-column terminology everywhere.

### SDLC Table — Map stages to columns

The current 8-stage SDLC (Plan → Code → Test → Review → Merge → Deploy → Verify → Close) stays as the detailed pipeline. But add a summary row or section that maps to the 5 verification columns:

```
SDLC Stage          →  PRD Column
──────────────────────────────────
1-2. Plan + Code    →  Develop
3-5. Test + Review + Merge  →  CI Test
6-7. Deploy + Verify (Gemini)  →  Flow Test
7. Verify (Consultant audit)   →  Code Review
7. Verify (Acceptance test)    →  User Test
8. Close            →  (item marked ✅ in all applicable columns)
```

### Development Flow Diagram — Use column names

The flow diagram currently shows:
```
TDD Cycle → CI Regression → Gemini Validation → Michael Review → ✅ Verified
```

Change labels to:
```
Develop → CI Test → Flow Test → Code Review → User Test → ✅ Complete
```

### Verification Phase Description

Current text: "CI on every PR. Gemini browser-tests the live site at 6am daily. Michael reviews on phone."

Replace with:
"**CI Test** runs on every PR (lint, types, unit, build, E2E). **Flow Test** runs daily at 6am — Gemini navigates the live site and tests user flows. **Code Review** is a monthly audit confirming features exist as claimed. **User Test** is the final acceptance test on a real device before production approval."

### Test Flow Table — Add column mapping

The existing Test Flow table (TypeScript → Lint → Unit → Build → E2E → Gemini Review) maps to two columns:

```
Steps 1-5 (TypeScript through E2E) → CI Test column
Step 6 (Gemini Review) → Flow Test column
```

Add a note or header making this mapping explicit.

### Cron Flow Table — Add column mapping

The 6am Gemini E2E Validation cron → maps to **Flow Test** column.
Note this in the table so it's clear that cron outputs feed the PRD checklist columns.
