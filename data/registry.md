---
title: BigClaw AI — Product Registry
type: governance
status: active
updated: 2026-04-07
note: Corrected stages from 3-session audit. This file is THE source of truth for all stages.
---

# BigClaw AI — Product Registry

One company. Products organized by sector.
No sub-companies. No separate entities.

---

## Production Gates

Products marked `🔒 PROTECTED` require Michael approval before PRODUCTION DEPLOYMENT.
This means approval to deploy to the live production URL — NOT approval for every PR.

**What PROTECTED means:**
- Felix CAN merge PRs to main on his own (after CI + code review pass)
- Felix CANNOT deploy to production without Michael's approval
- Felix writes a PRODUCTION GATE entry in FOUNDER_TODO.md when ready
- Michael reviews the preview URL on his phone and says "approved" or "rejected"
- Felix then deploys to production and verifies the live site

**What PROTECTED does NOT mean:**
- Michael does NOT review individual PRs
- Michael does NOT merge PRs on GitHub
- Michael does NOT do code review
- Michael does NOT touch GitHub at all

| Product | Gate | Rule |
|---------|------|------|
| fatfrogmodels | 🔒 PROTECTED | Michael approves all production deploys |
| iris-studio | 🔒 PROTECTED | Michael approves all production deploys |
| GrovaKid | 🔒 PROTECTED | Michael approves all production deploys |
| REHEARSAL | 🔒 PROTECTED | Michael approves all production deploys |
| FairConnect | 🔒 PROTECTED | Michael approves all production deploys |
| KeepTrack | 🔒 PROTECTED | Michael approves all production deploys |
| SubCheck | ARCHIVED | Frozen — no production deploys needed |
| CORTEX | 🔒 PROTECTED | Michael approves all production deploys |
| RADAR | 🔒 PROTECTED | Michael approves all production deploys |
| BigClaw Dashboard | ✅ STANDARD | Code deploys autonomously (internal tool) |

**Enforcement:** GitHub branch protection (main requires PR) + Vercel manual production trigger.
**Sessions:** Any spec touching deployment of a 🔒 product must write to FOUNDER_TODO.md instead.

---

## Products by Sector

### 🎓 Education & Career

| Product | Repo | Revenue | Stage | Live | Evidence |
|---------|------|---------|-------|------|----------|
| GrovaKid | learnie-ai | $19.99/mo (deferred — co-founder) | S4 BUILD (advanced) | learnie-ai-ten.vercel.app | 437+ tests, 32 test files, 10 overnight features (onboarding, emails, charts, milestones, adaptive difficulty, standards, recommendations, history, goals). Production slug bug fixed. Open PR #58 (Auth0→Better Auth). |
| REHEARSAL | rehearsal | Apple IAP credits | S3 DESIGN (shelved) | rehearsal-bigclaw.vercel.app | PRD complete, Expo/RN scaffold built, 4 screens + 80 questions. Shelved pending FOUNDRY revenue. |

### 🛍️ Commerce

| Product | Repo | Revenue | Stage | Live | Evidence |
|---------|------|---------|-------|------|----------|
| iris-studio | iris-studio | Stripe per-txn | S4 BUILD (code-complete, gated) | iris-studio.vercel.app | All 8 pages built + QA'd. 34 tests. PRs #4/#5/#6 awaiting 🔒 Michael merge. Blocked: 💳 Stripe keys, 💳 DNS cutover, 💳 Sanity project. |
| fatfrogmodels | fatfrogmodels | Stripe | S7 LAUNCH | fatfrogmodels.vercel.app | Live. 9/9 products in Neon. Open bug #48 (bulk import image re-upload). |

### 📱 Consumer Tools

| Product | Repo | Revenue | Stage | Live | Evidence |
|---------|------|---------|-------|------|----------|
| FairConnect | fairconnect | Apple IAP | S4 BUILD (E2E added) | fairconnect.vercel.app | P0 API routes on main (PR #1 merged). 25 unit tests + 10 Playwright E2E tests (4 booth flows: capture, customers, sales, follow-ups). S1 competitive research done — partial blue ocean confirmed. PRD gaps: customer edit/delete, name search UI, revenue trigger verify. |
| KeepTrack | keeptrack | Apple IAP | S5 HARDEN (archive ready) | keeptrack-bigclaw.vercel.app | All S7 features built (OCR, iCloud, push, StoreKit 2 Pro). Archive built. Blocked: 💳 Apple Developer $99 for TestFlight. |
| SubCheck | subcheck | Apple IAP | ARCHIVED — merged into KeepTrack | subcheck-bigclaw.vercel.app | Subscription tracking absorbed into KeepTrack Lane 3 (P1). Repo frozen. No new development. |

### 🧠 Knowledge

| Product | Repo | Revenue | Stage | Live | Evidence |
|---------|------|---------|-------|------|----------|
| CORTEX | cortex | Freemium + Apple IAP | S4 BUILD (visual/OCR pivot) | cortex-bigclaw.vercel.app | Pivoted from text/URL to Visual Capture lane. Readwise covers text. Active development. |

### 📈 FinTech

| Product | Repo | Revenue | Stage | Live | Evidence |
|---------|------|---------|-------|------|----------|
| RADAR | radar-site | Personal brokerage | S4 BUILD (gate blocked) | radar-bigclaw.vercel.app | 314 tests, 50% coverage, kill switch active. Paper trading: 30% win rate (below 40% threshold). Phase 0 gate Apr 18 — will NOT pass at current win rate. Next: improve signal quality or extend gate to May 2. |

### ⚙️ Operations

| Product | Repo | Revenue | Stage | Live |
|---------|------|---------|-------|------|
| BigClaw Dashboard | bigclaw-site | Internal | Active | bigclaw-site.vercel.app |

---

## Shared Gates

- Apple Developer $99 (💳 Michael) — all mobile apps at S6 PILOT
- Co-founder agreement (⚖️) — GrovaKid only
- RADAR live capital <$5K (💳 Michael) — RADAR only

---

## Execution Sessions

**RULE: Each session reports ONLY products listed in its row. No overlap.**
**RULE: After completing ANY spec that advances a product, update the Stage + Evidence columns in this file.**

| Alias | Working Dir | Products |
|-------|------------|---------|
| `lc-bigclaw` | `~/Projects/bigclaw-ai/bigclaw-site` | BigClaw Dashboard, orchestration, governance |
| `lc-forge` | `~/Projects/bigclaw-ai/forge` | GrovaKid, REHEARSAL, RADAR |
| `lc-axiom` | `~/Projects/bigclaw-ai/axiom` | iris-studio, fatfrogmodels, FairConnect, KeepTrack, SubCheck, CORTEX |

**Reporting boundary:** lc-forge does NOT report on iris-studio. lc-axiom does NOT report on GrovaKid. lc-bigclaw aggregates the dashboard view but does NOT report product-level status — that's each owning session's job. If a session's report mentions a product it doesn't own, the report is wrong.

---

## Shared Resources

All sessions read from and contribute to ~/Projects/bigclaw-ai/:
- `knowledge/` — market intel
- `ops/` — COMPLETIONS.md, PENDING_CONSULTANT.md, Pi5 outputs
- `growth/LEARNINGS.md` — pitfalls and wins
- `credentials/CREDENTIALS.md` — shared API keys
- `founder/FOUNDER_TODO.md` — 💳/⚖️ requests
- `docs/WORKFLOW.md` — unified workflow
