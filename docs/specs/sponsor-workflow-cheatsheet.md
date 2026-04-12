### 📋 2026-04-12 — Add Sponsor Workflow Cheat Sheet to Process Page

**Company:** BigClaw (bigclaw-site)
**What:** Add a "Sponsor Workflow" section at the TOP of the Process page with Michael's quick-reference commands for common scenarios.
**Why:** Michael needs a reference for the correct workflow phrases to avoid accidentally bypassing production gates. This happened twice today.
**Location:** `/dashboard/process` — first section, before PDLC Stages.

---

## Section: Sponsor Workflow (add at top of Process page)

Title: **Your Workflow — Quick Reference**
Subtitle: Commands for common scenarios. Copy-paste to any session.

### After Coding is Done

```
Step 1: "Push to main. Give me the preview URL."
        → Code pushes to main
        → Vercel creates preview URL (NOT production)
        → Code sends you the link

Step 2:  Review preview on your phone

Step 3a: "Approved. Merge main to release."
         → Code creates PR: main → release
         → Merges → production goes live

Step 3b: "Rejected. Fix [what's wrong]."
         → Code fixes, pushes to main again
         → New preview URL
```

### Starting a Session

```
"Read the briefing."
  → Consultant/Code reads SESSION_BRIEFING.md, catches up

"Read the briefing. I want to work on [specific task]."
  → Focused session on one topic
```

### Capturing Knowledge

```
Share link/image/screenshot to Telegram bot
  → Hermes saves it automatically
  → Graphify processes overnight
  → Query next day in Claude Code or Dashboard
```

### Reviewing PRD Progress

```
Open Dashboard → [Product] page
  → Develop: code written (Code's claim)
  → CI Test: automated tests pass
  → Flow Test: Gemini browser test (daily 6am)
  → Code Review: Consultant audit (monthly)
  → User Test: your phone review (production gate)
```

### Money / Legal / Judgment Gates

```
"I approved [item] in FOUNDER_TODO.md"
  → Code reads the file and executes

"Add [item] to FOUNDER_TODO.md"
  → Consultant writes the gate entry
```

### Never Say

| Don't Say | Why | Say Instead |
|-----------|-----|------------|
| "Push to release" | Bypasses preview review | "Push to main. Give me the preview URL." |
| "Deploy to production" | Same — skips the gate | "Approved. Merge main to release." |
| "Just merge it" | No review step | "Give me the preview URL first." |
| "Push to both branches" | Release goes live unreviewed | "Push to main only." |

---

## Design Notes

- Use a card/panel style with a distinct background (not the same as SDLC tables below)
- "Never Say" table should have red/green color coding (red = don't, green = do instead)
- Keep it compact — this is a quick-reference, not documentation
- Collapsible sections so it doesn't dominate the page when not needed
