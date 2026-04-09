# EXECUTION BRIEF — Dashboard: Development Flow Chart with Tooltips

**Date:** 2026-04-09 | **To:** Code CLI (lc-bigclaw) | **Priority:** P2
**Context:** Consultant created an interactive SVG flowchart showing the unified development flow (MRD → PRD → Test Matrix → TDD → CI → Gemini → Verified). Michael wants this on the dashboard with mouseover tooltips.

---

## WHAT TO BUILD

### New page: Company → Development Flow

Add a new sidebar item under COMPANY:
```
COMPANY
  Mission Control
  Executive Dashboard
  Agent Team
  Development Flow  ← NEW
```

Route: `/dashboard/development-flow`

### Page content

An interactive SVG/React flowchart showing the complete pipeline with 5 phases:

```
S1-S2 Research → S3 Design → S4 Build (TDD) → S5+ Verify → Bug → Regression
```

### Tooltip on hover

Each box shows a tooltip on mouseover with:
- **What this is** (1 sentence)
- **File path** (the actual .md file)
- **Who creates it** (Consultant, Code CLI, Sage, Gemini, Michael)
- **Current status** for GrovaKid (e.g., "54% complete" for PRD Checklist)

### Box definitions for tooltips

| Box | Tooltip Title | Description | File | Creator |
|---|---|---|---|---|
| S1 research | Competitive research | Market landscape, competitor analysis, opportunities | `docs/product/S1_COMPETITIVE_RESEARCH.md` | Sage + Consultant |
| S2 define | Market requirements | What to build and why. Target user, pricing, positioning | `docs/product/S2_MRD.md` | Consultant |
| Competitive log | Competitive updates | Ongoing competitor monitoring, weekly Sage refresh | `docs/product/COMPETITIVE_LOG.md` | Sage weekly |
| PRD checklist | Product requirements | Item-by-item list of what to build, with Done/In Progress status | `docs/product/PRD_CHECKLIST.md` | Consultant + Code |
| PRD test matrix | Verification map | How to verify each PRD item: test type, method, inputs, expected result | `docs/product/PRD_TEST_MATRIX.md` | Consultant (derived from PRD) |
| /brainstorm | Design exploration | Explore context, ask questions, propose 2-3 approaches, save design spec | `docs/specs/<feature>.md` | Code or Gemini |
| /write-plan | Implementation plan | Break into bite-sized TDD tasks (2-5 min each) mapped to PRD items | `docs/specs/<feature>-plan.md` | Code or Gemini |
| /execute-plan | TDD execution | Run tasks: write failing test → implement → refactor → commit | Updates PRD_CHECKLIST.md + PRD_TEST_MATRIX.md | Code or Gemini |
| TDD cycle | Test-driven development | RED: write failing test. GREEN: minimal code to pass. REFACTOR: clean up. COMMIT. | Test files in `tests/` or `src/**/__tests__/` | Code or Gemini |
| CI regression | Automated testing | Every PR: lint, types, unit tests, E2E tests against Vercel preview | GitHub Actions `ci.yml` | Automated |
| Gemini validation | Browser testing | 6am daily: browser-tests live site via Playwright MCP from PRD Test Matrix | `ops/gemini/VALIDATION_REPORT.md` | Gemini CLI (automated) |
| Michael review | Manual review | Walk through live site on phone, check UX, verify features feel right | `docs/product/PRD_REVIEW_CHECKLIST.md` | Michael |
| Verified | Confirmed working | All three (CI + Gemini + Michael) passed. PRD Test Matrix shows ✅ | `docs/product/PRD_TEST_MATRIX.md` Verified column | All |
| Bug found | Issue discovered | Bug caught by any verification layer | GitHub Issues | Anyone |
| Regression row | Permanent test added | New test row in matrix — tests never deleted, matrix only grows | `docs/product/PRD_TEST_MATRIX.md` new row | Code |

### Implementation approach

Use React component with inline SVG (same structure as the flowchart I just created). Add hover state via React `onMouseEnter`/`onMouseLeave` with a tooltip `<div>` that appears near the cursor.

```tsx
const [tooltip, setTooltip] = useState(null);

const boxes = [
  { id: 's1', x: 80, y: 40, w: 180, h: 56, label: 'S1 research', 
    file: 'docs/product/S1_COMPETITIVE_RESEARCH.md',
    desc: 'Market landscape, competitor analysis',
    creator: 'Sage + Consultant' },
  // ... all boxes from table above
];

// On hover, show tooltip near box
<g onMouseEnter={() => setTooltip(box)} onMouseLeave={() => setTooltip(null)}>
  <rect ... />
  <text ... />
</g>

{tooltip && (
  <div className="tooltip" style={{ left: tooltip.x, top: tooltip.y + tooltip.h + 10 }}>
    <strong>{tooltip.label}</strong>
    <p>{tooltip.desc}</p>
    <code>{tooltip.file}</code>
    <span>Creator: {tooltip.creator}</span>
  </div>
)}
```

### Live data integration (optional enhancement)

For GrovaKid specifically, the tooltip could show live status by reading the actual files:
- PRD Checklist: "33/61 Done (54%)"
- PRD Test Matrix: "12/33 Verified (36%)"
- Last Gemini run: "2026-04-09 06:12 — 8/10 passed"
- CI: "437 tests passing"

This is a stretch goal — static tooltips with file paths are the MVP.

### Link to Obsidian

The flow chart is documented at `knowledge/UNIFIED_DEV_FLOW.md`. Add a "View documentation" link at the bottom of the page that opens this file (or renders it inline as markdown).

---

## ALSO: Add this chart reference to existing pages

### Per-product page
At the top of each product page, add a small "View development flow →" link that navigates to `/dashboard/development-flow`. Helps Michael understand what each section (Market, PDLC, SDLC, Issues, Finance) corresponds to in the pipeline.

### TESTING_STANDARD.md in Obsidian
The `knowledge/TESTING_STANDARD.md` file documents the full pipeline. This dashboard page is the visual version of that same doc. Both should stay in sync.

---

## VERIFICATION

- [ ] `/dashboard/development-flow` page exists and renders the flowchart
- [ ] Sidebar shows "Development Flow" under COMPANY
- [ ] Hover over any box shows tooltip with description + file path + creator
- [ ] Color coding matches: gray (research), purple (PRD), teal (coding), amber (TDD), blue (CI), green (Gemini), coral (Michael)
- [ ] "View documentation" link at bottom opens UNIFIED_DEV_FLOW.md
- [ ] ✅ STANDARD — can merge directly
