# EXECUTION BRIEF — Mission Control Redesign (Michael's Control Panel)

**Company:** BigClaw (lc-bigclaw) | **Date:** 2026-04-10
**Priority:** P1
**Status:** MANDATORY — Dashboard should reflect Michael's actual role.

## SITUATION

Mission Control currently has links to GitHub PRs and asks Michael to review code.
Michael's role is ONLY: 💳 money actions + 🧠 production deploy approval via preview URL.
The dashboard should be a CONTROL PANEL, not a developer tool.

## TARGET: Mission Control Sections (top to bottom, mobile-first)

### Section 1: PRODUCTION DEPLOY APPROVALS (top of page, most important)
**What:** Cards for each product awaiting production deploy approval.
**Each card shows:**
- Product name + what changed (summary from FOUNDER_TODO.md gate entry)
- Test status: "628/628 tests passing" (green badge)
- "OPEN PREVIEW" button → opens the Vercel preview URL (Michael checks on phone)
- "✅ APPROVE" button → writes "✅ APPROVED — Michael [date]" to FOUNDER_TODO.md
- "❌ REJECT" button → prompts for reason, writes "❌ REJECTED — [reason]" to FOUNDER_TODO.md
- Mobile screenshot thumbnails (if provided by Felix)
**Source:** Parse PRODUCTION GATE entries from FOUNDER_TODO.md
**When empty:** "No deploys awaiting approval. ✅"
**API needed:** POST /api/controls/approve — writes approval to FOUNDER_TODO.md via git commit

### Section 2: 💳 MONEY ACTIONS (Michael's physical TODO)
**What:** Interactive checklist of 💳/⚖️ items from FOUNDER_TODO.md
**Each item shows:**
- Description, type badge (💳/⚖️/🧠), what it unblocks
- Checkbox to mark DONE (writes to FOUNDER_TODO.md)
- Priority based on what it unblocks (Apple Dev $99 unblocks 5 products = top)
**Source:** Parse FOUNDER_TODO.md for 💳/⚖️/🧠 items
**API needed:** POST /api/controls/complete-gate — marks item done in FOUNDER_TODO.md

### Section 3: PRODUCT STATUS (view only, compact)
**What:** One row per product showing:
- Name + stage (from REGISTRY.md)
- Live URL green/red dot (existing ProductHealthGrid)
- PRD completion % (from PRD_CHECKLIST.md)
- Test count + pass rate
- Current blocker (if any)
**This replaces:** Product Health Grid, PDLC pipeline, Production Gates table (all merged)

### Section 4: SYSTEM HEALTH (view only, compact)
**What:**
- Cron job lights (existing CronHealthLights — keep)
- Cost trend chart (existing — keep)
- Agent status dots (existing — keep, move up from bottom)
- Session status: which lc-xxx sessions are active, what they're working on
  (Source: ops/ACTIVE_SESSIONS.md)
- Sanity check status: "Last sanity check: 1am today — 7/7 pass ✅"
  (Source: ops/SANITY_CHECK.md)

### Section 5: INTELLIGENCE (view only, compact)
**What:**
- Morning report summary (existing — keep)
- Market intelligence highlights (existing — keep)
- Issues trend chart (FIX: X-axis starts from first issue date, not Jan 9)

### Section 6: QUICK ACTIONS (redesigned)
**Remove:** Open PRs, GrovaKid Issues, Vercel Deploys (all GitHub/Vercel — not Michael's job)
**Keep:** Sponsor Gates link
**Add:**
- "📱 Preview: GrovaKid" → direct link to learnie-ai preview URL
- "📱 Preview: FairConnect" → direct link to fairconnect preview URL
- "📱 Preview: iris-studio" → direct link to iris-studio preview URL
- "📊 RADAR Dashboard" → keep (Michael monitors trading)
- "📋 Morning Report" → opens ops/MORNING_REPORT.md rendered
- "💡 Ideas Backlog" → opens knowledge/IDEAS_BACKLOG.md rendered

## WHAT TO REMOVE FROM MISSION CONTROL

| Remove | Why |
|--------|-----|
| "Review PR →" links | Michael never reviews PRs |
| "Open PRs" quick action | Michael never goes to GitHub |
| "GrovaKid Issues" quick action | Issues are Felix's job |
| "Vercel Deploys" quick action | Deploys are Felix's job |
| "Access Control" quick action | Settings, not mission control |
| Production Gates static table | Replaced by interactive approval cards |

## API ENDPOINTS NEEDED

### POST /api/controls/approve
```json
{
  "product": "grovakid",
  "action": "approve" | "reject",
  "reason": "optional rejection reason"
}
```
- Reads FOUNDER_TODO.md
- Finds the PRODUCTION GATE entry for the product
- Appends "✅ APPROVED — Michael [date]" or "❌ REJECTED — [reason]"
- Git commits the change
- Returns success

### POST /api/controls/complete-gate
```json
{
  "item_id": "12",
  "type": "stripe-keys"
}
```
- Marks a 💳/⚖️ item as done in FOUNDER_TODO.md
- Git commits

### GET /api/controls/pending
- Parses FOUNDER_TODO.md for all PRODUCTION GATE entries without APPROVED/REJECTED
- Returns array of pending gates with: product, summary, preview URL, test status

### GET /api/controls/todo
- Parses FOUNDER_TODO.md for all 💳/⚖️/🧠 items
- Returns array with: description, type, unblocks, done status

## VERIFICATION
- [ ] No GitHub links visible on Mission Control
- [ ] APPROVE/REJECT buttons work and write to FOUNDER_TODO.md
- [ ] 💳 checklist items are interactive (can mark done)
- [ ] Preview URLs open directly (no GitHub intermediate)
- [ ] Issues trend X-axis starts from first issue creation date
- [ ] Mobile-friendly: all buttons tappable on iPhone
