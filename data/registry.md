---
title: BigClaw AI — Company Registry
type: governance
status: active
created: 2026-04-03
updated: 2026-04-05
---

# Company Registry

Single source of truth for all companies under BigClaw AI.

| Company | Architecture | Entry Point | Claude Project | Hardware | Products | Status |
|---------|-------------|-------------|----------------|----------|----------|--------|
| **BigClaw AI** (parent) | CODE_ONLY → AGENTS_LED | `lc-bigclaw` | Shared: "BigClaw AI" | MCPro now, +Pi5 after Phase 0 | Shared services | Active |
| **Forge** | AGENTS | `lc-forge` | Shared: "BigClaw AI" | MCPro + Pi5 | GrovaKid, CORTEX | Active |
| **Axiom** | CODE_ONLY | `lc-axiom` | Shared: "BigClaw AI" | MCPro only | FairConnect, KeepTrack, SubCheck, iris-studio, fatfrogmodels, REHEARSAL | Active |
| **Nexus** | AGENTS_LED | `lc-nexus` | Shared: "BigClaw AI" | Pi5 + MCPro | BigClaw Dashboard (pending), RADAR (pending) | Setup — Phase 0 gate April 18 |

### Architecture Types
- **AGENTS:** Code CLI is CEO, dispatches Pi5 agents as subordinates
- **CODE_ONLY:** Code CLI does everything, no agents
- **AGENTS_LED:** Pi5 agents hold decision authority, Code CLI dispatched as a tool
- **CODE_ONLY → AGENTS_LED:** Starts CODE_ONLY for build phase, flips to AGENTS_LED after Phase 0 gate

**Claude Chat:** One session, one Project ("BigClaw AI") covers all companies.
**Code CLI:** Separate sessions per company (`lc-forge`, `lc-axiom`, `lc-openclaw`).

---

## Product Ownership

Every product belongs to exactly one company. No shared projects.

| Product | Company | Repo | Revenue Model | Status |
|---------|---------|------|---------------|--------|
| GrovaKid | Forge | learnie-ai | Deferred (co-founder agreement) | Active |
| CORTEX | Forge | cortex | Freemium (visual/OCR lane) | Shelved — pivoted 2026-04-05 |
| FairConnect | Axiom | fairconnect | Apple IAP | S2 DEFINE |
| KeepTrack | Axiom | keeptrack | Apple IAP | S2 DEFINE |
| SubCheck | Axiom | subcheck | Apple IAP | S1 DONE — queued |
| iris-studio | Axiom | iris-studio | Stripe (art sales) | Pre-launch |
| fatfrogmodels | Axiom | fatfrogmodels | Stripe (physical goods) | Active |
| REHEARSAL | Axiom | rehearsal (TBD) | Apple IAP (freemium + credits) | Shelved — queued after FOUNDRY top 3 |
| BigClaw Dashboard | OpenClaw | bigclaw-site | Internal portal | Active build |
| RADAR | OpenClaw (post-Phase 0) | radar (extract from Forge) | Personal brokerage (Alpaca) | Paper phase |

---

## Product Notes

### CORTEX (Forge) — Pivoted 2026-04-05
Text/URL capture lane is now covered by Readwise Reader (74K users, MCP, Ghostreader AI,
Obsidian plugin). CORTEX pivots to the remaining genuine gap: **photo/visual/OCR capture**.
Whiteboards, handwritten notes, camera roll bulk import, screenshots — Readwise cannot
do this. Agent write API (POST /captures) remains a differentiator — Readwise MCP is read-only.
See: `forge/cortex/CHECKPOINT.md`

### REHEARSAL (Axiom) — New 2026-04-05
AI career assist: voice-first mock interview + delivery feedback + resume targeting.
Emerged from Michael's personal job search pain points. Voice/verbal feedback is the
gap in existing tools. B2C credits model, potential B2B (bootcamps, outplacement).
Michael is first user. Shelved until FOUNDRY top 3 reach revenue.
See: `axiom/docs/specs/rehearsal-product-brief.md`

### RADAR (OpenClaw) — Formalized 2026-04-05
Personal AI trading engine. Dual-account (paper $100K + live <$5K). Rex (CFO) holds
trading authority within constitution. 24/7 ops via OpenClaw AGENTS_LED architecture.
Code extracted from Forge post-Phase 0 gate (April 18).
See: `docs/specs/radar-product-brief.md`

---

## RADAR Transfer Timeline

| Date | Event |
|---|---|
| Now → April 18 | RADAR under Axiom operationally, agents running in Forge |
| April 18 | Phase 0 gate review (Michael + Consultant) |
| April 18–25 | RADAR code extracted to `ahfeiathome/radar`, transferred to OpenClaw |
| Post-transfer | Rex holds full trading authority per RADAR constitution |

---

## BigClaw AI Shared Services (after Phase 0)

Not products — operational capabilities consumed by all companies.

| Service | Agent | Output Location |
|---------|-------|----------------|
| Market Intelligence | Sage | bigclaw-ai/knowledge/ |
| Content Pipeline | Lumina | Per-product marketing specs |
| Infra Monitoring | Byte | Cross-company Pi5 health reports |
| Investment Research | Sage + Rex | bigclaw-ai/knowledge/INVESTMENT_PORTFOLIO.md |

---

## Transferring a Product

1. Update this table (change Company column)
2. Update source company's COMPANY.md (remove product)
3. Update target company's COMPANY.md (add product)
4. Move product-specific specs to target company's docs/specs/
5. Product repo, GitHub Issues, git history — all stay in place

---

## Shared Resources (bigclaw-ai/)

All companies read from and contribute to:
- `knowledge/` — market intel, competitor research
- `growth/LEARNINGS.md` — pitfalls and wins (tagged by company)
- `skills/` — shared Claude skills
- `credentials/` — shared API keys
- `founder/FOUNDER_TODO.md` — single place for all 💳/⚖️ requests
- `docs/specs/` — cross-company specs (e.g. RADAR, shared infra)
