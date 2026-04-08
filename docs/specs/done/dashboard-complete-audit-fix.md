# EXECUTION BRIEF — Dashboard Complete Audit & Fix Spec

**Date:** 2026-04-09 | **To:** Code CLI (lc-bigclaw) | **Priority:** P0
**Replaces ALL previous dashboard specs** (dashboard-audit-20-issues.md, dashboard-ops-agent-panel.md, next-actions-apr08.md)

---

## AUDIT RESULTS

### What's Working (structure is correct)
- ✅ Sidebar: COMPANY (Mission Control, Executive Dashboard, Agent Team) + PRODUCT LINEUP (9 products) + Settings
- ✅ Product pages have 5 sections: Header → Market & Positioning → PDLC + SDLC → Issues Trend → Finance
- ✅ Agent Team page exists under COMPANY (renamed from Agent Docs)
- ✅ Product list in sidebar is dynamic (9 products shown)
- ✅ Status bar at bottom (Market, Agents, RADAR, Git)

### What's Broken (data is wrong or missing)

**ROOT CAUSE: product-intel.ts cannot find product docs at the correct GitHub paths.**
Every product shows "Missing — needs S1 research" even though ALL 10 have S1 files. Fix the path mapping and most data issues resolve.

---

## FIX 1 (P0) — Product Intelligence File Path Mapping

All products show ❌ "Missing" for S1 research that EXISTS. The dashboard fetches from the wrong GitHub repo/path.

**Correct path mapping (verify each in product-intel.ts):**

| Product | Dashboard slug | GitHub repo | Docs path |
|---|---|---|---|
| GrovaKid | grovakid | `learnie-ai` | `docs/product/S1_COMPETITIVE_RESEARCH.md` |
| iris-studio | iris-studio | `iris-studio` | `docs/product/S1_COMPETITIVE_RESEARCH.md` |
| fatfrogmodels | fatfrogmodels | `fatfrogmodels` | `docs/product/S1_COMPETITIVE_RESEARCH.md` |
| FairConnect | fairconnect | `fairconnect` | `docs/product/S1_COMPETITIVE_RESEARCH.md` |
| KeepTrack | keeptrack | `keeptrack` | `docs/product/S1_COMPETITIVE_RESEARCH.md` |
| SubCheck | subcheck | `subcheck` | `docs/product/S1_COMPETITIVE_RESEARCH.md` |
| CORTEX | cortex | `cortex` | `docs/product/S1_COMPETITIVE_RESEARCH.md` |
| REHEARSAL | rehearsal | In `bigclaw-ai` repo at `rehearsal/docs/product/` — NOT standalone repo | Check if rehearsal has own repo |
| RADAR | radar | In `bigclaw-ai` repo at `radar-site/docs/product/` — NOT `radar/docs/product/` | Check actual path |

Also fix S2_MRD.md and S3_PRD.md / PRD_CHECKLIST.md paths — same mapping issue.

**Also fix:** "Last competitive refresh: Never" → read `COMPETITIVE_LOG.md` last-modified date from the same repo.

**Verification:** Zero products show "Missing — needs S1 research" after fix.

---

## FIX 2 (P0) — Mission Control Data Consistency

| Issue | Current | Should Be | Fix |
|---|---|---|---|
| Pipeline shows 7 products | Missing FairConnect, KeepTrack, SubCheck | All 10 from REGISTRY.md | Read full product list dynamically |
| RADAR shows S2 DEFINE | REGISTRY.md says S4 BUILD | S4 BUILD | Use same data source as product pages |
| RADAR company shows "BigClaw AI" | REGISTRY.md execution sessions: Forge owns RADAR | Forge | Map product→company from REGISTRY.md execution sessions table |
| FairConnect shows S3 DESIGN | REGISTRY.md says S4 BUILD (started) | S4 BUILD | Same fix — read from REGISTRY.md |
| "0 Critical /100" unclear | No explanation | Either add tooltip or remove | Clarify metric or remove |

---

## FIX 3 (P0) — PRD Completion Data

GrovaKid shows "33% (26/80)" but actual is "54% (33/61)." Two bugs:
1. **Item count wrong** — parsing 80 items when PRD has 61. Check regex: may be counting lines that aren't items.
2. **Stale cache** — not re-fetching PRD_CHECKLIST.md on page load. May be using cached API response.

**Fix:** Re-check PRD_CHECKLIST.md parser. The file has a summary table at top:
```
| Status | Count |
| Done | 33 |
| In Progress | 6 |
| Not Started | 24 |
| Deferred | 5 |
```
Parse this summary table, not individual rows. Total = sum of all counts = 61 (not 80).

---

## FIX 4 (P0) — Self-Contradictions on Product Pages

Multiple products show S1 Research ✅ "Complete" in the checklist but then "🔴 Missing — needs S1 research" in the status line. Two different code paths checking the same thing.

**Fix:** Unify into one function: `checkProductDocExists(repo, docPath)`. Use it for both the checklist checkmarks AND the status text. If the file exists → ✅ and no "Missing" warning.

---

## FIX 5 (P1) — Mission Control Summary Dashboards

Michael needs Mission Control to help him make decisions. Currently it has a pipeline table and production gates. Add:

### Company Summary Cards (top of page, above pipeline)
Already partially there (Company Health, RADAR Equity, Open POS, Monthly Burn, Revenue). Enhance:
- **Company Health:** Replace "0 Critical /100" with clear metrics — total open P0 issues across all products
- **Products at Risk:** Count of products with blockers (currently: iris-studio Stripe, GrovaKid co-founder, KeepTrack Apple Dev)
- **PRD Average:** Average PRD completion across active products

### PDLC Distribution Chart
Bar chart or pie showing how many products at each PDLC stage (S1: 1, S3: 2, S4: 4, S5: 1, S7: 2). Answers "where are our products in the pipeline?" at a glance.

### Aggregate Bug Trend (90 days)
Issues trend chart aggregated across ALL repos — same line chart design as individual product pages but combining all repos. Shows total open, total created, total resolved.

### SDLC Compliance Summary
- Gate pass rate: X% of products pass all SDLC gates
- Total violations (30d): N
- Products with failing CI: list

---

## FIX 6 (P1) — Product Pages: SDLC Gates Data

Every product page shows "No test health data in SDLC_GATES_MATRIX.md for this product." The gate matrix file exists but the product name matching is broken.

**Fix:** Check how product names appear in SDLC_GATES_MATRIX.md vs how the dashboard queries them. Likely a case sensitivity or slug mismatch (e.g., "GrovaKid" vs "grovakid", "RADAR" vs "radar").

---

## FIX 7 (P1) — Agent Team Page Enhancements

Current page has Pi5 system health + old agent reports. Missing:

| Missing | Source | What to show |
|---|---|---|
| Agent roster table | PI5_AGENT_SYSTEM.md §Agent Roster | Name, title, model, Telegram bot, mode |
| Cron schedule with health lights | PI5_AGENT_SYSTEM.md §Cron Schedule | Job name, schedule, last run, green/red light |
| OpenRouter balance | ops/DAILY_COSTS.md | Current balance, daily spend, runway |
| Nightly cycle timeline | PI5_AGENT_SYSTEM.md §Nightly Cycle | Visual timeline of 2am→7am pipeline |
| Overnight patrol status | ops/OVERNIGHT_REPORT.md | Last run, goals completed, key findings |
| Cost breakdown | PI5_AGENT_SYSTEM.md §Cost Daily Breakdown | Per-agent cost table |

Agent reports section shows entries from Apr 1-3 — should show LATEST entries, not oldest.

---

## FIX 8 (P1) — Executive Dashboard Panels

Currently has: Company Health + Market Intelligence (broken) + Product Summary (barely visible).

**Market Intelligence panel:** All products show "Missing — needs S1 research" → fixed by Fix 1 (path mapping). After fix, should show ✅/❌ accurately with real "Last Refresh" dates.

**Missing panels:**
- Engineering/SDLC Summary — aggregate gate pass rate, total violations, total test count, CI status across all repos
- Finance Summary — monthly burn by category (LLM, hosting, subscriptions), per-product cost chart, revenue pipeline
- Operations Summary — agent health dots, overnight patrol last run, Pi5 status

**Layout bug:** Huge blank space between Market Intelligence table and Product Summary section → CSS fix.

---

## FIX 9 (P2) — Consistency Checks

| Check | Expected | Fix |
|---|---|---|
| Every product page has same 5 sections | Header, Market, PDLC, SDLC/Issues, Finance | Verify all 9 product pages render all 5 sections |
| Stages match REGISTRY.md everywhere | Mission Control pipeline = product page header = Executive Dashboard | Single data source for stages |
| Issue counts match issues-snapshot.md | Dashboard numbers = snapshot numbers | Parse from correct snapshot file (forge vs axiom) |
| PRD % matches PRD_CHECKLIST.md | Dashboard = file | Fix parser (Fix 3) |
| Finance shows "No data yet" gracefully | Not blank, not error | Already working for most products ✅ |

---

## EXECUTION ORDER

1. **Fix 1** — Product doc path mapping (unblocks all product intelligence data)
2. **Fix 4** — Self-contradiction fix (uses same function as Fix 1)
3. **Fix 2** — Mission Control data consistency (pipeline count, stage alignment)
4. **Fix 3** — PRD parser fix
5. **Fix 6** — SDLC gates product name matching
6. **Fix 5** — Mission Control summary dashboards (charts, aggregates)
7. **Fix 7** — Agent Team enhancements
8. **Fix 8** — Executive Dashboard missing panels
9. **Fix 9** — Final consistency pass

---

## VERIFICATION

- [ ] Zero products show "Missing — needs S1 research" (all 10 have files)
- [ ] Zero self-contradictions (no ✅ "Complete" next to "Missing" on same page)
- [ ] Mission Control shows all 10 products (not 7)
- [ ] All stages match REGISTRY.md (RADAR=S4, FairConnect=S4)
- [ ] GrovaKid PRD shows 54% (33/61), not 33% (26/80)
- [ ] Mission Control has PDLC distribution chart + aggregate bug trend
- [ ] Agent Team shows agent roster + cron health lights + OpenRouter balance
- [ ] Executive Dashboard has Engineering + Finance panels (not just Market Intel)
- [ ] All 9 product pages have same 5 sections
- [ ] No layout bugs (blank spaces, cut-off text)
- [ ] ✅ STANDARD — can merge directly
