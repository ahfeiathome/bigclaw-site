### 📋 2026-04-11 — GrovaKid Dashboard PRD Section: Exact Layout Spec

**Company:** BigClaw (bigclaw-site)
**What:** Definitive layout for the PRD verification section on product pages. No interpretation needed — follow exactly.
**Why:** Multiple rounds of fixes have introduced regressions and misinterpretations. This spec is the final word.

---

## CRITICAL: DO NOT collapse V-G, V-C, V-M into a single "Verified" column

The three columns MUST remain separate everywhere. They represent three independent verification layers:
- **V-G** = Gemini automated browser test (daily)
- **V-C** = Consultant file/code audit (monthly)
- **V-M** = Michael phone review (production gate)

Collapsing them into one "Verified" column defeats the entire verification system.

---

## Section Layout (top to bottom, in this exact order)

### 1. PDLC Stage Progression (KEEP as-is)
```
S1 ── S2 ── S3 ── [S4] ── S5 ── S6 ── S7 ── S8
```

### 2. Testing Pipeline Flow (KEEP as-is)
```
PRD Checklist → Test Matrix → CI (per PR) → Gemini (daily) → Michael Review
61 items        61 mapped     ✅ Passing      Not yet run      Pending
37 Done         0 verified                                     0% of Done
```

### 3. PRD Verification Summary (ONE section — not two)

**Category table with V-G, V-C, V-M columns:**

```
Category        | Done | V-G | V-C | V-M
----------------|------|-----|-----|----
Infrastructure  |  4/4 |   0 |   4 |   0
AI/ML           |  7/7 |   0 |   3 |   0
Functional      |  7/7 |   0 |   1 |   0
...etc
```

**Bar chart directly underneath (no gap, same section):**
- Each bar shows the LOWEST verified layer that has data (V-M → V-C → V-G → falls back to 0)
- Red solid bar = verified % (the truth)
- Gray ghost bar behind = Done % (the claim)
- Color: RED if < 50%, BLUE if 50-70%, GREEN if > 70%
- Label: "4/4 V-C (100%) · Done: 4/4"
- The label must say WHICH layer (V-G, V-C, or V-M) — don't just say "Verified"

**Summary line at bottom:**
```
11/61 V-C Verified (18%) · 37 Done · G:0 C:11 M:0 · 8 in progress · 11 not started · 5 deferred
```

### 4. PRD Item Checklist (detailed table with filters — KEEP as-is)

Must have these columns: ID, Item, Category, Priority, Status, Owner, PR, **V-G, V-C, V-M**

Three separate columns. Not one "Verified" column.

### 5. Release Pipeline (KEEP as-is)

v0.9.0 → v0.9.1 → v0.10.0 → v0.11.0 → v1.0.0 with PR tables

---

## What NOT to do

- ❌ Do NOT merge V-G + V-C + V-M into a single "Verified" column
- ❌ Do NOT show two separate verification sections (table AND bar chart as independent sections)
- ❌ Do NOT label V-C results as V-G (they're different layers)
- ❌ Do NOT remove the ghost bar showing Done % behind verified %
- ❌ Do NOT deploy multiple changes at once — one fix at a time, verify each deploy
