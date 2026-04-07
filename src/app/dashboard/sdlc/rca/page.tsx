import { fetchLearnings } from '@/lib/github';
import { SectionCard } from '@/components/dashboard';
import { parseLearningsEntries } from '../helpers';

export default async function SDLCRcaPage() {
  const learningsMd = await fetchLearnings();
  const devEntries = learningsMd ? parseLearningsEntries(learningsMd) : [];

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>SDLC — Root Cause Analysis</h1>
      <p className="text-sm text-muted-foreground mb-6">DEV-### entries with problem, root cause, and prevention</p>

      {devEntries.length > 0 ? (
        <div className="space-y-3">
          {devEntries.map(entry => (
            <SectionCard key={entry.id} title="">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono font-bold text-primary text-sm">{entry.id}</span>
                {entry.company && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono">{entry.company}</span>}
                {entry.project && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">{entry.project}</span>}
                {entry.date && <span className="text-xs text-muted-foreground font-mono">{entry.date}</span>}
              </div>
              <div className="text-sm text-foreground font-medium mb-2">{entry.title}</div>
              {entry.problem && <div className="text-xs text-muted-foreground mb-1"><span className="text-red-400 font-semibold">Problem:</span> {entry.problem}</div>}
              {entry.rootCause && <div className="text-xs text-muted-foreground mb-1"><span className="text-amber-400 font-semibold">Root Cause:</span> {entry.rootCause}</div>}
              {entry.prevention && <div className="text-xs text-muted-foreground mb-1"><span className="text-green-400 font-semibold">Prevention:</span> {entry.prevention}</div>}
              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {entry.tags.map(tag => <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">#{tag}</span>)}
                </div>
              )}
            </SectionCard>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No DEV entries found. Bug RCA entries are extracted from growth/LEARNINGS.md.</p>
      )}
    </div>
  );
}
