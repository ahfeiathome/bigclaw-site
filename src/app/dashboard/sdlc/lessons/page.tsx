import { fetchLessonsLearned } from '@/lib/github';
import { SectionCard } from '@/components/dashboard';

export default async function SDLCLessonsPage() {
  const lessonsMd = await fetchLessonsLearned();

  // Parse daily sections
  const sections: { date: string; content: string }[] = [];
  if (lessonsMd) {
    const lines = lessonsMd.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^## (\d{4}-\d{2}-\d{2})\s*—?\s*(.*)/);
      if (match) {
        let end = lines.length;
        for (let j = i + 1; j < lines.length; j++) {
          if (lines[j].match(/^## /)) { end = j; break; }
        }
        sections.push({
          date: match[1],
          content: lines.slice(i + 1, end).join('\n').trim(),
        });
      }
    }
  }

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>SDLC — Lessons Learned</h1>
      <p className="text-sm text-muted-foreground mb-6">Auto-extracted from session logs (nightly cron)</p>

      {sections.length > 0 ? (
        <div className="space-y-4">
          {sections.map((sec, i) => (
            <SectionCard key={i} title={sec.date}>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{sec.content || 'No lessons extracted for this day.'}</div>
            </SectionCard>
          ))}
        </div>
      ) : (
        <SectionCard title="No lessons extracted yet">
          <p className="text-sm text-muted-foreground">
            The nightly cron reads session logs from <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">knowledge/sessions/</code> and
            extracts patterns, regressions, and violations into this page. Run sessions to populate.
          </p>
        </SectionCard>
      )}
    </div>
  );
}
