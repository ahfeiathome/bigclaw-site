# EXECUTION BRIEF — Dashboard Audit: 20 Issues Found

**Date:** 2026-04-09 | **To:** Code CLI (lc-bigclaw) | **Priority:** P0
**Replaces:** Previous dashboard specs that were marked done prematurely

---

## CONTEXT

Consultant audited every live dashboard page via Chrome. Found 20 issues across Mission Control, Executive Dashboard, product pages, Agent Docs, and sidebar. Core problem: data source mappings are broken — the dashboard can't find files that exist.

---

## CRITICAL: Data Source Path Mapping Is Broken

The root cause of most issues is `product-intel.ts` (or equivalent) looking for product docs at the WRONG paths. All 10 products have S1_COMPETITIVE_RESEARCH.md, but the dashboard shows "Missing" for all of them. This is the #1 fix.

**Known path mapping issues (from OBSIDIAN_DASHBOARD_MAP.md):**
- RADAR docs are at `forge/scripts/radar/docs/product/` — not `radar-site/docs/product/`
- REHEARSAL docs are nested in `axiom/rehearsal/` — not standalone `rehearsal/docs/product/`
- Other products: verify each repo slug → actual GitHub path

**Fix:** Print the actual path product-intel.ts is querying for each product. Compare to where the files actually live. Fix every wrong mapping.

---

## ISSUE TABLE

### P0 — Broken data (shows wrong information)

| # | Page | Issue | Root Cause | Fix |
|---|------|-------|------------|-----|
| 1 | Mission Control | Pipeline shows 7 products, missing FairConnect/KeepTrack/SubCheck | Product list is filtered or hardcoded, not reading full REGISTRY.md | Read all products from REGISTRY.md dynamically |
| 2 | Mission Control | RADAR shows S2 DEFINE (product page shows S4 BUILD correctly) | Mission Control uses different data source than product pages | Both must read from same source (REGISTRY.md) |
| 3 | Mission Control | RADAR company shows "BigClaw AI" instead of "Forge" | Company field not mapped from REGISTRY.md execution sessions table | Map product → company from REGISTRY.md |
| 6 | Executive Dashboard | ALL 9 products show "Missing — needs S1 research" | product-intel.ts file path lookup is broken — can't find docs that exist | Fix repo→path mapping for every product |
| 7 | Executive Dashboard | "Last Refresh" column all shows "—" | Not reading file modification dates | Parse git commit date or file frontmatter `updated:` field |
| 8 | Executive Dashboard | GrovaKid S3 shows 33% but actual PRD is 54% (33/61) | Reading stale cached data or wrong file | Re-fetch PRD_CHECKLIST.md and parse current counts |
| 11 | GrovaKid page | "S1 Research: Missing" — file EXISTS | Same path mapping bug as #6 | Fix product-intel.ts path for learnie-ai |
| 12 | GrovaKid page | "S3 PRD: 33% (26/80 items)" — actual is 54% (33/61) | Stale data or parsing error (80 items? PRD has 61) | Re-parse PRD_CHECKLIST.md — check regex |
| 13 | GrovaKid page | "Last competitive refresh: Never" | Not reading COMPETITIVE_LOG.md | Add COMPETITIVE_LOG.md to product-intel.ts data sources |
| 15 | RADAR page | S1 shows ✅ "Complete" but status shows "Missing — needs S1 research" — CONTRADICTS | Two different code paths checking the same thing with different logic | Unify S1 existence check into one function |
| 17 | RADAR page | "No test health data" — RADAR has 314 tests | SDLC_GATES_MATRIX.md product name doesn't match slug used by dashboard | Verify product name matching between SDLC_GATES_MATRIX.md and dashboard slugs |
| 18 | Agent Docs | **404 — page doesn't exist** | Sidebar link points to nonexistent route | Create the page OR remove the dead link |

### P1 — Structural / Navigation

| # | Page | Issue | Fix |
|---|------|-------|-----|
| 4 | Sidebar | "Agent Docs" under PRODUCT LINEUP — wrong section | Move to COMPANY section, rename "Agent Team" |
| 5 | Mission Control | "0 Critical /100" — unclear metric | Add tooltip or label explaining what this score means |
| 9 | Executive Dashboard | Huge blank space between Market Intelligence and Product Summary | CSS/layout bug — likely a container with fixed height or missing content |
| 10 | Executive Dashboard | Missing panels: Engineering/SDLC, Finance, Operations/Agent | These are in the Architecture v2 spec — not yet built |
| 14 | Product pages | Missing sections: Engineering/SDLC, Finance/Cost, issues trend chart | Same — Architecture v2 spec not yet built |
| 16 | RADAR page | Company shows "BigClaw AI" — should be Forge | Same fix as #3 |
| 19 | Sidebar | "Agent Docs" is a dead link (404) | Fix route or remove link |
| 20 | Sidebar | No "Agent Team" under COMPANY | Create page at `/dashboard/agent-team` reading from PI5_AGENT_SYSTEM.md + AGENT_OPS_INDEX.md |

---

## EXECUTION ORDER

1. **Fix product-intel.ts path mapping** (#6, #11, #15) — this is the root cause of most data issues. Once paths are correct, S1/S2/S3 status will populate correctly for all products.

2. **Fix Mission Control product list** (#1, #2, #3) — read all 10 products from REGISTRY.md, use same stage data as product pages.

3. **Fix PRD parsing** (#8, #12) — the regex is finding 80 items when PRD has 61. And showing 33% when actual is 54%. Check the parser.

4. **Fix Agent Docs → Agent Team** (#4, #18, #19, #20) — rename sidebar item, move to COMPANY section, create page reading from `PI5_AGENT_SYSTEM.md` + `AGENT_OPS_INDEX.md`, show agent roster + cron health + last outputs.

5. **Fix competitive refresh** (#7, #13) — read COMPETITIVE_LOG.md last-modified date for "Last Refresh" column. Read KNOWLEDGE_HUB.md for latest Sage entries.

6. **Fix layout** (#5, #9) — blank space bug, unclear metrics.

7. **Build remaining panels** (#10, #14) — Engineering/SDLC, Finance, Operations panels from Architecture v2 + Ops panel specs. This is larger work — do after fixes.

---

## VERIFICATION

- [ ] All 10 products appear in Mission Control pipeline (not 7)
- [ ] RADAR shows S4 BUILD everywhere (not S2 DEFINE on Mission Control)
- [ ] Zero products show "Missing — needs S1 research" (all 10 have S1 files)
- [ ] GrovaKid PRD shows 54% (33/61), not 33% (26/80)
- [ ] "Last Refresh" column shows actual dates, not "—"
- [ ] No self-contradictions (S1 ✅ but status "Missing")
- [ ] Agent Team page exists under COMPANY with agent roster + cron health
- [ ] No dead sidebar links (404s)
- [ ] No huge blank spaces between sections
- [ ] ✅ STANDARD — can merge directly
