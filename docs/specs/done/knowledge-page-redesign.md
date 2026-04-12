### 📋 2026-04-12 — Dashboard Knowledge Page Redesign

**Company:** BigClaw (bigclaw-site)
**What:** Redesign the Knowledge page (`/dashboard/knowledge`, currently at `/dashboard/help`) to render Graphify output — interactive knowledge graph, key insights, capture activity, and source browser.
**Why:** The Knowledge page currently shows static documentation links. With Graphify + Hermes Capture, it becomes a live intelligence hub showing what Michael captures daily and how it connects to the product portfolio.
**Data source:** `graphify-out/` directory in bigclaw-ai repo (graph.html, GRAPH_REPORT.md, graph.json)
**Full flow doc:** `knowledge/KNOWLEDGE_CAPTURE_FLOW.md`

---

## Page Layout (top to bottom)

### Section 1: Capture Activity (header stats)

```
Knowledge Hub
48 items captured | Last: "Khanmigo price drop" — 2 hours ago | This week: 12

[Capture trend mini-chart — daily count, 30 days, simple bar/sparkline]
```

Data source: count files in `capture/` directory, read latest filename for title + timestamp.

### Section 2: Key Insights (from GRAPH_REPORT.md)

Parse GRAPH_REPORT.md and render:

**God Nodes** (top 5-10 most connected concepts):
```
🔴 adaptive learning (23 connections)
🟠 COPPA compliance (18 connections)
🟡 ed-tech pricing (15 connections)
🟢 worksheet generation (12 connections)
🔵 scan-and-grade (9 connections)
```

Each god node is clickable → expands to show its connections.

**Recent Discoveries** (new connections from latest captures):
```
NEW: "Khanmigo $2/mo pricing" connects to → GrovaKid POSITIONING_BRIEF.md
NEW: "COPPA enforcement" connects to → FairConnect event data handling
```

**Suggested Questions** (auto-generated from graph structure):
```
? "What connects ed-tech pricing pressure to retention strategies?"
? "How do competitor COPPA approaches differ from GrovaKid's?"
? "What patterns connect the articles captured this week?"
```

Each question is clickable → sends as a query to Claude Code or opens in chat.

### Section 3: Knowledge Graph (interactive embed)

Embed `graphify-out/graph.html` in an iframe or render a simplified version:
- Nodes = concepts (sized by connection count)
- Edges = relationships (colored by confidence: green=EXTRACTED, yellow=INFERRED, red=AMBIGUOUS)
- Communities = color clusters (auto-detected by Leiden algorithm)
- Click a node → see connected nodes + source files
- Search bar → find specific concepts
- Filter by community, confidence level, or source type

If embedding graph.html is too complex initially, render a static version:
- List communities with their top concepts
- Show connection counts
- Link to open full graph.html in a new tab

### Section 4: Knowledge by Product

Map captures to products via graph communities:

```
GrovaKid        12 articles  3 competitor reports  5 screenshots
FairConnect      4 articles  1 industry report     0 screenshots
fatfrogmodels    2 articles  0 reports             1 screenshot
iris-studio      1 article   0 reports             3 images
RADAR            6 articles  2 market reports      0 screenshots
General          8 articles  1 report              2 screenshots
```

Data source: parse graph.json communities, match to product keywords.

### Section 5: Source Browser

Chronological list of all captures:

```
Date        | Type     | Title                                    | Connections
2026-04-12  | Article  | Khanmigo slashes family plan to $2/mo    | 8
2026-04-12  | PDF      | COPPA enforcement update Q2 2026         | 5
2026-04-11  | Screenshot| Frizzle.ai landing page comparison      | 3
2026-04-11  | Note     | Ideas for parental co-pilot daily brief  | 6
```

- Click title → open source file (in Obsidian or raw)
- Filter by: date range, type (article/image/PDF/note), product
- Sort by: date (default), connections (most connected first)

---

## Navigation Update

Rename sidebar link:
- Current: "Knowledge" → `/dashboard/help`
- New: "Knowledge" → `/dashboard/knowledge`

Keep `/dashboard/help` as a redirect to `/dashboard/knowledge` for backwards compatibility.

---

## Data Fetching

The dashboard fetches from the bigclaw-ai repo via GitHub API:

| Data | File | Fetch Method |
|------|------|-------------|
| Capture count | `capture/` directory listing | GitHub Contents API |
| Key insights | `graphify-out/GRAPH_REPORT.md` | GitHub Raw content |
| Graph visualization | `graphify-out/graph.html` | GitHub Raw content or iframe |
| Graph data | `graphify-out/graph.json` | GitHub Raw content |
| Source list | `capture/` directory listing with metadata | GitHub Contents API |

Cache: 5 min revalidation (same as other dashboard pages).

---

## Before Graphify is Running

If graphify-out/ doesn't exist yet (Graphify not installed), show:

```
Knowledge Hub
No knowledge graph built yet.

Setup: Install Graphify and run your first build.
See: knowledge/KNOWLEDGE_CAPTURE_FLOW.md

[Link to documentation]
```

Don't show a broken or empty page — graceful fallback.
