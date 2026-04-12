### 📋 2026-04-12 — Add Knowledge Flow to Process Page

**Company:** BigClaw (bigclaw-site)
**What:** Add a "Knowledge Flow" section to the Process page showing how intelligence enters the system, gets processed, and surfaces.
**Where:** `/dashboard/process` — after the Development Flow section, before Dashboard Reference.
**Data source:** `knowledge/KNOWLEDGE_CAPTURE_FLOW.md`

---

## Section: Knowledge Flow

Title: **Knowledge Flow**
Subtitle: How intelligence enters the system, gets processed, and surfaces for decisions.

### Flow Diagram (same visual style as Development Flow)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   CAPTURE   │ ──→ │   PROCESS   │ ──→ │    STORE    │ ──→ │    QUERY    │ ──→ │   SURFACE   │
│             │     │             │     │             │     │             │     │             │
│ Phone →     │     │ Graphify    │     │ Obsidian    │     │ Claude Code │     │ Dashboard   │
│ Telegram/WA │     │ daily 5am   │     │ Filesystem  │     │ Gemini CLI  │     │ Knowledge   │
│             │     │             │     │             │     │ Terminal    │     │ page        │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       ↑                   ↑
       │                   │
┌──────┴──────┐     ┌──────┴──────┐
│ Sage Intel  │     │ Graphify    │
│ Monday 6am  │     │ indexes ALL │
│ 3 lanes     │     │ sources     │
└─────────────┘     └─────────────┘
```

### Two Input Channels (render as parallel paths feeding into PROCESS)

| Channel | Source | What It Captures | When | Output Location |
|---------|--------|-----------------|------|-----------------|
| **Michael Capture** | Telegram/WhatsApp bot | Articles, screenshots, posts, PDFs, notes from phone | Real-time (on share) | `capture/` |
| **Sage Intelligence** | Pi5 agent (automated) | Competitor moves, trending tools, market opportunities | Monday 6am | `knowledge/` + per-product `COMPETITIVE_LOG.md` |

### Sage's Three Intelligence Lanes

| Lane | What It Scouts | Output File | Status |
|------|---------------|-------------|--------|
| Product Competitors | Direct competitors per product (Khanmigo, Frizzle, IXL) | `<repo>/docs/product/COMPETITIVE_LOG.md` | ✅ Active (Monday 6am) |
| Tools & Infrastructure | GitHub Trending tools for operations (agent frameworks, dev tools, knowledge mgmt) | `knowledge/TOOL_INTELLIGENCE.md` | 🔒 Locked — unlocks after 3 clean Monday runs |
| Market Opportunities | Industry trends, unserved niches, partnership signals | `knowledge/MARKET_OPPORTUNITIES.md` | 🔒 Locked — unlocks after 3 clean Monday runs |

### Processing (Graphify)

| Step | What Happens | When |
|------|-------------|------|
| Scan | Graphify checks `capture/` and `knowledge/` for new/changed files | Daily 5am cron |
| Extract | AST parsing (code), Claude vision (images/PDFs), text analysis (articles) | Same run |
| Connect | Leiden algorithm clusters concepts, finds god nodes, tags confidence | Same run |
| Output | `graph.html` + `GRAPH_REPORT.md` + `graph.json` → Dashboard + Obsidian | Same run |

### What Surfaces (on Dashboard Knowledge page)

| Section | What It Shows |
|---------|-------------|
| **God Nodes** | Most connected concepts — what ties your knowledge together |
| **Surprising Connections** | Cross-product, cross-source links you didn't expect |
| **Suggested Questions** | Auto-generated prompts from graph structure |
| **Knowledge by Product** | Which captures relate to which product |
| **Capture Activity** | Items captured, trend chart, last capture timestamp |

### How AI Tools Use the Graph

| Tool | How It Connects | Benefit |
|------|----------------|---------|
| Claude Code | Reads `GRAPH_REPORT.md` before searching files | 71.5x fewer tokens per query |
| Gemini CLI | BeforeTool hook injects graph awareness | Navigates by structure, not grep |
| Consultant | Reads graph at session start | Strategic recommendations informed by all captured intel |
| Dashboard | Renders graph.html + GRAPH_REPORT.md | Visual knowledge hub for Sponsor |

### Hover descriptions (for the flow diagram boxes)

| Box | Description | File Path | Creator |
|-----|------------|-----------|---------|
| CAPTURE | Share links, screenshots, notes from phone to Telegram bot. Hermes saves metadata to filesystem. Near-zero token cost. | `capture/YYYY-MM-DD-[title].md` | Hermes Capture agent |
| SAGE INTEL | Automated competitive research + tool scouting + market trends. Three lanes, Monday 6am. | `knowledge/TOOL_INTELLIGENCE.md`, `COMPETITIVE_LOG.md` | Sage (Pi5 agent) |
| PROCESS | Graphify indexes all sources daily. Builds knowledge graph with communities, god nodes, confidence-tagged relationships. | `graphify-out/` | Graphify (5am cron) |
| STORE | Obsidian vault at ~/Projects/bigclaw-ai/. All files browsable with backlinks. Git-backed, version controlled. | `~/Projects/bigclaw-ai/` | Filesystem |
| QUERY | Any AI tool queries the graph instead of reading raw files. 71.5x token savings. | `/graphify query "..."` | Claude Code, Gemini CLI |
| SURFACE | Dashboard Knowledge page renders god nodes, connections, capture activity. Interactive graph visualization. | `/dashboard/knowledge` | BigClaw Dashboard |
