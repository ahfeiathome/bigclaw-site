'use client';

import { useState } from 'react';

interface PageActionsProps {
  /** GitHub repo + path for Obsidian link, e.g. "the-firm/PATROL_REPORT.md" */
  sourcePath?: string;
}

export function PageActions({ sourcePath }: PageActionsProps) {
  const [copied, setCopied] = useState(false);

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePrint() {
    window.print();
  }

  // Obsidian deep link: obsidian://open?vault=BigClaw&file=path
  const obsidianUrl = sourcePath
    ? `obsidian://open?vault=BigClaw&file=${encodeURIComponent(sourcePath)}`
    : null;

  return (
    <div className="flex items-center gap-2 print:hidden">
      {/* PDF / Print */}
      <button
        onClick={handlePrint}
        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary font-mono transition-colors px-2 py-1 rounded border border-border hover:border-primary/30"
        title="Print / Save as PDF"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
        </svg>
        PDF
      </button>

      {/* Obsidian */}
      {obsidianUrl && (
        <a
          href={obsidianUrl}
          className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary font-mono transition-colors px-2 py-1 rounded border border-border hover:border-primary/30 no-underline"
          title="Open in Obsidian"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Obsidian
        </a>
      )}

      {/* Share */}
      <button
        onClick={handleShare}
        className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary font-mono transition-colors px-2 py-1 rounded border border-border hover:border-primary/30"
        title="Copy link"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {copied ? 'Copied!' : 'Share'}
      </button>
    </div>
  );
}
