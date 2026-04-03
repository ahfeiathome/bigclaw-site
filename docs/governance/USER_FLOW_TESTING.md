# BigClaw Dashboard — Production User Flow Testing Standard

**Created:** 2026-03-28
**Owner:** CEO (spec), Code CLI (implementation + execution)
**Status:** ACTIVE — applies to every deploy and every session

## Purpose

This document defines the critical user flow tests for the BigClaw executive dashboard. The dashboard is an internal operator tool — Michael is the primary user. Tests verify that every page renders real data (not placeholders, not stale data, not blank sections) and that navigation works end-to-end.

## When Tests Must Run

Every PR to main: the @smoke suite runs in GitHub Actions CI. After every production deploy: Code runs smoke tests against bigclaw-site.vercel.app and visually verifies. Every session start: Code checks last CI run results. If E2E tests failed, fix them BEFORE new work.

## The 8 Critical User Flows

### @smoke — Run on every push (4 flows)

**Flow 1: Login + Dashboard Access** — Navigate to /dashboard → verify redirect to /dashboard/login → enter password → submit → verify redirect to /dashboard → verify Overview page renders with metric cards and Felix Heartbeat section. Catches: broken auth, blank dashboard, login failures.

**Flow 2: All Pages Load with Data** — Navigate to each sidebar page (/dashboard, /dashboard/projects, /dashboard/radar, /dashboard/finance, /dashboard/infra, /dashboard/bizdev) → verify each page renders content (not blank, not error state) → verify page title matches route. Catches: broken routes, 404 pages, empty states on data-driven pages.

**Flow 3: RADAR Page Data Integrity** — Navigate to /dashboard/radar → verify "PAPER MODE" badge visible → verify equity metric card shows a dollar amount (not "--") → verify positions count is a number → verify equity curve chart renders. Catches: stale RADAR data, broken API, missing chart.

**Flow 4: Finance Page Data Integrity** — Navigate to /dashboard/finance → verify cost breakdown shows project names with dollar amounts → verify free tier usage section renders with progress bars → verify budget table shows numbers (not placeholders). Catches: broken FINANCE.md parsing, stale data, rendering bugs.

### Full suite — Run on PRs to main (additional 4 flows)

**Flow 5: Open Issues + GitHub Integration** — Navigate to /dashboard → scroll to Open Issues section → verify issue cards render with repo name, issue number, and title → verify "Board →" link points to GitHub Projects URL → verify priority badges (P1/P2) are visible. Catches: broken GitHub API integration, stale issue data.

**Flow 6: Infrastructure Panel** — Navigate to /dashboard → verify Infrastructure section shows Mac disk, Pi5 uptime, git sync status → verify all health indicators show values (not "--") → verify Telegram loop and git-sync script show "Active" status. Catches: broken patrol report parsing, stale infra data.

**Flow 7: Sidebar Navigation** — Click each sidebar link sequentially (Overview → Projects → RADAR → Finance → Infra → Growth) → verify URL changes to correct route → verify page content changes → verify active state highlights correct sidebar item. Catches: broken navigation, stale router state, incorrect active highlighting.

**Flow 8: Visual Regression** — Screenshot each page (overview, projects, radar, finance, infra, growth) → compare against baseline → flag if diff >5%. Catches: unintended visual changes between deploys.

## Implementation Architecture

File structure follows the same pattern as learnie-ai: tests/e2e/flows/ contains one spec file per flow, tests/e2e/pages/ contains Page Object Model files, tests/e2e/fixtures/ contains baseline screenshots. Auth helper handles programmatic login (set session cookie directly, only test login UI in Flow 1).

## Key Differences from Learnie

The BigClaw dashboard is a data rendering surface, not a user interaction product. Most tests verify that data renders correctly (not blank, not placeholder, not stale) rather than testing interactive workflows. The critical failure mode is "page renders but shows wrong/missing data" — which is exactly what CI can't catch but visual E2E tests can.

Dashboard password auth is simpler than Learnie's Auth0 — a single password field. Programmatic auth sets the session cookie directly for all tests except Flow 1.

## Definition of Done (for any BigClaw dashboard feature)

A feature is DONE when: code is written and committed, unit tests pass, E2E smoke tests pass against production, visual regression shows no unexpected changes, the feature is visible and correct on the LIVE production URL (bigclaw-site.vercel.app/dashboard), and screenshot evidence is attached to the GitHub Issue.

## References

- Playwright visual comparison: https://playwright.dev/docs/test-snapshots
- Build-to-Production Flow: see company/agents/CODE.md
- Release Process: see company/docs/governance/RELEASE_PROCESS.md
