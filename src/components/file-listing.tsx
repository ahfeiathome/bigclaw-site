import Link from 'next/link';

interface FileListingProps {
  title: string;
  files: string[];
  basePath: string;
}

export function FileListing({ title, files, basePath }: FileListingProps) {
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">{title}</h1>
      {files.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-muted-foreground">No files found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {files.map((file) => (
            <Link
              key={file}
              href={`${basePath}/${file}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-card hover:border-primary/30 transition-all no-underline group"
            >
              <svg className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-sm text-foreground group-hover:text-primary font-mono">
                {file}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
