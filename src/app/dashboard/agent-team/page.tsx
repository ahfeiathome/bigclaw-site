import { fetchAgentSystem, fetchPi5Health, fetchOvernightReport, fetchAgentOpsIndex, fetchCooInbox } from '@/lib/github';
import { SectionCard, StatusDot } from '@/components/dashboard';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export default async function AgentTeamPage() {
  const [agentMd, pi5HealthMd, overnightMd, indexMd, cooMd] = await Promise.all([
    fetchAgentSystem(),
    fetchPi5Health(),
    fetchOvernightReport(),
    fetchAgentOpsIndex(),
    fetchCooInbox(),
  ]);

  // Parse agent roster
  const agents = agentMd ? agentMd.split('\n')
    .filter(l => l.startsWith('|') && l.includes('**') && !l.includes('Agent') && !l.match(/^\|[\s-:|]+\|$/))
    .map(l => {
      const cells = l.split('|').map(c => c.trim()).filter(Boolean);
      return { name: cells[0]?.replace(/\*/g, ''), title: cells[1], model: cells[2], telegram: cells[3], duty: cells[4], mode: cells[5] };
    }) : [];

  // Parse cron schedule
  const cronSection = agentMd?.split('## Cron Schedule')[1]?.split('## ')[0] || '';
  const crons = cronSection.split('\n')
    .filter(l => l.startsWith('|') && l.includes('`') && !l.includes('Script') && !l.match(/^\|[\s-:|]+\|$/))
    .map(l => {
      const cells = l.split('|').map(c => c.trim()).filter(Boolean);
      return { script: cells[0]?.replace(/`/g, ''), schedule: cells[1], agent: cells[2], duty: cells[3], cost: cells[4] };
    });

  // Parse Pi5 health
  const healthMetrics = pi5HealthMd ? pi5HealthMd.split('\n')
    .filter(l => l.startsWith('|') && !l.match(/^\|[\s-:|]+\|$/) && !l.includes('Metric'))
    .slice(0, 8)
    .map(l => {
      const cells = l.split('|').map(c => c.trim()).filter(Boolean);
      return { metric: cells[0], value: cells[1] };
    }) : [];

  // Parse last COO_INBOX entries
  const cooEntries = cooMd ? cooMd.split('\n')
    .filter(l => l.startsWith('## '))
    .slice(0, 5)
    .map(l => l.replace(/^## /, '').trim()) : [];

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Agent Team</h1>
      <p className="text-sm text-muted-foreground mb-6">Pi5 agent system — roster, cron health, infrastructure</p>

      {/* Agent Roster */}
      {agents.length > 0 && (
        <SectionCard title={`Agent Roster (${agents.length})`} className="mb-6">
          <div className="space-y-3">
            {agents.map(a => (
              <div key={a.name} className="flex items-start gap-3 p-2 rounded-lg border border-border bg-card/50">
                <StatusDot status="good" size="md" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-foreground">{a.name}</span>
                    <span className="text-xs text-muted-foreground">— {a.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-mono text-muted-foreground">{a.mode}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.duty}</div>
                  <div className="text-[10px] text-muted-foreground/60 font-mono mt-0.5">{a.model} · {a.telegram}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Cron Schedule */}
      {crons.length > 0 && (
        <SectionCard title={`Cron Schedule (${crons.length} jobs)`} className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border bg-muted">
                  <th className="text-left py-2 pl-3 pr-2">Script</th>
                  <th className="text-left py-2 px-2">Schedule</th>
                  <th className="text-left py-2 px-2">Agent</th>
                  <th className="text-left py-2 px-2">Duty</th>
                  <th className="text-right py-2 pl-2 pr-3">Cost</th>
                </tr>
              </thead>
              <tbody>
                {crons.map((c, i) => (
                  <tr key={i} className={`border-b border-border/30 ${i % 2 === 1 ? 'bg-muted/50' : ''}`}>
                    <td className="py-2 pl-3 pr-2 font-mono text-[10px] text-primary">{c.script}</td>
                    <td className="py-2 px-2 text-muted-foreground">{c.schedule}</td>
                    <td className="py-2 px-2 text-foreground">{c.agent}</td>
                    <td className="py-2 px-2 text-muted-foreground">{c.duty}</td>
                    <td className="py-2 pl-2 pr-3 text-right font-mono text-muted-foreground">{c.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {/* Pi5 Health */}
      {healthMetrics.length > 0 && (
        <SectionCard title="Pi5 System Health" className="mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {healthMetrics.map(m => (
              <div key={m.metric} className="rounded-lg border border-border bg-card/50 p-2">
                <div className="text-[10px] text-muted-foreground uppercase">{m.metric}</div>
                <div className="text-sm font-mono text-foreground mt-0.5">{m.value}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Recent COO_INBOX */}
      {cooEntries.length > 0 && (
        <SectionCard title="Recent Agent Reports" className="mb-6">
          <div className="space-y-1">
            {cooEntries.map((entry, i) => (
              <div key={i} className="text-xs text-muted-foreground">{entry}</div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Full docs */}
      {indexMd && (
        <SectionCard title="Agent Operations Index" className="mb-6">
          <MarkdownRenderer content={indexMd} />
        </SectionCard>
      )}

      {!agentMd && !pi5HealthMd && (
        <p className="text-sm text-muted-foreground">Agent system data not available.</p>
      )}
    </div>
  );
}
