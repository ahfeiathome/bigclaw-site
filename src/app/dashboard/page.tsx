import {
  fetchAgentsTasks,
  fetchFinanceData,
  fetchCheckpoint,
  fetchCeoInbox,
} from '@/lib/github';

function Card({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        {badge && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-accent/10 text-accent rounded">
            {badge}
          </span>
        )}
      </div>
      <div className="text-sm text-muted">{children}</div>
    </div>
  );
}

function extractSection(content: string, heading: string): string {
  const lines = content.split('\n');
  const startIdx = lines.findIndex((l) => l.includes(heading));
  if (startIdx === -1) return '';

  const endIdx = lines.findIndex(
    (l, i) => i > startIdx && l.startsWith('## ') && !l.includes(heading),
  );
  return lines
    .slice(startIdx + 1, endIdx === -1 ? startIdx + 20 : endIdx)
    .join('\n')
    .trim();
}

export default async function DashboardOverview() {
  const [tasks, finance, checkpoint, inbox] = await Promise.all([
    fetchAgentsTasks(),
    fetchFinanceData(),
    fetchCheckpoint(),
    fetchCeoInbox(),
  ]);

  const doneCount = tasks.filter((t) => t.includes('✅ DONE')).length;
  const todoCount = tasks.filter((t) => t.includes('⏳ TODO')).length;
  const blockedCount = tasks.filter(
    (t) => t.includes('BLOCKED') || t.includes('LATER'),
  ).length;

  // Extract latest checkpoint status
  const latestCp = checkpoint
    ? extractSection(checkpoint, 'CP-029-DONE') || 'No recent checkpoint'
    : 'Unable to fetch';

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{doneCount}</div>
          <div className="text-xs text-muted mt-1">Tasks Done</div>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-accent">{todoCount}</div>
          <div className="text-xs text-muted mt-1">TODO</div>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{blockedCount}</div>
          <div className="text-xs text-muted mt-1">Blocked / Later</div>
        </div>
        <div className="border border-border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-foreground">
            {doneCount + todoCount + blockedCount}
          </div>
          <div className="text-xs text-muted mt-1">Total Tasks</div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Financial Health" badge="CFO/rex">
          {finance ? (
            <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">
              {extractSection(finance, 'Summary') ||
                finance.slice(0, 500)}
            </pre>
          ) : (
            <p>Unable to fetch financial data from GitHub.</p>
          )}
        </Card>

        <Card title="Latest Checkpoint" badge="CDO/koda">
          <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">
            {latestCp.slice(0, 500)}
          </pre>
        </Card>

        <Card title="Task Queue" badge="AGENTS.md">
          <div className="space-y-1">
            {tasks.slice(0, 10).map((task, i) => (
              <div key={i} className="text-xs font-mono truncate">
                {task.replace(/\|/g, '').trim()}
              </div>
            ))}
            {tasks.length === 0 && <p>Unable to fetch tasks.</p>}
          </div>
        </Card>

        <Card title="Venture Pipeline" badge="BDM/sage">
          {inbox ? (
            <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">
              {extractSection(inbox, 'Active') ||
                extractSection(inbox, 'BIZ-') ||
                inbox.slice(0, 500)}
            </pre>
          ) : (
            <p>Unable to fetch CEO inbox from GitHub.</p>
          )}
        </Card>
      </div>

      <p className="text-xs text-muted text-center">
        Data refreshes every 5 minutes from GitHub. Last render:{' '}
        {new Date().toISOString().slice(0, 19)}Z
      </p>
    </div>
  );
}
