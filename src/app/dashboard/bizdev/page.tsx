import { fetchCeoInbox, fetchMarketing } from '@/lib/github';

function buildGrowthSummary(inbox: string | null, marketing: string | null): string[] {
  const lines: string[] = [];

  if (inbox) {
    // Count actionable items
    const actionItems = (inbox.match(/^[-*]\s/gm) || []).length;
    const cpItems = (inbox.match(/CP-\d+/g) || []);
    if (actionItems > 0) {
      lines.push(`${actionItems} items in the COO inbox requiring review.`);
    }
    if (cpItems.length > 0) {
      lines.push(`${cpItems.length} checkpoint reference(s) linked to biz dev activities.`);
    }
  } else {
    lines.push('No active biz dev items in the COO inbox.');
  }

  if (marketing) {
    const lower = marketing.toLowerCase();
    if (lower.includes('campaign') || lower.includes('launch')) {
      lines.push('Marketing campaigns or launch activities documented — review below.');
    }
    if (lower.includes('seo') || lower.includes('content')) {
      lines.push('Content/SEO strategy in progress.');
    }
    if (!lower.includes('campaign') && !lower.includes('seo') && !lower.includes('content')) {
      lines.push('Marketing strategy documented. See details below.');
    }
  } else {
    lines.push('No marketing data available yet.');
  }

  return lines;
}

export default async function GrowthPage() {
  const [inbox, marketing] = await Promise.all([
    fetchCeoInbox(),
    fetchMarketing(),
  ]);

  const execLines = buildGrowthSummary(inbox, marketing);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Growth</h2>
      <p className="text-xs text-muted mb-6">
        Biz Dev (sage) + Marketing (lumina) — sources: COO_INBOX.md, MARKETING.md
      </p>

      <div className="border border-border rounded-lg p-5 mb-6 bg-zinc-900/50">
        <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-3">Executive Summary</div>
        <div className="space-y-1.5">
          {execLines.map((line, i) => (
            <p key={i} className="text-xs text-foreground/80 leading-relaxed">{line}</p>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {/* Biz Dev */}
        <div className="border border-border rounded-lg p-5">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wide mb-3">
            Business Development
          </div>
          {inbox ? (
            <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed text-foreground/80 max-h-[500px] overflow-y-auto">
              {inbox}
            </pre>
          ) : (
            <div className="text-xs text-muted">No biz dev data available.</div>
          )}
        </div>

        {/* Marketing */}
        <div className="border border-border rounded-lg p-5">
          <div className="text-xs font-semibold text-pink-400 uppercase tracking-wide mb-3">
            Marketing
          </div>
          {marketing ? (
            <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed text-foreground/80 max-h-[500px] overflow-y-auto">
              {marketing}
            </pre>
          ) : (
            <div className="text-xs text-muted">No marketing data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
