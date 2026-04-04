const OWNER = 'ahfeiathome';

export function ViewSource({ repo, path }: { repo: string; path: string }) {
  const url = `https://github.com/${OWNER}/${repo}/blob/main/${path}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary no-underline font-mono transition-colors"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
      View source
    </a>
  );
}
