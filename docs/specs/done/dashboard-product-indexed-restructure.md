# EXECUTION BRIEF — Dashboard Product-Indexed Restructure

**Date:** 2026-04-08 | **To:** Code CLI (lc-bigclaw) | **Priority:** P0
**Company:** BigClaw Dashboard (bigclaw-site)

---

## SITUATION

The dashboard currently organizes Engineering as flat pages (Gate Matrix, Violations, Test Health showing ALL products in one table) and Finance as a single page. The three main sections — Product Portfolio, Engineering, and Finance — must all follow the same product-indexed pattern: an Overview page with aggregate charts/tables, then a sub-page per product showing only that product's data.

**Critical architecture constraint:** The dashboard reads markdown files from GitHub via API (not local filesystem). Cron jobs and agents write markdown files → git push → dashboard renders. Every dashboard section must map to a specific markdown file that a cron job keeps fresh. If no cron job writes the file, the dashboard page goes stale.

Reference design for per-product Engineering page: the GrovaKid issues trend screenshot (90-day line chart, open/closed bar, priority badges, open/recently-closed lists).

---

## DESIRED STRUCTURE

```
📦 Product Portfolio/
   Overview          → All 10 products: stage cards, health summary, aggregate charts
   ├── GrovaKid      → Description, PDLC stage, PRD checklist %, competitive intel
   ├── RADAR         → same pattern
   └── ...all 10 products

⚙️ Engineering/
   Overview          → Aggregate: total open issues (all repos), gate matrix (all products),
                       total violations, test health summary table, aggregate charts
   ├── GrovaKid      → Gate Matrix (GrovaKid rows only) + Violations (GrovaKid only)
   │                   + Test Health (GrovaKid only) + Issues Trend chart (90d)
   │                   + Open/Closed bar + Open issue list + Recently Closed list
   ├── RADAR         → same pattern, RADAR-specific data
   └── ...all 10 products

💰 Finance/
   Overview          → Aggregate: total monthly burn, cost breakdown by product (chart),
                       total revenue (current + projected), budget vs actual table
   ├── GrovaKid      → LLM costs, infra costs, revenue (projected $19.99/mo × subscribers)
   ├── RADAR         → Trading costs (Alpaca), API costs, paper P&L
   └── ...all 10 products
```

---

## DATA PIPELINE — File → Dashboard → Cron Ownership

**Flow:** Cron/agent writes .md file → git push → GitHub → Dashboard reads via GitHub API → renders page

### Product Portfolio Pages

| Dashboard Section | Source File (in Obsidian vault) | Writer | Frequency | Exists? |
|---|---|---|---|---|
| All products list + stages | `REGISTRY.md` | Code CLI (after stage-advancing work) | On change | ✅ |
| Per-product description, stage, revenue, live URL | `REGISTRY.md` | Code CLI | On change | ✅ |
| Per-product competitive intel | `<repo>/docs/product/S1_COMPETITIVE_RESEARCH.md` | Sage (weekly Monday 6am cron) | Weekly | ✅ All 10 |
| Per-product competitive changes | `<repo>/docs/product/COMPETITIVE_LOG.md` | Sage | Weekly | ✅ All 10 |
| Per-product MRD summary | `<repo>/docs/product/S2_MRD.md` | Code CLI | On change | ✅ All 10 |
| Per-product PRD checklist % | `<repo>/docs/product/PRD_CHECKLIST.md` | Code CLI (at session end) | On change | ✅ 7 of 10 |
| Aggregate market intel | `knowledge/KNOWLEDGE_HUB.md` | Sage (weekly + overnight deep research) | Weekly | ✅ |
| Portfolio summary + gate table | `knowledge/PORTFOLIO_SUMMARY.md` | Consultant | On change | ✅ |

### Engineering Pages

| Dashboard Section | Source File | Writer | Frequency | Exists? |
|---|---|---|---|---|
| Gate Matrix (all products) | `knowledge/SDLC_GATES_MATRIX.md` | Code CLI (after gate changes) | On change | ✅ |
| Violations (all products) | `growth/SDLC_VIOLATIONS.md` | Code CLI (on violation) | On event | ✅ |
| Protected gate violations | `ops/PROTECTED_GATE_VIOLATIONS.md` | PreToolUse hook (automatic) | On event | ✅ |
| Issues snapshot (Forge products) | `forge/docs/status/issues-snapshot.md` | Code CLI / cron (`gh` script) | Daily | ✅ |
| Issues snapshot (Axiom products) | `axiom/docs/status/issues-snapshot.md` | Code CLI / cron (`gh` script) | Daily | ⚠️ 3d stale |
| Per-product test health | `<repo>/test-results/` or CI output | **MISSING — needs cron** | — | ❌ |

### Finance Pages

| Dashboard Section | Source File | Writer | Frequency | Exists? |
|---|---|---|---|---|
| Forge finance summary | `forge/FINANCE.md` | Rex (CFO agent) | Daily | ✅ |
| Daily cost breakdown | `ops/DAILY_COSTS.md` | **Rex — needs per-product breakdown** | Daily | ⚠️ Exists but not per-product |
| Cost model (unit economics) | `knowledge/COST_MODEL.md` | Consultant | On change | ✅ |
| Per-product MRD pricing | `<repo>/docs/product/S2_MRD.md` (pricing section) | Code CLI | On change | ✅ |
| RADAR paper P&L | `forge/scripts/radar/` outputs | Rex / RADAR engine | Daily | ⚠️ Not in standard location |
| Investment portfolio | `knowledge/INVESTMENT_PORTFOLIO.md` | Rex | On change | ✅ |

---

## GAPS TO FILL (cron jobs needed)

These files either don't exist or aren't written by any cron. Without them, dashboard sections will show "No data yet" permanently.

| Gap | Needed File | Recommended Writer | Recommended Schedule |
|---|---|---|---|
| Per-product test health | `<repo>/docs/status/test-health.md` (one per repo) | **Bash script** — runs `npm test` or reads CI, writes summary | Nightly (2am patrol or standalone cron) |
| Per-product cost breakdown | `ops/DAILY_COSTS.md` with per-product sections | **Rex** — expand existing daily cost write to break down by product | Daily (already runs daily, just needs format change) |
| Axiom issues-snapshot freshness | `axiom/docs/status/issues-snapshot.md` | **Bash script** — `gh issue list` per Axiom repo | Daily |
| RADAR P&L in standard location | `radar-site/docs/status/trading-summary.md` | **Rex / RADAR engine** — write paper P&L summary | Daily (after market close) |

### Recommended file format for test-health.md (per repo)

```markdown
# Test Health — [Product Name]
**Generated:** 2026-04-08 03:00 UTC
**Repo:** [repo-name]

| Metric | Value |
|--------|-------|
| Total tests | 437 |
| Passing | 435 |
| Failing | 2 |
| Coverage | 52% |
| CI status | ✅ green |
| Last CI run | 2026-04-08 02:45 UTC |
```

### Recommended per-product section in DAILY_COSTS.md

```markdown
## Per-Product Cost Breakdown

| Product | LLM API | Hosting | Database | Other | Total |
|---------|---------|---------|----------|-------|-------|
| GrovaKid | $0.12 | $0 (Vercel free) | $0 (Neon free) | — | $0.12 |
| RADAR | $0.08 | $0 | $0 | Alpaca $0 | $0.08 |
| iris-studio | $0 | $0 | $0 | — | $0 |
| Dashboard | $0 | $0 | — | — | $0 |
| Agents (shared) | $0.40 | — | — | OpenRouter | $0.40 |
```

---

## DASHBOARD → FILE REFERENCE TABLE

This is the authoritative mapping. Dashboard code (content.ts / GitHub fetch) should use these paths.

| Dashboard Route | File Path (relative to bigclaw-ai/) | GitHub Repo | Notes |
|---|---|---|---|
| `/portfolio/overview` | `REGISTRY.md` | bigclaw-ai | Dynamic product list + stages |
| `/portfolio/[slug]` | `REGISTRY.md` + `<repo>/docs/product/*` | bigclaw-ai + product repo | Combine registry row + product docs |
| `/engineering/overview` | `knowledge/SDLC_GATES_MATRIX.md` + all `issues-snapshot.md` + all `test-health.md` | bigclaw-ai + forge + axiom | Aggregate across repos |
| `/engineering/[slug]` | Filter above by product/repo | Same | Filter to single product |
| `/finance/overview` | `ops/DAILY_COSTS.md` + `forge/FINANCE.md` + `knowledge/COST_MODEL.md` | bigclaw-ai + forge | Aggregate |
| `/finance/[slug]` | Filter `DAILY_COSTS.md` by product + `<repo>/docs/product/S2_MRD.md` (pricing) | Same | Per-product |

### Repo-to-product mapping (for issues-snapshot + test-health filtering)

| Product | GitHub Repo | issues-snapshot location | Notes |
|---|---|---|---|
| GrovaKid | `learnie-ai` | `forge/docs/status/issues-snapshot.md` (learnie-ai section) | In forge monorepo |
| RADAR | `the-firm` (forge) | `forge/docs/status/issues-snapshot.md` (the-firm section) | Embedded in forge |
| REHEARSAL | `the-firm` (forge) | `forge/docs/status/issues-snapshot.md` | Nested in forge |
| iris-studio | `iris-studio` | `axiom/docs/status/issues-snapshot.md` | In axiom snapshot |
| fatfrogmodels | `fatfrogmodels` | `axiom/docs/status/issues-snapshot.md` | In axiom snapshot |
| FairConnect | `fairconnect` | `axiom/docs/status/issues-snapshot.md` | In axiom snapshot |
| KeepTrack | `keeptrack` | `axiom/docs/status/issues-snapshot.md` | In axiom snapshot |
| SubCheck | `subcheck` | `axiom/docs/status/issues-snapshot.md` | In axiom snapshot |
| CORTEX | `cortex` | `axiom/docs/status/issues-snapshot.md` | In axiom snapshot |
| Dashboard | `bigclaw-site` | N/A (self) | ✅ STANDARD, no issues tracking |

---

## OVERVIEW PAGES — What Each Must Show

### Product Portfolio Overview
- Product cards grid (all 10): name, stage badge, one-line description, health indicator
- PDLC distribution chart (how many products at each stage)
- Table: product | stage | live URL | last activity | blockers
- Source: REGISTRY.md

### Engineering Overview
- Aggregate issues: total open across all repos, total closed (30d)
- Issues trend chart (aggregate, 90d — all repos combined)
- Gate Matrix summary table (all products, all gates)
- Violations count by product (30d)
- Test health summary: product | test count | pass rate | coverage %
- Source: issues-snapshot.md (per repo), SDLC_GATES_MATRIX.md, test-health.md

### Finance Overview
- Monthly burn rate (total across all products)
- Cost breakdown by product — bar or pie chart
- Revenue summary (current + projected)
- Cost trend (30d or 90d line chart)
- Table: product | monthly cost | revenue | margin
- Source: DAILY_COSTS.md, FINANCE.md, COST_MODEL.md

---

## PER-PRODUCT ENGINEERING PAGE — Template

1. **Gate Matrix** — this product's row from SDLC_GATES_MATRIX.md
2. **Violations** — filter SDLC_VIOLATIONS.md for this product only
3. **Test Health** — from `<repo>/docs/status/test-health.md`
4. **Issues Trend** — 90-day line chart (match GrovaKid screenshot design)
5. **Open/Closed bar** — visual bar with counts
6. **Open Issues list** — priority badges (P0 red, P1 yellow)
7. **Recently Closed list** — green dots
8. Source: issues-snapshot.md filtered by repo section

## PER-PRODUCT FINANCE PAGE — Template

1. **Cost breakdown** — from DAILY_COSTS.md per-product section
2. **Revenue** — from MRD pricing section
3. **Unit economics** — from COST_MODEL.md
4. **Trend** — cost over time (needs historical DAILY_COSTS.md entries)
5. Source: DAILY_COSTS.md, COST_MODEL.md, S2_MRD.md

---

## SIDEBAR NAVIGATION

- Product Portfolio, Engineering, Finance each expandable
- Each has Overview + one item per product (dynamic from REGISTRY.md)
- Remove duplicate sector pages (E-Commerce, Foundry) if still present

---

## FRESHNESS INDICATOR

Every dashboard section should show when its source file was last updated (parse the `updated:` frontmatter or `Last updated:` line). If >24h stale, show ⚠️ amber warning. If >7d, show 🔴 red.

---

## DO NOT

- Do NOT hardcode product lists — dynamic from REGISTRY.md
- Do NOT create separate components per product — shared template + slug param
- Do NOT block on missing Finance data — show "No data yet" placeholders
- Do NOT duplicate existing parsers
- Do NOT read from local filesystem — all data via GitHub API (git push is the sync mechanism)

## VERIFICATION

- [ ] `/portfolio/overview` — all 10 products from REGISTRY.md with charts
- [ ] `/engineering/overview` — aggregate gates + issues + test health from markdown files
- [ ] `/engineering/grovakid` — ONLY GrovaKid data, sourced from correct files
- [ ] `/finance/overview` — aggregate cost/revenue from DAILY_COSTS.md + FINANCE.md
- [ ] `/finance/grovakid` — GrovaKid costs + revenue from correct files
- [ ] Sidebar expandable sections for all three domains
- [ ] All product lists dynamic from REGISTRY.md
- [ ] Freshness indicators on every section (⚠️ if >24h, 🔴 if >7d)
- [ ] Missing files → graceful "No data yet" (not crash)
- [ ] After cron writes + git push, new data appears on dashboard without code changes
