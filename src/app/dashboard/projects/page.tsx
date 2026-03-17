import { fetchAgentsTasks, fetchCheckpoint } from '@/lib/github';

export default async function ProjectsPage() {
  const [tasks, checkpoint] = await Promise.all([
    fetchAgentsTasks(),
    fetchCheckpoint(),
  ]);

  const doneTasks = tasks.filter((t) => t.includes('✅ DONE'));
  const todoTasks = tasks.filter((t) => t.includes('⏳ TODO'));
  const blockedTasks = tasks.filter(
    (t) => t.includes('BLOCKED') || t.includes('LATER'),
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Project Status</h2>
      <p className="text-xs text-muted mb-6">
        Source: learnie-ai/AGENTS.md + CHECKPOINT.md — compiled by CDO (koda)
      </p>

      <div className="space-y-6">
        {/* Learnie AI status */}
        <div className="border border-border rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-semibold">Learnie AI</h3>
            <span className="text-xs font-mono px-2 py-0.5 bg-green-500/10 text-green-400 rounded">
              v0.5
            </span>
            <a
              href="https://learnie-ai-ten.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-accent ml-auto"
            >
              Live →
            </a>
          </div>

          {/* TODO tasks */}
          {todoTasks.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">
                TODO ({todoTasks.length})
              </h4>
              {todoTasks.map((t, i) => (
                <div key={i} className="text-xs font-mono text-foreground/80 py-1 truncate">
                  {t.replace(/\|/g, '').trim()}
                </div>
              ))}
            </div>
          )}

          {/* Blocked tasks */}
          {blockedTasks.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-2">
                Blocked / Later ({blockedTasks.length})
              </h4>
              {blockedTasks.map((t, i) => (
                <div key={i} className="text-xs font-mono text-foreground/60 py-1 truncate">
                  {t.replace(/\|/g, '').trim()}
                </div>
              ))}
            </div>
          )}

          {/* Done tasks */}
          {doneTasks.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wide mb-2">
                Done ({doneTasks.length})
              </h4>
              <div className="max-h-64 overflow-y-auto">
                {doneTasks.map((t, i) => (
                  <div key={i} className="text-xs font-mono text-foreground/40 py-1 truncate">
                    {t.replace(/\|/g, '').trim()}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Latest checkpoint */}
        <div className="border border-border rounded-lg p-5">
          <h3 className="font-semibold mb-3">Latest Checkpoint</h3>
          {checkpoint ? (
            <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed text-foreground/80 max-h-96 overflow-y-auto">
              {checkpoint.slice(0, 2000)}
            </pre>
          ) : (
            <p className="text-sm text-muted">Unable to fetch checkpoint data.</p>
          )}
        </div>
      </div>
    </div>
  );
}
