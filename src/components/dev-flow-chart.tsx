'use client';

import { useState } from 'react';

interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  phase: string;
  file?: string;
  desc: string;
  creator: string;
}

const PHASE_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  research:   { fill: '#1f2937', stroke: '#6b7280', text: '#9ca3af' },
  prd:        { fill: '#1e1b4b', stroke: '#8b5cf6', text: '#a78bfa' },
  design:     { fill: '#042f2e', stroke: '#0d9488', text: '#2dd4bf' },
  tdd:        { fill: '#1c1400', stroke: '#d97706', text: '#fbbf24' },
  ci:         { fill: '#0c1a2e', stroke: '#3b82f6', text: '#60a5fa' },
  gemini:     { fill: '#052e16', stroke: '#10b981', text: '#34d399' },
  michael:    { fill: '#2d0a0a', stroke: '#f43f5e', text: '#fb7185' },
  verified:   { fill: '#052e16', stroke: '#22c55e', text: '#4ade80' },
  bug:        { fill: '#2d0a0a', stroke: '#ef4444', text: '#f87171' },
  regression: { fill: '#1f2937', stroke: '#6b7280', text: '#9ca3af' },
};

const BOXES: Box[] = [
  // Row 1 (top, left→right) — Research + PRD + Design
  { id: 's1',        x: 30,   y: 40,  w: 160, h: 56, label: 'S1 Research',      phase: 'research',
    file: 'docs/product/S1_COMPETITIVE_RESEARCH.md',
    desc: 'Market landscape, competitor analysis, opportunities. Sage + Consultant create this.',
    creator: 'Sage + Consultant' },
  { id: 's2',        x: 220,  y: 40,  w: 160, h: 56, label: 'S2 Define (MRD)',  phase: 'research',
    file: 'docs/product/S2_MRD.md',
    desc: 'Market Requirements Document. What to build and why — target user, pricing, positioning.',
    creator: 'Consultant' },
  { id: 'prd',       x: 420,  y: 40,  w: 180, h: 56, label: 'PRD Checklist',    phase: 'prd',
    file: 'docs/product/PRD_CHECKLIST.md',
    desc: 'Item-by-item list of what to build with Done/In Progress/Not Started status per item.',
    creator: 'Consultant + Code' },
  { id: 'matrix',    x: 640,  y: 40,  w: 190, h: 56, label: 'PRD Test Matrix',  phase: 'prd',
    file: 'docs/product/PRD_TEST_MATRIX.md',
    desc: 'Verification map — how to verify each PRD item: test type, method, inputs, expected result.',
    creator: 'Consultant' },
  { id: 'brainstorm',x: 870,  y: 40,  w: 160, h: 56, label: '/brainstorm',       phase: 'design',
    file: 'docs/specs/<feature>-design.md',
    desc: 'Explore context, ask clarifying questions, propose 2-3 approaches, save design spec.',
    creator: 'Code or Gemini' },
  { id: 'writeplan', x: 1070, y: 40,  w: 160, h: 56, label: '/write-plan',       phase: 'design',
    file: 'docs/specs/<feature>-plan.md',
    desc: 'Break into bite-sized TDD tasks (2-5 min each), mapped to PRD checklist items.',
    creator: 'Code or Gemini' },

  // Row 2 (middle, right→left) — TDD + CI + Verify
  { id: 'execute',   x: 1070, y: 170, w: 160, h: 56, label: '/execute-plan',     phase: 'tdd',
    file: 'docs/specs/<feature>-plan.md',
    desc: 'Execute plan tasks one by one: write failing test → implement → refactor → commit.',
    creator: 'Code or Gemini' },
  { id: 'tdd',       x: 870,  y: 170, w: 160, h: 56, label: 'TDD Cycle',         phase: 'tdd',
    file: 'tests/ or src/**/__tests__/',
    desc: 'RED: write failing test. GREEN: minimal code to pass. REFACTOR: clean up. COMMIT.',
    creator: 'Code or Gemini' },
  { id: 'ci',        x: 650,  y: 170, w: 180, h: 56, label: 'CI Test',           phase: 'ci',
    file: '.github/workflows/ci.yml',
    desc: 'Every PR: lint + types + unit tests + E2E against Vercel preview. Blocks merge on failure. → CI Test column.',
    creator: 'Automated (GitHub Actions)' },
  { id: 'gemini',    x: 430,  y: 170, w: 180, h: 56, label: 'Flow Test',         phase: 'gemini',
    file: 'ops/gemini/VALIDATION_REPORT.md',
    desc: '6am daily: Gemini navigates live site via Playwright MCP, tests user flows. → Flow Test column.',
    creator: 'Gemini CLI (automated)' },
  { id: 'michael',   x: 210,  y: 170, w: 180, h: 56, label: 'User Test',         phase: 'michael',
    file: 'docs/product/PRD_REVIEW_CHECKLIST.md',
    desc: 'Acceptance test on real device — UX, print quality, content accuracy. → User Test column. (Code Review = Consultant monthly audit, separate.)',
    creator: 'Michael' },
  { id: 'verified',  x: 30,   y: 170, w: 150, h: 56, label: '✅ Complete',       phase: 'verified',
    file: 'docs/product/PRD_TEST_MATRIX.md (Verified column)',
    desc: 'All layers passed: CI Test ✅ + Flow Test ✅ + User Test ✅. PRD item marked complete.',
    creator: 'All layers' },

  // Row 3 (bug/regression loop)
  { id: 'bug',       x: 30,   y: 300, w: 150, h: 56, label: 'Bug Found',         phase: 'bug',
    file: 'GitHub Issues',
    desc: 'Bug caught by any verification layer (CI failure, Gemini fail, or Michael finds issue).',
    creator: 'Anyone' },
  { id: 'regression',x: 220,  y: 300, w: 190, h: 56, label: 'Regression Test',   phase: 'regression',
    file: 'docs/product/PRD_TEST_MATRIX.md (new row)',
    desc: 'New test row added to matrix — tests never deleted, matrix only grows. Prevents re-occurrence.',
    creator: 'Code' },

  // Side: Competitive Log
  { id: 'complog',   x: 120,  y: 140, w: 160, h: 44, label: 'Competitive Log',   phase: 'research',
    file: 'docs/product/COMPETITIVE_LOG.md',
    desc: 'Ongoing competitor monitoring, weekly Sage refresh. Informs PRD updates.',
    creator: 'Sage (weekly)' },
];

// Arrows: [fromId, toId]
const ARROWS: [string, string][] = [
  ['s1', 's2'],
  ['s2', 'prd'],
  ['prd', 'matrix'],
  ['matrix', 'brainstorm'],
  ['brainstorm', 'writeplan'],
  ['writeplan', 'execute'],   // down
  ['execute', 'tdd'],         // row 2 rightward
  ['tdd', 'ci'],
  ['ci', 'gemini'],
  ['gemini', 'michael'],
  ['michael', 'verified'],
  ['verified', 'bug'],        // down
  ['bug', 'regression'],
  // Loop: regression → ci (back up)
];

function getCenter(box: Box) {
  return { cx: box.x + box.w / 2, cy: box.y + box.h / 2 };
}

function getArrowPoints(from: Box, to: Box): string {
  const fromCx = from.x + from.w / 2;
  const toCx = to.x + to.w / 2;
  const fromCy = from.y + from.h / 2;
  const toCy = to.y + to.h / 2;

  // Right-to-right (same row, from.x < to.x): horizontal
  if (Math.abs(fromCy - toCy) < 10) {
    const x1 = from.x + from.w;
    const x2 = to.x;
    return `M ${x1} ${fromCy} L ${x2} ${toCy}`;
  }
  // Down (same column, writeplan → execute): vertical
  if (Math.abs(fromCx - toCx) < 20) {
    const y1 = from.y + from.h;
    const y2 = to.y;
    return `M ${fromCx} ${y1} L ${toCx} ${y2}`;
  }
  // Row 2: right-to-left (from.x > to.x, same row)
  if (Math.abs(fromCy - toCy) < 10) {
    const x1 = from.x;
    const x2 = to.x + to.w;
    return `M ${x1} ${fromCy} L ${x2} ${toCy}`;
  }
  // Cross-row (verified → bug, going down)
  if (from.y < to.y) {
    const y1 = from.y + from.h;
    const y2 = to.y;
    return `M ${fromCx} ${y1} L ${toCx} ${y2}`;
  }
  // Default: elbow
  const midY = (from.y + from.h + to.y) / 2;
  return `M ${fromCx} ${from.y + from.h} L ${fromCx} ${midY} L ${toCx} ${midY} L ${toCx} ${to.y}`;
}

export function DevFlowChart() {
  const [tooltip, setTooltip] = useState<Box | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const boxMap = Object.fromEntries(BOXES.map(b => [b.id, b]));

  return (
    <div
      className="relative"
      onMouseMove={(e) => setMousePos({ x: e.clientX + 16, y: e.clientY + 16 })}
    >
      <div className="overflow-x-auto">
        <svg
          viewBox="0 0 1270 380"
          className="w-full min-w-[900px]"
          style={{ height: 'auto', minHeight: '360px' }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#4b5563" />
            </marker>
          </defs>

          {/* Arrows */}
          {ARROWS.map(([fromId, toId]) => {
            const from = boxMap[fromId];
            const to = boxMap[toId];
            if (!from || !to) return null;
            const d = getArrowPoints(from, to);
            return (
              <path
                key={`${fromId}-${toId}`}
                d={d}
                fill="none"
                stroke="#4b5563"
                strokeWidth="1.5"
                markerEnd="url(#arrowhead)"
              />
            );
          })}

          {/* Regression loop arrow (back to CI) */}
          {(() => {
            const reg = boxMap['regression'];
            const ci = boxMap['ci'];
            if (!reg || !ci) return null;
            const x1 = reg.x + reg.w;
            const x2 = ci.x + ci.w / 2;
            const y1 = reg.y + reg.h / 2;
            const y2 = ci.y + ci.h;
            return (
              <path
                d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 + 60} ${y2 + 30}, ${x2} ${y2}`}
                fill="none"
                stroke="#4b5563"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                markerEnd="url(#arrowhead)"
              />
            );
          })()}

          {/* Side branch: S1 → Competitive Log */}
          {(() => {
            const s1 = boxMap['s1'];
            const cl = boxMap['complog'];
            if (!s1 || !cl) return null;
            return (
              <path
                d={`M ${s1.x + s1.w / 2} ${s1.y + s1.h} L ${cl.x + cl.w / 2} ${cl.y}`}
                fill="none"
                stroke="#4b5563"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
            );
          })()}

          {/* Boxes */}
          {BOXES.map((box) => {
            const colors = PHASE_COLORS[box.phase] || PHASE_COLORS.research;
            return (
              <g
                key={box.id}
                onMouseEnter={() => setTooltip(box)}
                onMouseLeave={() => setTooltip(null)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.w}
                  height={box.h}
                  rx={6}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={1.5}
                />
                {/* Wrap label into two lines if needed */}
                {box.label.length > 14 ? (
                  <>
                    <text
                      x={box.x + box.w / 2}
                      y={box.y + box.h / 2 - 7}
                      textAnchor="middle"
                      fill={colors.text}
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {box.label.split(' ').slice(0, Math.ceil(box.label.split(' ').length / 2)).join(' ')}
                    </text>
                    <text
                      x={box.x + box.w / 2}
                      y={box.y + box.h / 2 + 9}
                      textAnchor="middle"
                      fill={colors.text}
                      fontSize="11"
                      fontFamily="monospace"
                      fontWeight="600"
                    >
                      {box.label.split(' ').slice(Math.ceil(box.label.split(' ').length / 2)).join(' ')}
                    </text>
                  </>
                ) : (
                  <text
                    x={box.x + box.w / 2}
                    y={box.y + box.h / 2 + 4}
                    textAnchor="middle"
                    fill={colors.text}
                    fontSize="11"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    {box.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Phase labels */}
          <text x="110" y="20" textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="sans-serif" letterSpacing="1">RESEARCH</text>
          <text x="530" y="20" textAnchor="middle" fill="#8b5cf6" fontSize="9" fontFamily="sans-serif" letterSpacing="1">PRD</text>
          <text x="970" y="20" textAnchor="middle" fill="#0d9488" fontSize="9" fontFamily="sans-serif" letterSpacing="1">DESIGN</text>
          <text x="1150" y="150" textAnchor="middle" fill="#d97706" fontSize="9" fontFamily="sans-serif" letterSpacing="1">TDD</text>
          <text x="740" y="150" textAnchor="middle" fill="#3b82f6" fontSize="9" fontFamily="sans-serif" letterSpacing="1">CI TEST</text>
          <text x="520" y="150" textAnchor="middle" fill="#10b981" fontSize="9" fontFamily="sans-serif" letterSpacing="1">FLOW TEST</text>
          <text x="110" y="280" textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="sans-serif" letterSpacing="1">BUG LOOP</text>
        </svg>
      </div>

      {/* Tooltip overlay */}
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
          <div className="text-[10px] text-muted-foreground">Creator: <span className="text-foreground">{tooltip.creator}</span></div>
        </div>
      )}

      {/* Hover instruction */}
      <p className="text-[10px] text-muted-foreground mt-2 text-center italic">Hover over any box to see description, file path, and creator</p>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-[10px]">
        {[
          { phase: 'research', label: 'Research' },
          { phase: 'prd', label: 'PRD' },
          { phase: 'design', label: 'Design' },
          { phase: 'tdd', label: 'TDD' },
          { phase: 'ci', label: 'CI Test' },
          { phase: 'gemini', label: 'Flow Test' },
          { phase: 'michael', label: 'User Test' },
          { phase: 'verified', label: 'Complete' },
          { phase: 'bug', label: 'Bug Loop' },
        ].map(({ phase, label }) => {
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
