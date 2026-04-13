# BigClaw | Dashboard

## Active State (2026-04-13)

### Completed This Session
- **PR #149**: Release Pipeline V6 — one-line release summaries with V-G/V-C/V-M traffic lights
- **PR #150**: PRD column headers → V-G/V-C/V-M; Process page Dev Flow + Verification Gates
- **PR #151**: REHEARSAL previewUrl added (rehearsal-bigclaw.vercel.app)
- **PR #152**: Combined phone review checklist (VmGroupChecklist) for GrovaKid — 13 user-flow groups
- **PR #153**: sponsor → founder path mapping fixes; middleware INTERNAL_PREFIXES updated

### Open Specs (bigclaw-site domain)
- `docs/specs/DASHBOARD-V3-FINAL.md` — Path mapping audit, MICHAEL ONLY to close
- `docs/specs/dark-theme-landing-pages.md` — Login page done ✓, GrovaKid portion is lc-forge
- `docs/specs/product-landing-pages.md` — previewUrls mostly done; CORTEX retired

### Visual Snapshot Status
- `dashboard-infra-smoke-darwin.png` — updated 2026-04-13 (1280×1132px, production)
- All 16 Playwright smoke tests passing on CI

## Architecture Notes
- Dashboard reads data from GitHub APIs (bigclaw-ai, the-firm, axiom repos)
- Login at `/dashboard/login` — dark theme with animations, already complete
- Sponsor TODO route stays at `/dashboard/sponsor/todo` for URL compat (label now says "Founder")
- VmGroupChecklist: combined phone review checklist used by GrovaKid product page
