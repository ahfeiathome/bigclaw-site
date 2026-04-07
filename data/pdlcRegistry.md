---
title: PDLC Registry — All Products, All Companies
type: pdlc-registry
status: active
updated: 2026-04-05
source: Consultant + CEO
sync: bigclaw-dashboard (pdlcRegistry)
---

# PDLC Registry

Single source for the BigClaw Dashboard PDLC page.
Read by: `bigclaw-site/src/app/dashboard/pdlc/`
Updated by: Code CLI after every stage gate. Consultant after product briefs.

---

## Stage Reference

| Stage | Name | Key Output |
|---|---|---|
| S1 | DISCOVER | Competitive research, go/no-go |
| S2 | DEFINE | MRD — market requirements |
| S3 | DESIGN | PRD + architecture |
| S4 | BUILD | Working product, CI/CD |
| S5 | HARDEN | Polish, App Store readiness |
| S6 | PILOT | TestFlight / beta, real users |
| S7 | LAUNCH | Production, payment live |
| S8 | GROW | Revenue, iteration, monitoring |

---

## Active Products

| Product | Company | Stage | Status | Next Gate | Blocker | Revenue Model |
|---|---|---|---|---|---|---|
| GrovaKid | Forge | S4 BUILD | Auth migration in progress | S5 HARDEN — UI polish | Co-founder agreement (⚖️) | $19.99/mo (deferred) |
| REHEARSAL | Forge | S3 DESIGN | PRD + architecture | S4 BUILD — scaffold Expo/RN | None | Apple IAP credits |
| iris-studio | Axiom | S4 BUILD | Spec complete, build active | S6 PILOT — DNS cutover | Stripe keys (💳) + DNS (💳) | Stripe per-txn |
| fatfrogmodels | Axiom | S7 LAUNCH | Live at fatfrogmodels.vercel.app | S8 GROW | None | Stripe |
| CORTEX | Forge | S4 BUILD | Pivoted to visual/OCR lane | S5 HARDEN — real device testing | None | Freemium + Apple IAP |
| RADAR | BigClaw AI | S2 DEFINE | Paper trading active | Phase 0 gate Apr 18 (🧠) | None | Personal brokerage |
| BigClaw Dashboard | BigClaw AI | S7 LAUNCH | Live — continuous improvement | S8 GROW | None | Internal |

---

## Foundry Pipeline (Axiom — Apple IAP)

| Product | Stage | Status | Next Gate | Blocker |
|---|---|---|---|---|
| FairConnect | S2 DEFINE | MRD in progress | S3 PRD | Market research |
| KeepTrack | S2 DEFINE | MRD starting | S3 PRD | None |
| SubCheck | S1 DONE | Queued after top 2 | S2 DEFINE | Top 2 reach TestFlight |

**Shared blocker for all Foundry apps reaching S6:** Apple Developer account ($99 💳 Michael)

---

## Shelved Products

| Product | Company | Last Stage | Reason | Revival Condition |
|---|---|---|---|---|
| VERDE | Forge | S2 DEFINE | Red ocean — 10+ competitors, free alternatives | Shelved permanently |
| VAULT | Forge | S2 DEFINE | OCR tech absorbed into KeepTrack | Shelved |
| TEMPO | Forge | S1 | Revenue ceiling too low, Apple Visual Intelligence eating category | Archived |

---

## Gate Legend

| Symbol | Meaning |
|---|---|
| 💳 | Michael credit card gate |
| ⚖️ | Michael legal gate |
| 🧠 | Michael judgment gate |
| None | Code CLI autonomous |
