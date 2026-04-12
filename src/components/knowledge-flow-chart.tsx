'use client';

import { useState } from 'react';

interface KBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  sublabel?: string;
  phase: string;
  file?: string;
  desc: string;
  creator: string;
}

const PHASE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  capture: { fill: '#042f2e', stroke: '#0d9488', text: '#2dd4bf' },
  sage:    { fill: '#1e1b4b', stroke: '#8b5cf6', text: '#a78bfa' },
  process: { fill: '#1c1400', stroke: '#d97706', text: '#fbbf24' },
  store:   { fill: '#0c1a2e', stroke: '#3b82f6', text: '#60a5fa' },
  query:   { fill: '#052e16', stroke: '#10b981', text: '#34d399' },
  surface: { fill: '#052e16', stroke: '#22c55e', text: '#4ade80' },
  michael: { fill: '#2d0a0a', stroke: '#f43f5e', text: '#fb7185' },
};

// Row 1 (y=55): main pipeline — CAPTURE → PROCESS → STORE → QUERY → SURFACE
// Row 2 (y=195): input channels — Michael Capture + Sage Intel
const BOXES: KBox[] = [
  { id: 'capture', x: 30,  y: 55,  w: 150, h: 56,
    label: 'CAPTURE', sublabel: 'Phone → Telegram/WA',
    phase: 'capture',
    file: 'capture/YYYY-MM-DD-[title].md',
    desc: 'Share links, screenshots, notes from phone to Telegram bot. Hermes saves metadata to filesystem. Near-zero token cost.',
    creator: 'Hermes Capture agent' },
  { id: 'process', x: 215, y: 55,  w: 165, h: 56,
    label: 'PROCESS', sublabel: 'Graphify daily 5am',
    phase: 'process',
    file: 'graphify-out/',
    desc: 'Graphify indexes all sources daily. Builds knowledge graph with communities, god nodes, confidence-tagged relationships.',
    creator: 'Graphify (5am cron)' },
  { id: 'store',   x: 415, y: 55,  w: 145, h: 56,
    label: 'STORE', sublabel: 'Obsidian Filesystem',
    phase: 'store',
    file: '~/Projects/bigclaw-ai/',
    desc: 'Obsidian vault at ~/Projects/bigclaw-ai/. All files browsable with backlinks. Git-backed, version controlled.',
    creator: 'Filesystem' },
  { id: 'query',   x: 595, y: 55,  w: 165, h: 56,
    label: 'QUERY', sublabel: 'Claude Code · Gemini',
    phase: 'query',
    file: '/graphify query "..."',
    desc: 'Any AI tool queries the graph instead of reading raw files. 71.5× token savings.',
    creator: 'Claude Code, Gemini CLI' },
  { id: 'surface', x: 795, y: 55,  w: 160, h: 56,
    label: 'SURFACE', sublabel: 'Dashboard Knowledge',
    phase: 'surface',
    file: '/dashboard/knowledge',
    desc: 'Dashboard Knowledge page renders god nodes, connections, capture activity. Interactive graph visualization.',
    creator: 'BigClaw Dashboard' },

  // Row 2 — input channels
  { id: 'michael', x: 30,  y: 195, w: 150, h: 56,
    label: 'Michael Capture', sublabel: 'Real-time (on share)',
    phase: 'michael',
    file: 'capture/YYYY-MM-DD-[title].md',
    desc: 'Share links, screenshots, notes from phone via Telegram/WhatsApp bot. Hermes agent saves metadata to capture/ directory.',
    creator: 'Michael (via phone)' },
  { id: 'sage',    x: 215, y: 195, w: 165, h: 56,
    label: 'Sage Intel', sublabel: 'Monday 6am · 3 lanes',
    phase: 'sage',
    file: 'knowledge/TOOL_INTELLIGENCE.md, COMPETITIVE_LOG.md',
    desc: 'Automated competitive research + tool scouting + market trends. Three lanes, Monday 6am. Lanes 2–3 locked pending 3 clean runs.',
    creator: 'Sage (Pi5 agent)' },
];

// Arrows: [fromId, toId, dashed]
const ARROWS: [string, string, boolean][] = [
  ['capture', 'process', false],
  ['process', 'store',   false],
  ['store',   'query',   false],
  ['query',   'surface', false],
  ['michael', 'capture', true],
  ['sage',    'process', true],
];

const BOX_MAP = Object.fromEntries(BOXES.map(b => [b.id, b]));

function arrowPath(from: KBox, to: KBox): string {
  // Horizontal (same row): right edge → left edge
  if (Math.abs(from.y - to.y) < 5) {
    const x1 = from.x + from.w;
    const y  = from.y + from.h / 2;
    const x2 = to.x;
    return `M ${x1} ${y} L ${x2} ${y}`;
  }
  // Vertical (same column, going up): top edge of from → bottom edge of to
  if (Math.abs((from.x + from.w / 2) - (to.x + to.w / 2)) < 10) {
    const x  = from.x + from.w / 2;
    const y1 = from.y;           // top of input box
    const y2 = to.y + to.h;     // bottom of pipeline box
    return `M ${x} ${y1} L ${x} ${y2}`;
  }
  // Fallback elbow
  const fromCx = from.x + from.w / 2;
  const toCx   = to.x   + to.w   / 2;
  return `M ${fromCx} ${from.y} L ${fromCx} ${to.y + to.h} L ${toCx} ${to.y + to.h}`;
}

function BoxLabel({ box, colors }: { box: KBox; colors: { fill: string; stroke: string; text: string } }) {
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  return (
    <>
      <text x={cx} y={cy - 5} textAnchor="middle" fill={colors.text}
        fontSize="11" fontFamily="monospace" fontWeight="700">
        {box.label}
      </text>
      {box.sublabel && (
        <text x={cx} y={cy + 10} textAnchor="middle" fill={colors.text}
          fontSize="9" fontFamily="monospace" opacity="0.7">
          {box.sublabel}
        </text>
      )}
    </>
  );
}

export function KnowledgeFlowChart() {
  const [tooltip, setTooltip] = useState<KBox | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <div
      className="relative"
      onMouseMove={(e) => setMousePos({ x: e.clientX + 16, y: e.clientY + 16 })}
    >
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 990 295"
          className="w-full min-w-[800px]"
          style={{ height: 'auto', minHeight: '280px' }}
        >
          <defs>
            <marker id="kaf" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
            </marker>
          </defs>

          {/* Phase section labels */}
          <text x="107" y="34" textAnchor="middle" fill="#0d9488" fontSize="9" fontFamily="sans-serif" letterSpacing="1">CAPTURE</text>
          <text x="297" y="34" textAnchor="middle" fill="#d97706" fontSize="9" fontFamily="sans-serif" letterSpacing="1">PROCESS</text>
          <text x="487" y="34" textAnchor="middle" fill="#3b82f6" fontSize="9" fontFamily="sans-serif" letterSpacing="1">STORE</text>
          <text x="677" y="34" textAnchor="middle" fill="#10b981" fontSize="9" fontFamily="sans-serif" letterSpacing="1">QUERY</text>
          <text x="875" y="34" textAnchor="middle" fill="#22c55e" fontSize="9" fontFamily="sans-serif" letterSpacing="1">SURFACE</text>
          <text x="107" y="178" textAnchor="middle" fill="#f43f5e" fontSize="9" fontFamily="sans-serif" letterSpacing="1">MICHAEL</text>
          <text x="297" y="178" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontFamily="sans-serif" letterSpacing="1">SAGE</text>

          {/* Arrows */}
          {ARROWS.map(([fromId, toId, dashed]) => {
            const from = BOX_MAP[fromId];
            const to   = BOX_MAP[toId];
            if (!from || !to) return null;
            const d = arrowPath(from, to);
            return (
              <path
                key={`${fromId}-${toId}`}
                d={d}
                fill="none"
                stroke="#4b5563"
                strokeWidth="1.5"
                strokeDasharray={dashed ? '4 3' : undefined}
                markerEnd="url(#kaf)"
              />
            );
          })}

          {/* Boxes */}
          {BOXES.map((box) => {
            const colors = PHASE_COLORS[box.phase] || PHASE_COLORS.capture;
            return (
              <g
                key={box.id}
                onMouseEnter={() => setTooltip(box)}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={box.x} y={box.y} width={box.w} height={box.h}
                  rx={6} fill={colors.fill} stroke={colors.stroke} strokeWidth={1.5}
                />
                <BoxLabel box={box} colors={colors} />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-border bg-card/95 p-3 shadow-xl text-xs backdrop-blur"
          style={{ left: mousePos.x, top: mousePos.y }}
        >
          <div className="font-bold text-foreground mb-1 font-mono">{tooltip.label}</div>
          <div className="text-muted-foreground mb-2 leading-relaxed">{tooltip.desc}</div>
          {tooltip.file && (
            <div className="font-mono text-[10px] text-primary bg-primary/10 rounded px-1.5 py-0.5 mb-1.5">{tooltip.file}</div>
          )}
          <div className="text-[10px] text-muted-foreground">
            Creator: <span className="text-foreground">{tooltip.creator}</span>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-2 text-center italic">
        Hover over any box to see description, file path, and creator · Dashed arrows = input feeds
      </p>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-[10px]">
        {([
          ['michael', 'Michael Capture'],
          ['sage',    'Sage Intel'],
          ['capture', 'Capture'],
          ['process', 'Process (Graphify)'],
          ['store',   'Store'],
          ['query',   'Query'],
          ['surface', 'Surface'],
        ] as [string, string][]).map(([phase, label]) => {
          const c = PHASE_COLORS[phase];
          return (
            <div key={phase} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm border" style={{ backgroundColor: c.fill, borderColor: c.stroke }} />
              <span style={{ color: c.text }}>{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
