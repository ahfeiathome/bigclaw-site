import { fetchPatrolReport, fetchAllIssues, fetchHealth, fetchMichaelTodo, fetchBandwidth, fetchRadarDashboard, FORGE_REPOS, AXIOM_REPOS } from '@/lib/github';
import { KpiCard } from '@/components/kpi-card';
import { MissionCommandCenter } from '@/components/mission-command-center';
import { ActionItems } from '@/components/action-items';

// ── Shared helpers ──────────────────────────────────────────────────────────

interface TableRow { cells: string[] }

function parseMarkdownTable(section: string): TableRow[] {
  const lines = section.split('\n').filter(
    (l) => l.includes('|') && !l.match(/^\|[\s-|]+\|$/)
  );
  if (lines.length <= 1) return [];
  return lines.slice(1).map((line) => ({
    cells: line.split('|').map((c) => c.trim()).filter(Boolean),
  }));
}

function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`^## ${heading}\\s*$`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^## /)) { end = i; break; }
  }
  return lines.slice(0, end).join('\n');
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function MissionControlPage() {
  const [content, allIssues, healthMd, todoMd, bandwidthMd, radarMd] = await Promise.all([
    fetchPatrolReport(),
    fetchAllIssues(),
    fetchHealth(),
    fetchMichaelTodo(),
    fetchBandwidth(),
    fetchRadarDashboard(),
  ]);

  // Finance
  const financial = content ? parseMarkdownTable(extractSection(content, 'Financial Summary')) : [];
  const burnRow = financial.find(r => r.cells[0]?.toLowerCase().includes('burn'));
  const burnVal = burnRow?.cells[1]?.replace('(free tiers)', '').trim() || '~$5/mo';

  // Health
  const healthRows = content ? parseMarkdownTable(extractSection(content, 'System Health')) : [];
  const totalHealth = healthRows.length;
  const okHealth = healthRows.filter(r => /OK|RUNNING|ONLINE/i.test(r.cells[1] || '')).length;
  const healthScore = totalHealth > 0 ? Math.round((okHealth / totalHealth) * 100) : 0;
  const healthSemantic = healthScore >= 80 ? 'success' as const : healthScore >= 60 ? 'warning' as const : 'danger' as const;

  // RADAR
  const radarSummary = radarMd ? parseMarkdownTable(extractSection(radarMd, 'Portfolio Summary')) : [];
  const radarMeta: Record<string, string> = {};
  for (const row of radarSummary) {
    if (row.cells.length >= 2) radarMeta[row.cells[0]] = row.cells[1];
  }
  const radarEquityVal = radarMeta['Equity'] || '--';
  const radarPnlVal = radarMeta['Daily P/L'] || '--';
  const radarReserveStr = radarMeta['Reserve'] || '';
  const radarReserve = radarReserveStr ? parseFloat(radarReserveStr.replace('%', '')) : undefined;
  const hasLive = radarMeta['Phase']?.includes('Live') || false;
  const radarSemantic = radarPnlVal.includes('-') ? 'danger' as const : 'success' as const;

  // Sparkline data
  const equitySection = radarMd ? extractSection(radarMd, 'Equity History') : '';
  const equityRows = parseMarkdownTable(equitySection);
  const equitySparkData = equityRows.slice(-7).map(r => parseFloat(r.cells[1]?.replace(/[$,]/g, '') || '0')).filter(v => v > 0);

  // Issues
  const p0Count = allIssues.filter(i => i.labels.includes('P0')).length;
  const p0Semantic = p0Count === 0 ? 'success' as const : p0Count <= 3 ? 'warning' as const : 'danger' as const;

  // Agents
  const agentTableRows = bandwidthMd ? parseMarkdownTable(extractSection(bandwidthMd, 'Current Agent Load')) : [];
  const activeAgents = agentTableRows.filter(r => r.cells[3]?.toLowerCase() === 'busy').length;
  const totalAgents = agentTableRows.length || 6;
  const agentSemantic = activeAgents === 0 ? 'danger' as const : activeAgents < totalAgents ? 'warning' as const : 'success' as const;

  // Burn
  const burnFloat = parseFloat(burnVal.replace(/[^0-9.]/g, '')) || 0;
  const burnSemantic = burnFloat < 5 ? 'success' as const : burnFloat < 15 ? 'warning' as const : 'danger' as const;

  return (
    <div>
      {/* ── Page Title ──────────────────────────────────────────── */}
      <h1 className="mb-4" style={{ fontSize: '28px', fontWeight: 700 }}>Mission Control</h1>

      {/* ── ROW 1: KPI Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        <KpiCard label="Company Health" value={`${healthScore}`} semantic={healthSemantic} delta={healthScore >= 80 ? '▲ Healthy' : healthScore >= 60 ? '— Warning' : '▼ Critical'} sparkData={[70, 75, 80, healthScore, healthScore, healthScore, healthScore]} subtitle="/100" />
        <KpiCard label="RADAR Equity" value={radarEquityVal} semantic={radarSemantic} delta={`P/L: ${radarPnlVal}`} sparkData={equitySparkData.length >= 2 ? equitySparkData : undefined} />
        <KpiCard label="Open P0s" value={String(p0Count)} semantic={p0Semantic} delta={p0Count === 0 ? '▲ Clear' : `${p0Count} blocking`} />
        <KpiCard label="Monthly Burn" value={burnVal} semantic={burnSemantic} delta={burnFloat < 5 ? '▲ Under budget' : undefined} />
        <KpiCard label="Revenue" value="$0" semantic="warning" delta="Pre-revenue" subtitle="Phase 0" />
        <KpiCard label="Agents" value={`${activeAgents}/${totalAgents}`} semantic={agentSemantic} delta={`${activeAgents} active`} />
      </div>

      {/* ── ROW 2: Command Center (collapsed) ───────────────────── */}
      <MissionCommandCenter radarReserve={radarReserve} hasLive={hasLive} defaultCollapsed={true} />

      {/* ── ROW 3: Action Items ─────────────────────────────────── */}
      <ActionItems todoMd={todoMd} />
    </div>
  );
}
