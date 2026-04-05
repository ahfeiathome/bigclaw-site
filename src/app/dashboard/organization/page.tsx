import { fetchRecentCommits, fetchAllReleases, fetchBandwidth, fetchHealth, fetchPatrolReport } from '@/lib/github';
import { SectionCard, StatusDot, SignalPill } from '@/components/dashboard';

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
  const regex = new RegExp(`^##+ ${heading}`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^##+ /) && !lines[i].includes(heading)) { end = i; break; }
  }
  return lines.slice(0, end).join('\n');
}

export default async function OrganizationPage() {
  const [commits, releases, bandwidthMd, healthMd, patrolMd] = await Promise.all([
    fetchRecentCommits(24),
    fetchAllReleases(),
    fetchBandwidth(),
    fetchHealth(),
    fetchPatrolReport(),
  ]);

  // Agents
  const agentTable = bandwidthMd ? parseMarkdownTable(extractSection(bandwidthMd, 'Current Agent Load')) : [];
  const activeAgents = agentTable.filter(r => r.cells[3]?.toLowerCase() === 'busy').length;

  // Health
  const healthRows = patrolMd ? parseMarkdownTable(extractSection(patrolMd, 'System Health')) : [];

  // Patrol sections
  const patrolSections: { title: string; content: string }[] = [];
  if (patrolMd) {
    const lines = patrolMd.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^## (.+)/);
      if (m && !['System Health', 'Financial Summary'].includes(m[1])) {
        let end = lines.length;
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].match(/^## /)) { end = j; break; }
        }
        patrolSections.push({ title: m[1], content: lines.slice(i + 1, end).join('\n').trim() });
      }
    }
  }

  return (
    <div>
      <h1 className="mb-6" style={{ fontSize: '28px', fontWeight: 700 }}>Organization</h1>

      {/* ── Agents ──────────────────────────────────────────────── */}
      <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
        Agents
      </div>
      <SectionCard title={`Agent Status (${activeAgents}/${agentTable.length} active)`} className="mb-6">
        {agentTable.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-3">Agent</th>
                  <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-3">Role</th>
                  <th className="text-left text-xs text-muted-foreground font-medium pb-2 pr-3">Current Task</th>
                  <th className="text-left text-xs text-muted-foreground font-medium pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {agentTable.map((row, i) => {
                  const status = row.cells[3]?.toLowerCase();
                  const dotStatus = status === 'busy' ? 'good' as const : status === 'idle' ? 'warn' as const : 'neutral' as const;
                  return (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-3 font-medium text-foreground">{row.cells[0]}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{row.cells[1]}</td>
                      <td className="py-2 pr-3 text-muted-foreground font-mono text-xs">{row.cells[2]}</td>
                      <td className="py-2">
                        <div className="flex items-center gap-1.5">
                          <StatusDot status={dotStatus} size="sm" />
                          <span className="text-xs font-mono">{row.cells[3]}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Agent data unavailable</p>
        )}
      </SectionCard>

      {/* ── System Health ──────────────────────────────────────── */}
      {healthRows.length > 0 && (
        <>
          <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
            System Health
          </div>
          <SectionCard title="Health Check" className="mb-6">
            <div className="space-y-2">
              {healthRows.map((row, i) => {
                const value = row.cells[1] || '';
                const isBad = /DOWN|FAIL|CRITICAL|ERROR/i.test(value);
                const isWarn = /STALE|WARN|HIGH/i.test(value);
                const dotStatus = isBad ? 'bad' as const : isWarn ? 'warn' as const : 'good' as const;
                return (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
                    <span className="text-sm text-foreground">{row.cells[0]}</span>
                    <div className="flex items-center gap-1.5">
                      <StatusDot status={dotStatus} size="sm" />
                      <span className="text-xs font-mono text-muted-foreground">{value}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </>
      )}

      {/* ── Patrol ─────────────────────────────────────────────── */}
      {patrolSections.length > 0 && (
        <>
          <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
            Patrol Report
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {patrolSections.slice(0, 6).map((sec, i) => (
              <SectionCard key={i} title={sec.title}>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">{sec.content.slice(0, 400)}</p>
              </SectionCard>
            ))}
          </div>
        </>
      )}

      {/* ── Recent Commits ──────��──────────────────────────────── */}
      <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
        Commits (24h)
      </div>
      <SectionCard title={`${commits.length} commits`} className="mb-6">
        {commits.length > 0 ? (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {commits.slice(0, 20).map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-xs py-1 border-b border-border/30 last:border-0">
                <span className="text-muted-foreground font-mono shrink-0 w-16">{c.repo?.split('/').pop()}</span>
                <span className="text-foreground truncate">{c.message}</span>
                <span className="text-muted-foreground font-mono shrink-0 ml-auto">{c.date?.slice(11, 16)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No commits in the last 24 hours</p>
        )}
      </SectionCard>

      {/* ── Releases ───────────────────────────────────���───────── */}
      {releases.length > 0 && (
        <>
          <div className="mb-3" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.5)' }}>
            Recent Releases
          </div>
          <SectionCard title="Releases" className="mb-6">
            <div className="space-y-2">
              {releases.slice(0, 5).map((r, i) => (
                <div key={i} className="flex items-center gap-3 py-1 border-b border-border/30 last:border-0">
                  <SignalPill label={r.tag} tone="info" />
                  <span className="text-sm text-foreground">{r.name}</span>
                  <span className="text-xs text-muted-foreground font-mono ml-auto">{r.repo}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  );
}
