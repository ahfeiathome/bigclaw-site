# EXECUTION BRIEF — Dashboard Architecture v2 (Michael's Design)

**Date:** 2026-04-08 | **To:** Code CLI (lc-bigclaw) | **Priority:** P0
**Replaces:** previous `next-actions-apr08.md`

---

## ARCHITECTURE

Two top-level sections. Company is about the business. Product Lineup is about each product.

```
📊 COMPANY
   ├── Mission Control        → Actionable controls (toggles, gates, actions)
   └── Executive Dashboard    → Read-only summary across 5 domains

📦 PRODUCT LINEUP
   ├── [GrovaKid]             → Everything about this product on ONE page
   ├── [RADAR]                → Same structure
   ├── [iris-studio]          → Same structure
   └── ...all 10 products
```

No separate Engineering section. No separate Finance section. Those domains live INSIDE each product page AND are summarized in the Executive Dashboard.

---

## COMPANY → Mission Control

**Purpose:** This is where Michael ACTS. Pure controls, not reports.

Content:
- **Sponsor Gates** — FOUNDER_TODO.md TODAY section. Toggles/buttons for each 💳/⚖️/🧠 gate (approve, defer, escalate)
- **🔒 PROTECTED Merges** — list of PRs awaiting Michael approval across all repos, with one-click approve links
- **Agent Controls** — toggle agents on/off, view last heartbeat, trigger manual runs
- **Overnight Goals** — edit/preview tonight's OVERNIGHT_GOALS.md
- **Cron Health** — launchd job status (green/red), last run time, last exit code
- **Alerts** — any P0 flags from MORNING_REPORT.md or agent outputs

**Data sources:** FOUNDER_TODO.md, GitHub PRs API, launchd status, ops/MORNING_REPORT.md, OVERNIGHT_GOALS.md

---

## COMPANY → Executive Dashboard

**Purpose:** Read-only. Michael opens this and in 30 seconds knows how the business is doing. Five summary panels, each pulling key metrics from all products.

### Panel 1: Company Health
- Total products: 10 (from REGISTRY.md)
- Products by PDLC stage: chart showing distribution (S1/S2/S3/S4/S5/S6/S7)
- Revenue status: $0 MRR (pre-revenue), projected MRR at launch
- Burn rate: $/month (from DAILY_COSTS.md + FINANCE.md)
- Runway: infinite at current spend
- Agent health: Pi5 up/down, overnight patrol last run, cron status

### Panel 2: Market Intelligence
- Latest Sage findings (last 3 KH entries from KNOWLEDGE_HUB.md)
- Competitive alerts: any new competitor moves (from COMPETITIVE_LOG.md across products)
- Last research refresh date (⚠️ if >7 days)

### Panel 3: Product Summary
- Table: product | stage | PRD % | live URL | top blocker
- Sortable by stage or PRD completion
- Color-coded: green (healthy), yellow (blocked), red (critical issue)
- Source: REGISTRY.md + per-product PRD_CHECKLIST.md

### Panel 4: Engineering / SDLC
- Aggregate open issues across all repos (from issues-snapshot.md files)
- Gate Matrix summary (from SDLC_GATES_MATRIX.md) — just pass/fail counts
- Total tests across all products (from TEST_PLAN.md / CI results)
- Violations count (from SDLC_VIOLATIONS.md)
- Recent merges (last 5 PRs merged across all repos)

### Panel 5: Finance
- Monthly cost by category: LLM API, hosting, subscriptions, agents
- Cost trend chart (30d)
- Per-product cost breakdown (bar chart)
- Revenue pipeline: which products have revenue path, which are pre-revenue
- Source: DAILY_COSTS.md, FINANCE.md, COST_MODEL.md

---

## PRODUCT LINEUP → Per-Product Page (template)

**One page per product. Everything about that product in one scroll.**

Each product page at `/dashboard/products/[slug]` has these sections:

### Section A: Product Header
- Name, one-line description, stage badge (S1-S8)
- Live URL link
- Revenue model (from MRD)
- Current blocker (from REGISTRY.md)
- Last activity (last commit/PR date)

### Section B: Market & Positioning (from MRD + competitive research)
- Market size (TAM/SAM/SOM from S2_MRD.md Section 2)
- Target customer (from S2_MRD.md Section 3)
- Competitive position (from S1_COMPETITIVE_RESEARCH.md — key competitors + our edge)
- Latest competitive changes (from COMPETITIVE_LOG.md — last 3 entries)
- Positioning statement (from S2_MRD.md Section 5)
- Freshness: ⚠️ if competitive research >7 days old

### Section C: Product Development / PDLC
- PDLC pipeline visual: S1 ✅ → S2 ✅ → S3 ✅ → [S4] → S5 → S6 → S7 → S8
- PRD Checklist summary: % complete, done/in-progress/not-started/deferred counts
- PRD category breakdown: AI/ML %, Functional %, UI/UX %, QA %, Auth %, etc.
- Top 5 in-progress PRD items (from PRD_CHECKLIST.md)
- Top blockers for next stage
- Source: REGISTRY.md (stage), PRD_CHECKLIST.md

### Section D: Engineering / SDLC
- Gate Matrix — this product's row (from SDLC_GATES_MATRIX.md)
- Violations — filtered to this product (from SDLC_VIOLATIONS.md)
- Test health — test count, pass rate, coverage % (from TEST_PLAN.md or CI)
- Issues trend — 90-day chart (from issues-snapshot.md, same design as existing GrovaKid chart)
- Open/Closed bar + issue list with priority badges
- Open PRs for this repo (from GitHub API)
- Source: issues-snapshot.md filtered by repo

### Section E: Finance / Cost
- Monthly cost for this product (from DAILY_COSTS.md per-product section)
- Cost categories: LLM API, hosting, database, other
- Revenue: current + projected (from S2_MRD.md pricing section)
- Unit economics: cost per user/worksheet/transaction (from COST_MODEL.md)
- Show "No data yet" if per-product cost data doesn't exist
- Source: DAILY_COSTS.md, COST_MODEL.md, S2_MRD.md

---

## SIDEBAR NAVIGATION

```
📊 Company
   Mission Control
   Executive Dashboard

📦 Product Lineup
   GrovaKid
   RADAR
   iris-studio
   fatfrogmodels
   FairConnect
   KeepTrack
   SubCheck
   CORTEX
   REHEARSAL
   Dashboard (meta)

⚙️ Settings
   Users
   Roles
```

Product list in sidebar is dynamic from REGISTRY.md. No hardcoded product names.
Remove: E-Commerce, Foundry, SDLC Process, Gates Matrix, Violations, RCA, Knowledge, Learnings as standalone sidebar items — all this data now lives inside product pages or Executive Dashboard.

---

## DATA SOURCE MAP

| Dashboard Section | File | Writer | Frequency |
|---|---|---|---|
| Mission Control: Sponsor Gates | founder/FOUNDER_TODO.md | Consultant | Per session |
| Mission Control: PRs | GitHub API (live) | — | Real-time |
| Mission Control: Cron Health | launchd status / logs | System | Real-time |
| Exec: Company Health | REGISTRY.md + DAILY_COSTS.md | Code + Rex | Daily |
| Exec: Market Intel | knowledge/KNOWLEDGE_HUB.md | Sage | Weekly |
| Exec: Product Summary | REGISTRY.md + PRD_CHECKLIST.md per product | Code | Per session |
| Exec: Engineering | issues-snapshot.md + SDLC_GATES_MATRIX.md | Code / cron | Daily |
| Exec: Finance | DAILY_COSTS.md + FINANCE.md + COST_MODEL.md | Rex | Daily |
| Product: Market | <repo>/docs/product/S1_*.md, S2_MRD.md, COMPETITIVE_LOG.md | Sage + Code | Weekly |
| Product: PDLC | REGISTRY.md + PRD_CHECKLIST.md | Code | Per session |
| Product: SDLC | SDLC_GATES_MATRIX.md + SDLC_VIOLATIONS.md + issues-snapshot.md | Code / cron | Daily |
| Product: Finance | DAILY_COSTS.md + COST_MODEL.md + S2_MRD.md | Rex + Consultant | Daily / on change |

---

## FRESHNESS INDICATORS (on every section)

Source file last-modified date shown. ⚠️ amber if >24h. 🔴 red if >7d.

---

## DO NOT

- Do NOT create separate Engineering/Finance top-level sections — they live inside products
- Do NOT hardcode product lists — dynamic from REGISTRY.md
- Do NOT create separate components per product — shared template + slug param
- Do NOT block on missing data — "No data yet" placeholders
- Do NOT read from local filesystem — all via GitHub API

## VERIFICATION

- [ ] `/dashboard/mission-control` shows sponsor gates + PR list + cron status
- [ ] `/dashboard/executive` shows 5 summary panels with real data
- [ ] `/dashboard/products/grovakid` shows ALL 5 sections (header, market, PDLC, SDLC, finance) on one page
- [ ] Product list in sidebar is dynamic from REGISTRY.md
- [ ] E-Commerce/Foundry/standalone SDLC pages removed from sidebar
- [ ] Freshness indicators visible on every section
- [ ] "No data yet" for products with missing cost/test data
- [ ] ✅ STANDARD — can merge directly
