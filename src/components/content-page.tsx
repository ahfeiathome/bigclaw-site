import { MarkdownRenderer } from './markdown-renderer';

interface ContentPageProps {
  title: string;
  content: string | null;
  sourcePath?: string;
}

export function ContentPage({ title, content, sourcePath }: ContentPageProps) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {sourcePath && (
          <span className="text-xs text-muted-foreground font-mono">{sourcePath}</span>
        )}
      </div>
      {content ? (
        <MarkdownRenderer content={content} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No content available</p>
          {sourcePath && (
            <p className="text-xs text-muted-foreground mt-2 font-mono">{sourcePath}</p>
          )}
        </div>
      )}
    </div>
  );
}
