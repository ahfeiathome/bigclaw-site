import { fetchLessonsLearned } from '@/lib/github';
import { SectionCard } from '@/components/dashboard';

export default async function SDLCLessonsPage() {
  const lessonsMd = await fetchLessonsLearned();

  const lessonSections: { date: string; content: string }[] = [];
  if (lessonsMd) {
    const lines = lessonsMd.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^## (\d{4}-\d{2}-\d{2})/);
      if (match) {
        let end = lines.length;
        for (let j = i + 1; j < lines.length; j++) { if (lines[j].match(/^## /)) { end = j; break; } }
        lessonSections.push({ date: match[1], content: lines.slice(i + 1, end).join('\n').trim() });
      }
    }
  }

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>SDLC — Lessons Learned</h1>
      <p className="text-sm text-muted-foreground mb-6">Extracted session lessons by date</p>

      {lessonSections.length > 0 ? (
        <div className="space-y-4">
          {lessonSections.map((sec, i) => (
            <SectionCard key={i} title={sec.date}>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap">{sec.content || 'No lessons for this day.'}</div>
            </SectionCard>
          ))}
        </div>
      ) : (
        <SectionCard title="">
          <p className="text-sm text-muted-foreground">No lessons extracted yet. Session logs populate this page automatically.</p>
        </SectionCard>
      )}
    </div>
  );
}
