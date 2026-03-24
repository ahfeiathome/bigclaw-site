import { fetchCeoInbox, fetchMarketing, fetchAgentsMd, fetchProjects, fetchBandwidth } from '@/lib/github';

interface TableRow {
  cells: string[];
}

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
  const regex = new RegExp(`^##+ ${heading}`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^##+ /) && !lines[i].includes(heading)) {
      end = i;
      break;
    }
  }
  return lines.slice(0, end).join('\n');
}

function extractBulletItems(content: string): string[] {
  return content
    .split('\n')
    .filter((l) => l.match(/^[-*]\s/))
    .map((l) => l.replace(/^[-*]\s+/, '').replace(/\*\*/g, '').trim())
    .filter(Boolean);
}

interface PipelineProject {
  name: string;
  stage: string;
  status: string;
  stageColor: string;
}

function extractPipelineProjects(projectsMd: string | null): PipelineProject[] {
  if (!projectsMd) return [];
  const projects: PipelineProject[] = [];
  const seen = new Set<string>();

  const sections = ['Active', 'FOUNDRY', 'Pipeline', 'Autonomous'];
  for (const section of sections) {
    const regex = new RegExp(`## ${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm');
    const match = projectsMd.search(regex);
    if (match === -1) continue;
    const rest = projectsMd.slice(match);
    const lines = rest.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.match(/^## /) || line.match(/^---\s*$/)) break;
      if (!line.startsWith('|') || line.includes('Codename') || line.match(/^\|[\s-|]+\|$/)) continue;
      if (line.startsWith('| —') || line.startsWith('|---')) continue;
      const cols = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cols.length < 4) continue;
      const codename = cols[0].replace(/\*\*/g, '');
      if (seen.has(codename)) continue;
      seen.add(codename);

      const pdlc = cols[3] || '';
      if (pdlc.includes('ARCHIVED') || pdlc === '—') continue;

      const stageMatch = pdlc.match(/S(\d)/);
      const stageNum = stageMatch ? parseInt(stageMatch[1]) : 0;
      const stageColor =
        stageNum >= 7 ? 'bg-green-400' :
        stageNum >= 4 ? 'bg-blue-400' :
        stageNum >= 1 ? 'bg-purple-400' : 'bg-slate-400';

      const isPipeline = section === 'Pipeline';
      const statusIdx = isPipeline ? 5 : 4;

      projects.push({
        name: codename,
        stage: pdlc,
        status: cols[statusIdx] || '',
        stageColor,
      });
    }
  }

  return projects;
}

interface AgentInfo {
  name: string;
  role: string;
  status: string;
  activity: string;
}

function extractAgents(agentsMd: string | null): AgentInfo[] {
  if (!agentsMd) return [];
  const agents: AgentInfo[] = [];

  const rows = parseMarkdownTable(agentsMd);
  for (const row of rows) {
    if (row.cells.length >= 3) {
      agents.push({
        name: row.cells[0].replace(/\*\*/g, ''),
        role: row.cells[1] || '',
        status: row.cells[2] || '',
        activity: row.cells[3] || '',
      });
    }
  }

  // Fallback: parse agent headings
  if (agents.length === 0) {
    const pattern = /###?\s+(\w+)\s*(?:\(([^)]+)\))?/g;
    let match;
    while ((match = pattern.exec(agentsMd)) !== null) {
      const name = match[1];
      if (['Agent', 'Agents', 'Overview', 'Table'].includes(name)) continue;
      agents.push({
        name,
        role: match[2] || '',
        status: 'active',
        activity: '',
      });
    }
  }

  return agents;
}

interface VelocityMetric {
  label: string;
  value: string;
}

function extractVelocity(bandwidth: string | null, inbox: string | null): VelocityMetric[] {
  const metrics: VelocityMetric[] = [];

  if (inbox) {
    const actionItems = (inbox.match(/^[-*]\s/gm) || []).length;
    const cpItems = (inbox.match(/CP-\d+/g) || []);
    metrics.push({ label: 'Inbox Items', value: `${actionItems}` });
    if (cpItems.length > 0) {
      metrics.push({ label: 'Checkpoints Linked', value: `${cpItems.length}` });
    }
  }

  if (bandwidth) {
    const commitMatch = bandwidth.match(/commits?[:\s]+(\d+)/i);
    if (commitMatch) {
      metrics.push({ label: 'Commits (24h)', value: commitMatch[1] });
    }
    const prMatch = bandwidth.match(/(?:pr|pull request|merge)[:\s]+(\d+)/i);
    if (prMatch) {
      metrics.push({ label: 'PRs Merged', value: prMatch[1] });
    }
  }

  return metrics;
}

interface MarketingItem {
  channel: string;
  status: string;
  details: string;
}

function extractMarketingItems(marketing: string | null): MarketingItem[] {
  if (!marketing) return [];
  const items: MarketingItem[] = [];

  // Try table extraction
  const rows = parseMarkdownTable(marketing);
  for (const row of rows) {
    if (row.cells.length >= 2) {
      items.push({
        channel: row.cells[0].replace(/\*\*/g, ''),
        status: row.cells[1],
        details: row.cells[2] || '',
      });
    }
  }

  // Fallback: extract from headings + bullets
  if (items.length === 0) {
    const lower = marketing.toLowerCase();
    const channels = [
      { key: 'seo', label: 'SEO' },
      { key: 'content', label: 'Content' },
      { key: 'social', label: 'Social Media' },
      { key: 'campaign', label: 'Campaigns' },
      { key: 'launch', label: 'Launch' },
      { key: 'brand', label: 'Brand' },
    ];
    for (const ch of channels) {
      if (lower.includes(ch.key)) {
        const section = extractSection(marketing, ch.label);
        const bullets = section ? extractBulletItems(section) : [];
        items.push({
          channel: ch.label,
          status: bullets.length > 0 ? 'Active' : 'Documented',
          details: bullets.slice(0, 2).join('; ') || '',
        });
      }
    }
    // If still nothing, create a generic item
    if (items.length === 0) {
      const bullets = extractBulletItems(marketing);
      if (bullets.length > 0) {
        items.push({
          channel: 'Marketing Strategy',
          status: 'Documented',
          details: bullets.slice(0, 3).join('; '),
        });
      }
    }
  }

  return items;
}

function buildExecSummary(
  inbox: string | null,
  marketing: string | null,
  pipelineProjects: PipelineProject[],
  agents: AgentInfo[],
): string[] {
  const lines: string[] = [];

  if (pipelineProjects.length > 0) {
    const liveCount = pipelineProjects.filter((p) => p.stage.includes('S7') || p.stage.includes('S8')).length;
    const buildCount = pipelineProjects.filter((p) => p.stage.includes('S4') || p.stage.includes('S5')).length;
    const parts = [];
    if (liveCount > 0) parts.push(`${liveCount} live`);
    if (buildCount > 0) parts.push(`${buildCount} building`);
    if (parts.length > 0) {
      lines.push(`${pipelineProjects.length} projects in pipeline: ${parts.join(', ')}.`);
    } else {
      lines.push(`${pipelineProjects.length} projects tracked in pipeline.`);
    }
  }

  if (inbox) {
    const actionItems = (inbox.match(/^[-*]\s/gm) || []).length;
    if (actionItems > 0) {
      lines.push(`${actionItems} actionable items in COO inbox.`);
    }
  }

  if (agents.length > 0) {
    const activeCount = agents.filter((a) => a.status.toLowerCase().includes('active')).length;
    lines.push(`${activeCount || agents.length} agents active across operations.`);
  }

  if (lines.length === 0) {
    lines.push('Growth data loaded. Review pipeline and agent activity below.');
  }

  return lines.slice(0, 3);
}

function StatusDot({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const isActive = lower.includes('active') || lower.includes('live') || lower.includes('priority') || lower.includes('running');
  const isBlocked = lower.includes('blocked') || lower.includes('down') || lower.includes('fail');
  const isPending = lower.includes('queue') || lower.includes('pending') || lower.includes('paper') || lower.includes('wait');
  const color = isBlocked ? 'bg-red-400' : isPending ? 'bg-amber-400' : isActive ? 'bg-green-400' : 'bg-slate-400';
  return <span className={`w-2 h-2 rounded-full ${color} inline-block shrink-0`} />;
}

export default async function GrowthPage() {
  const [inbox, marketing, agentsMd, projectsMd, bandwidth] = await Promise.all([
    fetchCeoInbox(),
    fetchMarketing(),
    fetchAgentsMd(),
    fetchProjects(),
    fetchBandwidth(),
  ]);

  const pipelineProjects = extractPipelineProjects(projectsMd);
  const agents = extractAgents(agentsMd);
  const velocity = extractVelocity(bandwidth, inbox);
  const marketingItems = extractMarketingItems(marketing);
  const execLines = buildExecSummary(inbox, marketing, pipelineProjects, agents);

  // Stage distribution for summary cards
  const stageCounts = {
    live: pipelineProjects.filter((p) => p.stage.includes('S7') || p.stage.includes('S8')).length,
    build: pipelineProjects.filter((p) => p.stage.includes('S4') || p.stage.includes('S5') || p.stage.includes('S6')).length,
    early: pipelineProjects.filter((p) => p.stage.includes('S1') || p.stage.includes('S2') || p.stage.includes('S3')).length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold">Growth</h2>
          <p className="text-xs text-muted">
            Biz Dev (sage) + Marketing (lumina) — sources: COO_INBOX.md, MARKETING.md, PROJECTS.md
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-mono text-muted uppercase">ACTIVE</span>
        </div>
      </div>

      {/* Exec Summary */}
      <div className="border border-border rounded-lg p-5 mb-6 bg-slate-50">
        <div className="text-sm font-semibold text-cyan-600 uppercase tracking-wide mb-3">Executive Summary</div>
        <div className="space-y-2">
          {execLines.map((line, i) => (
            <p key={i} className="text-sm text-foreground/80 leading-relaxed">{line}</p>
          ))}
        </div>
      </div>

      {/* Hero KPI Row — Pipeline Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-lg p-5 border bg-slate-50 border-border">
          <div className="text-xs text-muted uppercase tracking-wide mb-2">Total Projects</div>
          <div className="text-2xl font-mono font-bold text-foreground">{pipelineProjects.length}</div>
        </div>
        <div className="rounded-lg p-5 border bg-green-50 border-green-200">
          <div className="text-xs text-muted uppercase tracking-wide mb-2">Live / Growing</div>
          <div className="text-2xl font-mono font-bold text-green-600">{stageCounts.live}</div>
        </div>
        <div className="rounded-lg p-5 border bg-blue-50 border-blue-200">
          <div className="text-xs text-muted uppercase tracking-wide mb-2">Building</div>
          <div className="text-2xl font-mono font-bold text-blue-600">{stageCounts.build}</div>
        </div>
        <div className="rounded-lg p-5 border bg-purple-50 border-purple-200">
          <div className="text-xs text-muted uppercase tracking-wide mb-2">Discovery</div>
          <div className="text-2xl font-mono font-bold text-purple-600">{stageCounts.early}</div>
        </div>
      </div>

      {/* Velocity Metrics */}
      {velocity.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {velocity.map((v, i) => (
            <div key={i} className="rounded-lg p-4 border border-border bg-slate-50">
              <div className="text-xs text-muted uppercase tracking-wide mb-1">{v.label}</div>
              <div className="text-xl font-mono font-semibold text-foreground">{v.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Pipeline Projects Grid */}
      {pipelineProjects.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
            Pipeline by Stage
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pipelineProjects.map((proj, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${proj.stageColor}`} />
                  <span className="text-sm font-semibold text-foreground">{proj.name}</span>
                  <span className="text-xs font-mono text-muted ml-auto">{proj.stage}</span>
                </div>
                <div className="text-xs text-muted truncate">
                  {proj.status.replace(/\*\*/g, '').slice(0, 80) || 'No status'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent Activity Grid */}
      {agents.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
            Agent Activity
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((agent, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <StatusDot status={agent.status} />
                  <span className="text-sm font-semibold text-foreground">{agent.name}</span>
                  <span className="text-xs text-muted ml-auto">{agent.role}</span>
                </div>
                <div className="text-xs text-muted">{agent.status}</div>
                {agent.activity && (
                  <div className="text-xs text-foreground/70 mt-1 truncate">{agent.activity}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Marketing Status */}
      {marketingItems.length > 0 && (
        <div className="mb-6">
          <div className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
            Marketing Channels
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {marketingItems.map((item, i) => (
              <div key={i} className="border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <StatusDot status={item.status} />
                  <span className="text-sm font-semibold text-foreground">{item.channel}</span>
                  <span className={`text-xs font-mono ml-auto ${
                    item.status.toLowerCase().includes('active') ? 'text-green-600' : 'text-muted'
                  }`}>
                    {item.status}
                  </span>
                </div>
                {item.details && (
                  <div className="text-xs text-muted mt-1">{item.details}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COO Inbox — structured, not raw */}
      {inbox && (
        <div className="mb-6">
          <div className="text-sm font-semibold text-foreground uppercase tracking-wide mb-3">
            COO Inbox
          </div>
          <div className="border border-border rounded-lg p-5">
            {(() => {
              const rows = parseMarkdownTable(inbox);
              if (rows.length > 0) {
                return (
                  <div className="space-y-2.5">
                    {rows.map((row, i) => (
                      <div key={i} className="flex justify-between items-center text-sm gap-2">
                        <span className="text-foreground/80">{row.cells[0]}</span>
                        <span className="font-mono text-muted shrink-0">{row.cells.slice(1).join(' | ')}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              // Fallback: bullet items
              const bullets = extractBulletItems(inbox);
              if (bullets.length > 0) {
                return (
                  <div className="space-y-2">
                    {bullets.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span className="text-foreground/80">{item}</span>
                      </div>
                    ))}
                  </div>
                );
              }
              // Final fallback: show first 10 non-empty lines
              const lines = inbox.split('\n').filter((l) => l.trim() && !l.startsWith('#')).slice(0, 10);
              return (
                <div className="space-y-1.5">
                  {lines.map((line, i) => (
                    <p key={i} className="text-sm text-foreground/80">{line}</p>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* No data fallback */}
      {!inbox && !marketing && pipelineProjects.length === 0 && agents.length === 0 && (
        <div className="text-center py-10 text-muted">
          <div className="text-sm">No growth data available yet.</div>
          <div className="text-xs mt-1">Data will appear when COO_INBOX.md, MARKETING.md, or PROJECTS.md are populated.</div>
        </div>
      )}
    </div>
  );
}
