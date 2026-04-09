import { StatusDot } from './dashboard';

interface CronJob {
  script: string;
  schedule: string;
  agent: string;
}

export function CronHealthLights({ agentMd }: { agentMd: string | null }) {
  if (!agentMd) return <p className="text-xs text-muted-foreground">Agent system data not available.</p>;

  const cronSection = agentMd.split('## Cron Schedule')[1]?.split('## ')[0] || '';
  const crons: CronJob[] = cronSection.split('\n')
    .filter(l => l.startsWith('|') && l.includes('`') && !l.includes('Script') && !l.match(/^\|[\s-:|]+\|$/))
    .map(l => {
      const c = l.split('|').map(s => s.trim()).filter(Boolean);
      return { script: c[0]?.replace(/`/g, ''), schedule: c[1], agent: c[2] };
    });

  if (crons.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
      {crons.map(c => (
        <div key={c.script} className="flex items-center gap-1.5 rounded border border-border/50 bg-card/30 px-2 py-1">
          <StatusDot status="good" size="sm" />
          <div className="min-w-0">
            <div className="text-[9px] font-mono text-foreground truncate">{c.script}</div>
            <div className="text-[8px] text-muted-foreground">{c.schedule}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
