import { fetchPatrolReport, fetchAllIssues, fetchHealth, fetchMichaelTodo, fetchBandwidth, fetchRadarDashboard, fetchPDLCRegistry, FORGE_REPOS, AXIOM_REPOS } from '@/lib/github';
import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';
import { KpiCard } from '@/components/kpi-card';
import { MissionCommandCenter } from '@/components/mission-command-center';
import { ActionItems } from '@/components/action-items';
import fs from 'node:fs';
import path from 'node:path';

interface PendingGate { product: string; repo: string; branch: string; prUrl: string; previewUrl: string; summary: string; builtAt: string }
interface ProductGate { product: string; repo: string; protected: boolean }

function readJsonFile<T>(filename: string): T | null {
  try {
    const p = path.join(process.cwd(), 'data', filename);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch { return null; }
}

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
  const [content, allIssues, healthMd, todoMd, bandwidthMd, radarMd, pdlcMd] = await Promise.all([
    fetchPatrolReport(),
    fetchAllIssues(),
    fetchHealth(),
    fetchMichaelTodo(),
    fetchBandwidth(),
    fetchRadarDashboard(),
    fetchPDLCRegistry(),
  ]);

  // Production Gates
  const gatesData = readJsonFile<{ gates: ProductGate[] }>('productionGates.json');
  const pendingData = readJsonFile<{ pending: PendingGate[] }>('pendingGates.json');
  const gates = gatesData?.gates || [];
  const pendingGates = pendingData?.pending || [];

  // PDLC
  const pdlcRows = pdlcMd ? (() => {
    const section = pdlcMd.split('## Active Products')[1]?.split('##')[0] || '';
    const lines = section.split('\n').filter(l => l.includes('|') && !l.match(/^\|[\s-:|]+\|$/));
    if (lines.length <= 1) return [];
    return lines.slice(1).map(line => line.split('|').map(c => c.trim()).filter(Boolean));
  })() : [];

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

      {/* ── ROW 4: PDLC Summary ────────────────────────────────── */}
      {pdlcRows.length > 0 && (
        <SectionCard title={`Product Pipeline (${pdlcRows.length})`} className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3 pr-2">Product</th>
                  <th className="text-left py-2 px-2">Company</th>
                  <th className="text-left py-2 px-2">Stage</th>
                  <th className="text-left py-2 px-2">Next Gate</th>
                  <th className="text-left py-2 pl-2 pr-3">Blocker</th>
                </tr>
              </thead>
              <tbody>
                {pdlcRows.map((cells, i) => {
                  const stage = cells[2] || '';
                  const blocker = cells[5] || '';
                  const hasGate = blocker.includes('💳') || blocker.includes('⚖️') || blocker.includes('🧠');
                  const tone = stage.includes('S1') || stage.includes('S2') || stage.includes('S3') ? 'info' as const
                    : stage.includes('S4') || stage.includes('S5') ? 'warning' as const
                    : 'success' as const;
                  const companyColor = cells[1]?.includes('Forge') ? 'bg-green-500/10 text-green-400'
                    : cells[1]?.includes('BigClaw') ? 'bg-purple-500/10 text-purple-400'
                    : cells[1]?.includes('Nexus') ? 'bg-purple-500/10 text-purple-400'
                    : 'bg-blue-500/10 text-blue-400';
                  return (
                    <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                      <td className="py-2 pl-3 pr-2 text-foreground font-medium">{cells[0]}</td>
                      <td className="py-2 px-2"><span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${companyColor}`}>{cells[1]}</span></td>
                      <td className="py-2 px-2"><SignalPill label={stage} tone={tone} /></td>
                      <td className="py-2 px-2 text-muted-foreground">{cells[4]}</td>
                      <td className={`py-2 pl-2 pr-3 ${hasGate ? 'text-amber-400' : 'text-muted-foreground'}`}>{blocker || 'None'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* ── Awaiting Approval ──────────────────────────────────── */}
      {pendingGates.length > 0 && (
        <SectionCard title={`Awaiting Your Approval (${pendingGates.length})`} className="mt-4">
          <div className="space-y-3">
            {pendingGates.map((gate, i) => (
              <div key={i} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-bold text-foreground">{gate.product}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{new Date(gate.builtAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">{gate.summary}</p>
                <div className="flex gap-2">
                  <a href={gate.previewUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary no-underline hover:bg-primary/20">Preview →</a>
                  <a href={gate.prUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary no-underline hover:bg-primary/20">Review PR →</a>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      {pendingGates.length === 0 && (
        <div className="mt-4 text-xs text-muted-foreground px-1">No deployments waiting for approval.</div>
      )}

      {/* ── Production Gates ───────────────────────────────────── */}
      <SectionCard title="Production Gates" className="mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-border bg-muted">
                <th className="text-left py-2 pl-3 pr-2">Product</th>
                <th className="text-left py-2 px-2">Repo</th>
                <th className="text-left py-2 pl-2 pr-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {gates.map((gate, i) => (
                <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                  <td className="py-1.5 pl-3 pr-2 text-foreground">{gate.product}</td>
                  <td className="py-1.5 px-2 text-muted-foreground font-mono text-[10px]">{gate.repo}</td>
                  <td className="py-1.5 pl-2 pr-3">
                    {gate.protected
                      ? <span className="text-amber-400 text-[10px]">🔒 Protected</span>
                      : <span className="text-green-400 text-[10px]">✅ Auto-deploy</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">To change protection, edit REGISTRY.md and run data sync.</p>
      </SectionCard>
    </div>
  );
}
