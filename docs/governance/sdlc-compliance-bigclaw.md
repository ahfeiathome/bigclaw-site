# EXECUTION BRIEF — SDLC Compliance: bigclaw-site Hooks + CI

**Date:** 2026-04-06 | **To:** Code CLI (lc-bigclaw) | **Priority:** P0
**Status:** MANDATORY — Execute immediately. Do not defer. Do not skip steps.

## SITUATION

bigclaw-site has ZERO hooks — no .claude/settings.json, no code review, CLAUDE.md is 1 line. It is the most exposed session. Every other session has at least partial gating. This session has none.

## EXECUTION STEPS

### STEP 1: Create .claude/settings.json with full hook suite

Create `.claude/settings.json` matching the patterns in learnie-ai and axiom:

1. **SessionStart hook:** print unprocessed specs (`find . -path "*/docs/specs/*.md" -not -path "*/done/*"`), P0 issues (`gh issue list --label P0`), pipeline reminder
2. **PreToolUse (Bash):** block `vercel --prod`, block `git push origin main`, run `tsc --noEmit` + `npx vitest run` before any `git push` — block if any fail
3. **PostToolUse (Write|Edit):** auto `tsc --noEmit` after any .ts/.tsx edit
4. **Stop hook:** auto-commit, run tests, only push if tests pass, write session log to `~/Projects/bigclaw-ai/knowledge/sessions/`

Reference implementations:
- learnie-ai: `~/Projects/bigclaw-ai/forge/learnie-ai/.claude/settings.json`
- axiom: `~/Projects/bigclaw-ai/axiom/.claude/settings.json`

**DONE means:** All 4 hook types installed. Demonstrate: introduce a deliberate type error → `git push` blocked → revert. Session log written on stop.
**NOT DONE means:** "Settings file created" without testing each hook fires.

### STEP 2: Update CLAUDE.md

Current CLAUDE.md is 1 line: `# BigClaw | Dashboard`. Expand with project overview, available commands, architecture notes, and key rules. Reference learnie-ai/CLAUDE.md for structure.

**DONE means:** CLAUDE.md has project overview, commands section, architecture notes.

### STEP 3: Add CI + Code Review workflows

1. Copy `claude-review.yml` from learnie-ai to `.github/workflows/`
2. Create/adapt `ci.yml` for bigclaw-site (tsc + build + playwright)
3. Open a test PR to verify both run

**DONE means:** PR opened, Claude Code Review comment appears, CI pipeline runs green.
**NOT DONE means:** "Workflow file added" without test PR proof.

### STEP 4: Verify parity + update SDLC docs

After steps 1-3, verify all hooks fire correctly, then update:
1. `~/Projects/bigclaw-ai/knowledge/SDLC_GATES_MATRIX.md` — bigclaw-site columns all ✅
2. Verify dashboard `/dashboard/sdlc/gates` reflects changes

**DONE means:** Gates matrix updated AND dashboard verified live.

## DO NOT

- Do NOT skip hook testing — each hook must be triggered and proven to work
- Do NOT copy settings.json verbatim — adapt paths for bigclaw-site
- Do NOT mark DONE without screenshots of hooks blocking

## VERIFICATION

- [ ] .claude/settings.json exists with SessionStart, PreToolUse, PostToolUse, Stop
- [ ] `git push` with failing test is blocked (screenshot)
- [ ] CLAUDE.md has real content
- [ ] CI + Claude Code Review run on PRs (screenshot)
- [ ] SDLC_GATES_MATRIX.md updated for bigclaw-site
