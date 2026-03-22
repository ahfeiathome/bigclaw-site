import { fetchPatrolReport } from '@/lib/github';

interface TableRow {
  cells: string[];
}

function parseMarkdownTable(section: string): TableRow[] {
  const lines = section.split('\n').filter(
    (l) => l.includes('|') && !l.match(/^\|[\s-|]+\|$/)
  );
  if (lines.length <= 1) return [];
  return lines.slice(1).map((line) => ({
    cells: line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean),
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
    if (lines[i].match(/^## /)) {
      end = i;
      break;
    }
  }
  return lines.slice(0, end).join('\n');
}

function extractMeta(content: string): Record<string, string> {
  const section = extractSection(content, 'Meta');
  const rows = parseMarkdownTable(section);
  const meta: Record<string, string> = {};
  for (const row of rows) {
    if (row.cells.length >= 2) {
      meta[row.cells[0]] = row.cells[1];
    }
  }
  return meta;
}

function StatusBadge({ value }: { value: string }) {
  const isGood =
    value.includes('✅') ||
    value === 'UP' ||
    value === 'OK' ||
    value.includes('HEALTHY') ||
    value.includes('active') ||
    value.includes('green') ||
    value.includes('LIVE');
  const isWarn =
    value.includes('⚠️') ||
    value.includes('STALE') ||
    value.includes('Blocked') ||
    value.includes('QUEUE');
  const isBad = value.includes('❌') || value === 'DOWN' || value.includes('FAIL');

  const color = isBad
    ? 'text-red-400'
    : isWarn
      ? 'text-amber-400'
      : isGood
        ? 'text-green-400'
        : 'text-foreground/80';

  return <span className={`font-mono ${color}`}>{value}</span>;
}

function KpiCard({
  title,
  color,
  rows,
  showTrend,
}: {
  title: string;
  color: string;
  rows: TableRow[];
  showTrend?: boolean;
}) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className={`text-xs font-semibold ${color} uppercase tracking-wide mb-3`}>
        {title}
      </div>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex justify-between items-center text-xs gap-2">
            <span className="text-muted shrink-0">{row.cells[0]}</span>
            <StatusBadge value={row.cells[1] || ''} />
            {showTrend && row.cells[2] && (
              <span className="text-muted text-[10px] shrink-0 w-4 text-center">
                {row.cells[2]}
              </span>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-xs text-muted">No data</div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({ row }: { row: TableRow }) {
  const [name, status, phase, blocker] = row.cells;
  const statusColor =
    status === 'LIVE' ? 'bg-green-400' :
    status === 'BUILD' ? 'bg-blue-400' :
    status === 'PAPER' ? 'bg-cyan-400' :
    status === 'DESIGN' ? 'bg-purple-400' :
    status === 'QUEUE' ? 'bg-zinc-500' :
    status === 'BLOCKED' ? 'bg-red-400' :
    'bg-zinc-600';

  return (
    <div className="border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${statusColor}`} />
        <span className="text-xs font-semibold text-foreground">{name}</span>
        <span className="text-[10px] font-mono text-muted ml-auto">{status}</span>
      </div>
      <div className="text-[11px] text-muted">{phase}</div>
      {blocker && blocker !== '—' && (
        <div className="text-[10px] text-amber-400 mt-1">{blocker}</div>
      )}
    </div>
  );
}

function AlertsCard({ rows }: { rows: TableRow[] }) {
  const hasAlerts = rows.length > 0 && !(rows.length === 1 && rows[0].cells[0] === '—');

  return (
    <div className={`border rounded-lg p-4 ${hasAlerts ? 'border-red-500/50 bg-red-500/5' : 'border-border'}`}>
      <div className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-3">
        Alerts
      </div>
      {!hasAlerts ? (
        <div className="text-sm text-green-400">No alerts</div>
      ) : (
        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span
                className={`shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                  row.cells[0]?.includes('CRITICAL')
                    ? 'bg-red-400'
                    : row.cells[0]?.includes('WARN')
                      ? 'bg-amber-400'
                      : 'bg-blue-400'
                }`}
              />
              <div>
                <span className="text-foreground/90">{row.cells[1]}</span>
                {row.cells[2] && (
                  <span className="text-muted ml-2">{row.cells[2]}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ActionsCard({ rows }: { rows: TableRow[] }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="text-xs font-semibold text-accent uppercase tracking-wide mb-3">
        Actions Taken
      </div>
      <div className="space-y-1.5">
        {rows.map((row, i) => (
          <div key={i} className="flex items-start gap-2 text-xs">
            <span className="shrink-0 text-green-400">
              {row.cells[1]?.includes('✅') ? '✓' : '·'}
            </span>
            <span className="text-foreground/80">{row.cells[0]}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-xs text-muted">No actions this patrol</div>
        )}
      </div>
    </div>
  );
}

function BlockedCard({ rows }: { rows: TableRow[] }) {
  return (
    <div className="border border-border rounded-lg p-4">
      <div className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-3">
        Needs Sponsor
      </div>
      <div className="space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="text-xs">
            <div className="flex items-center gap-2">
              <span className="text-amber-400">●</span>
              <span className="text-foreground/90 font-medium">{row.cells[0]}</span>
              <span className="text-muted text-[10px] ml-auto">{row.cells[1]}</span>
            </div>
            {row.cells[2] && (
              <div className="text-muted ml-4 mt-0.5">{row.cells[2]}</div>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-xs text-green-400">Nothing blocked</div>
        )}
      </div>
    </div>
  );
}

export default async function PatrolPage() {
  const content = await fetchPatrolReport();

  if (!content) {
    return (
      <div className="text-center py-20 text-muted">
        <div className="text-2xl mb-2">📡</div>
        <div>No patrol report yet.</div>
        <div className="text-xs mt-1">Felix will generate one on next patrol run.</div>
      </div>
    );
  }

  const meta = extractMeta(content);
  const financial = parseMarkdownTable(extractSection(content, 'Financial'));
  const projects = parseMarkdownTable(extractSection(content, 'Projects'));
  const infra = parseMarkdownTable(extractSection(content, 'Infrastructure'));
  const tooling = parseMarkdownTable(extractSection(content, 'Tooling'));
  const velocity = parseMarkdownTable(extractSection(content, 'Velocity'));
  const alerts = parseMarkdownTable(extractSection(content, 'Alerts'));
  const actions = parseMarkdownTable(extractSection(content, 'Actions'));
  const blocked = parseMarkdownTable(extractSection(content, 'Blocked on Sponsor'));

  const statusColor =
    meta['Status'] === 'HEALTHY'
      ? 'text-green-400'
      : meta['Status']?.includes('WARN')
        ? 'text-amber-400'
        : meta['Status']?.includes('CRITICAL')
          ? 'text-red-400'
          : 'text-foreground';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              meta['Status'] === 'HEALTHY' ? 'bg-green-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <div>
            <div className="text-sm font-medium">
              Felix Heartbeat — {meta['Timestamp'] || 'unknown'}
            </div>
            <div className="text-[10px] text-muted">
              {meta['Type'] || `Market: ${meta['Market Phase'] || '?'} · Mode: ${meta['Mode'] || '?'}`} ·
              Duration: {meta['Duration'] || '?'}
            </div>
          </div>
        </div>
        <div className={`text-xs font-mono font-semibold ${statusColor}`}>
          {meta['Status'] || 'UNKNOWN'}
        </div>
      </div>

      {/* Alerts — full width at top */}
      <div className="mb-4">
        <AlertsCard rows={alerts} />
      </div>

      {/* Projects — 6-column grid */}
      <div className="mb-4">
        <div className="text-xs font-semibold text-accent uppercase tracking-wide mb-3">
          Projects
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {projects.map((row, i) => (
            <ProjectCard key={i} row={row} />
          ))}
        </div>
      </div>

      {/* KPI Grid — 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <KpiCard title="💰 Financial" color="text-amber-400" rows={financial} showTrend />
        <KpiCard title="🖥️ Infrastructure" color="text-emerald-400" rows={infra} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <KpiCard title="🔧 Tooling" color="text-purple-400" rows={tooling} />
        <KpiCard title="🚀 Velocity" color="text-blue-400" rows={velocity} />
      </div>

      {/* Actions + Blocked — 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionsCard rows={actions} />
        <BlockedCard rows={blocked} />
      </div>
    </div>
  );
}
