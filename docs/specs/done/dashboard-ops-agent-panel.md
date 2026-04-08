# EXECUTION BRIEF — Dashboard: Add Operations/Agent Panel + Doc Index

**Date:** 2026-04-08 | **To:** Code CLI (lc-bigclaw) | **Priority:** P1
**Addendum to:** `next-actions-apr08.md` (Dashboard Architecture v2)

---

## CONTEXT

Architecture v2 has Company (Mission Control + Executive Dashboard with 5 panels) + Product Lineup. Agent system was just fixed. New doc index created at `knowledge/AGENT_OPS_INDEX.md`. Dashboard needs to surface agent/cron/ops health.

---

## TASK 1 — Add Panel 6 to Executive Dashboard: Operations / Agent Health

The Executive Dashboard currently has 5 panels (Company Health, Market Intel, Product Summary, Engineering/SDLC, Finance). Add a 6th:

### Panel 6: Operations / Agent Health

| Row | Data | Source File |
|---|---|---|
| Agent status table | Name, role, model, last output time, green/red indicator | Parse `forge/docs/operations/PI5_AGENT_SYSTEM.md` (roster table) + check COO_INBOX.md for last entry per agent |
| Pi5 system health | Disk, memory, load, uptime | `forge/docs/operations/HEALTH.md` |
| OpenRouter balance | Current balance, daily spend, runway | `ops/DAILY_COSTS.md` (Rex writes) |
| Cron schedule | Job name, schedule, last exit code, status light | Parse `PI5_AGENT_SYSTEM.md` cron table + `ops/pi5/doc-freshness.md` for staleness |
| Overnight patrol | Last run time, goals completed count, key findings summary | `ops/OVERNIGHT_REPORT.md` |
| Agent quality trend | Sage self-scores over time (when data exists) | `growth/AGENT_SCORES.md` |

**Design:** Compact summary cards. Agent status as a row of colored dots (green = output in last 24h, amber = 24-48h, red = >48h or error). Pi5 vitals as a small gauge cluster. Cron jobs as a status light grid.

---

## TASK 2 — Add to Mission Control: Agent Controls + Cron Lights

Mission Control is the "act" page. Add:

### Agent Controls Section
- Visual status per agent (green/amber/red based on last output timestamp)
- Last output timestamp per agent
- Link to latest COO_INBOX.md entry for each agent

### Cron Health Lights
- One row per Mac cron job (overnight patrol, morning report, morning brain, RADAR × 3, extract lessons, autocommit)
- One row per Pi5 cron job (byte health × 2, koda github, sage market × 4, rex EOD, sage competitive, sage evolve, lumina brand)
- Each shows: green (exit 0 in last 24h) / red (exit non-zero or no run)
- Last run timestamp
- Source: Parse launchd status for Mac crons, `ops/pi5/doc-freshness.md` for Pi5 crons

### Overnight Patrol Status
- "Last patrol: 2026-04-08 02:00 — completed in 16 min"
- Link to `ops/OVERNIGHT_REPORT.md`
- Goals completed: X/Y
- Next patrol: tonight 2am

---

## TASK 3 — Render AGENT_OPS_INDEX.md as reference page

`knowledge/AGENT_OPS_INDEX.md` is the single map of the entire agent system. Make it accessible from the dashboard:

**Option A:** Add a "Documentation" or "Reference" link in the sidebar under Company → links to rendered AGENT_OPS_INDEX.md
**Option B:** Add a "View full agent docs" link at the bottom of the Operations panel

Either way, the doc index should render as a readable page (markdown tables rendered as HTML tables), not a raw markdown dump.

---

## DATA SOURCES (all via GitHub API, same as other panels)

| Dashboard Element | File Path | Writer | Frequency |
|---|---|---|---|
| Agent roster | `forge/docs/operations/PI5_AGENT_SYSTEM.md` | Code CLI | On change |
| Pi5 health | `forge/docs/operations/HEALTH.md` | Byte (bash) | 2x daily |
| OpenRouter costs | `ops/DAILY_COSTS.md` | Rex | Daily |
| Cron freshness | `ops/pi5/doc-freshness.md` | Bash script | Daily |
| Overnight report | `ops/OVERNIGHT_REPORT.md` | Overnight patrol | Daily 2am |
| Agent scores | `growth/AGENT_SCORES.md` | Sage | Per run |
| Agent reports | `forge/COO_INBOX.md` | All agents | Per cron |
| Doc index | `knowledge/AGENT_OPS_INDEX.md` | Consultant | On change |

---

## DO NOT

- Do NOT duplicate agent data — read from PI5_AGENT_SYSTEM.md (authoritative source)
- Do NOT build real-time SSH monitoring — all data comes from markdown files via GitHub API
- Do NOT block on missing AGENT_SCORES.md data — show "No scores yet" placeholder

## VERIFICATION

- [ ] Executive Dashboard has 6 panels (5 existing + Operations)
- [ ] Operations panel shows agent status dots, Pi5 vitals, OpenRouter balance
- [ ] Mission Control shows cron health lights (green/red per job)
- [ ] Mission Control shows overnight patrol status
- [ ] AGENT_OPS_INDEX.md accessible from dashboard as reference page
- [ ] All data from markdown files via GitHub API (no SSH, no real-time)
- [ ] ✅ STANDARD — can merge directly
