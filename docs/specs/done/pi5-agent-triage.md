### 📋 2026-04-18 Consultant Recommendation — Pi5 Agent Triage & Revival

**Company:** BigClaw (lc-bigclaw) — Pi5 agent management transferred here per Michael
**What:** All 6 Pi5 agents are effectively dead. Diagnose why, fix what's broken, and get them producing useful output again. Priority: Felix (RADAR live trading) and Mika (morning briefings).
**Why:** Michael has heard nothing from any agent in 2+ weeks. No morning reports, no Telegram briefings, no RADAR trades, no market intel. The entire autonomous operations layer has silently failed.
**Risk if skipped:** $50 OpenRouter credit burning on crons that produce nothing. RADAR live account ($90) unmanaged. No operational awareness.

---

## Current State — Evidence-Based

### Pi5 Hardware: ALIVE but agents NOT WORKING
- HEALTH.md collected Apr 15 — Pi5 is running
- 19 active crons still firing
- Disk 74%, RAM 11%, CPU temp 50°C — healthy
- Git sync last activity Apr 14

### Agent-by-Agent Last Signs of Life

| Agent | Role | Model | Last Output | What Died |
|-------|------|-------|-------------|-----------|
| Mika | COO/orchestrator | gemini-2.5-flash | Apr 4 (patrol showed "Busy") | No morning reports, no Telegram briefings since |
| Koda | CDO/dev | gemini-2.5-flash | Mar 30 (codebase scan) | Path errors (DUTY-KODA-EXPAND failing per Apr 9 status) |
| Rex | CFO/RADAR monitor | claude-sonnet-4 | Apr 3 (RADAR reserve check) | No RADAR monitoring for 15 days |
| Sage | BDM/research | deepseek-v3 | Apr 1 (market research) | Session 79h old per Mar 31 Byte scan — may have died then |
| Byte | CIO/infra | deepseek-r1 | Apr 2 (health heartbeat) | Was doing auto-fixes, then silence |
| Lumina | CMO/marketing | llama-3.3-70b | Apr 2 (landing copy) | Never had recurring duties beyond one-shots |

### RADAR-Specific Damage
- Paper account: 8 open positions (AEHR, CAT, COST, DE, GOOGL, LMT, NEE, UFO) UNMONITORED for 15 days
- Last radar_loop.py run: Apr 13 22:30 ET per RADAR_DASHBOARD.md
- Live account (Felix): $90 seed, "trading commenced Apr 12+" — no evidence of actual trades
- Yahoo Finance scraping blocked — never migrated to Alpaca Data API
- Constitution violations may be accumulating unchecked

### Apr 4 Patrol Report Already Showed the Problem
- 5 of 6 agents: Idle, 0 sessions
- Only Mika showed "Busy" with 1 session — then she also went silent
- Pi5 git divergence alert (37 local vs 15 remote commits) may have broken agent file access

---

## Root Cause Chain — 3 cascading failures

**Failure 1 (Apr 8): Claude Max quota exhaustion**
- `ops/PATROL_DISABLED.md` confirms: Mac patrols disabled Apr 8 at 11pm because Claude Max weekly usage hit 99%
- nightly-orchestrator.plist + overnight-patrol.plist were `launchctl unload`ed
- Instructions said to re-enable Friday Apr 10 — UNCLEAR if this happened
- Morning report IS running today (Apr 18 report exists) but flagging "HEALTH.md STALE (82h)"

**Failure 2 (Apr 10): OpenRouter cost leak**
- `ops/DAILY_COSTS.md` shows: burn rate $10.88/day on Apr 10 — would exhaust $50 budget in <2 days
- Fix applied: all agents except Mika/Koda downgraded from Sonnet
- Mika+Koda heartbeat reduced from 30min/60min to 4h each
- Target burn rate fixed to $0.37/day
- BUT: Rex hasn't updated DAILY_COSTS since Apr 10 — no cost tracking

**Failure 3 (ongoing): No fresh OVERNIGHT_GOALS.md**
- Goals file was from Apr 9 — Consultant wrote fresh goals today (Apr 18)
- Even if patrols are running, they had nothing fresh to work on for 9 days

---

## Triage Plan — Priority Order

### P0: Diagnose WHY agents died

Code should SSH into Pi5 and check:
```
# Check if crons are still scheduled
crontab -l | grep -E "byte|koda|sage|rex|lumina|mika|radar"

# Check recent cron execution logs
grep -i "error\|fail\|unable" /var/log/syslog | tail -50

# Check OpenRouter balance
curl https://openrouter.ai/api/v1/auth/key -H "Authorization: Bearer $OPENROUTER_API_KEY"

# Check agent dispatch script
cat ~/Projects/bigclaw-ai/forge/scripts/agent-dispatch.sh

# Check if agent duty prompts still exist
ls -la ~/Projects/bigclaw-ai/ops/pi5/prompts/

# Check agent run logs
ls -la ~/Projects/bigclaw-ai/ops/pi5/*.log
```

### P1: Fix Mac launchd (if not fully re-enabled)
```
# Check what's loaded
launchctl list | grep -E "overnight|nightly|bigclaw|thefirm"

# Re-enable if missing
launchctl load ~/Library/LaunchAgents/com.bigclaw.nightly-orchestrator.plist
launchctl load ~/Library/LaunchAgents/com.thefirm.overnight-patrol.plist
```

### P2: Verify OpenRouter credit balance
$18.39 on Apr 10 minus ~$3 (8 days at $0.37) = ~$15 remaining.
If agents were burning $10/day before fix, balance could be $0.

### P3: Revive agents one by one (after diagnosis)
Priority: Rex (RADAR) → Mika (briefings) → Byte (health) → evaluate rest

### P4: RADAR Paper Account Health Check
Check Alpaca paper API for current positions and P&L. Read only — no trades.

---

## Key Files for Diagnosis

| File | Location | Purpose |
|------|----------|---------|
| PI5_AGENT_SYSTEM.md | forge/docs/operations/ | Full agent system architecture |
| HEALTH.md | forge/docs/operations/ | Last Pi5 health snapshot |
| COO_INBOX.md | forge/ | Agent output log (last real entry Apr 3) |
| AGENT_TASKS.md | forge/ | Task assignments TO agents |
| BANDWIDTH.md | forge/docs/operations/ | Telegram loop status |
| agents/*.md | forge/agents/ | Individual agent SOUL files |
| OVERNIGHT_GOALS.md | ops/ | Goals for overnight patrol (FRESHLY WRITTEN today) |
| PATROL_DISABLED.md | ops/ | Documents why patrols were disabled Apr 8 |

---

## DASHBOARD AUDIT — bigclaw-site.vercel.app (2026-04-18)

Site loads, design is solid, but product data is stale across every card.

### Data Mismatches vs REGISTRY.md

| Product | Dashboard Badge | REGISTRY Stage | Fix |
|---------|----------------|----------------|-----|
| GrovaKid | LIVE | S4 BUILD (pilot-blocked) | Badge → BUILD, update test count 437→633 |
| REHEARSAL | BUILD | S3 DESIGN (shelved) | Badge → SHELVED |
| iris-studio | BUILD | S4 BUILD (gated) | Remove Sanity from tech stack (DEFERRED P2) |
| FairConnect | BUILD | S4 BUILD | Update phase text (PRs merged, not open) |
| KeepTrack | BUILD | S5 HARDEN | Badge → HARDEN, fix "S7" → "S5" |
| SubCheck | BUILD | ARCHIVED | Badge → ARCHIVED (merged into KeepTrack) |
| CORTEX | BUILD | RETIRED | Badge → RETIRED or remove card |
| RADAR | PAPER | S4 BUILD (gate blocked) | Update to "314 tests, dual-track, 20% win rate" |

### Codebase Architecture — Data Pipeline Already Exists
```
Source files (forge/, axiom/, bigclaw-ai/)
    ↓
scripts/sync-data.mjs (last ran: 2026-04-11)
    ↓
data/*.md + data/*.json (local copies)
    ↓
src/lib/parsers/*.ts (12 parsers)
    ↓
Dashboard pages render parsed data
```

The dashboard is NOT hardcoded for internal pages — it has `sync-data.mjs`, 12 parsers, and `data/registry.md`. But:
1. sync-data.mjs hasn't run since Apr 11
2. Public pages (`(public)/page.tsx`, `projects/page.tsx`) likely have HARDCODED product arrays
3. `data/registry.md` doesn't reflect today's REGISTRY changes

### Fix for Code
1. Run `node scripts/sync-data.mjs` to refresh data/
2. Wire public pages to read from data/registry.md instead of hardcoded arrays
3. Add sync-data.mjs to pre-deploy hook
4. Verify dashboard login works and internal pages render

---

## Constraints
- Pi5 agent management is now under lc-bigclaw (REGISTRY updated Apr 18)
- Agent data files remain in forge/ — cross-repo read
- Do NOT restart agents blindly — diagnose first
- OpenRouter spend must stay within budget (~$0.40/day)
- Felix live RADAR is highest priority (real money)
- Dashboard is ✅ STANDARD (not PROTECTED) — Code deploys autonomously
