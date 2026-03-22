import { fetchCeoInbox, fetchMarketing } from '@/lib/github';

export default async function GrowthPage() {
  const [inbox, marketing] = await Promise.all([
    fetchCeoInbox(),
    fetchMarketing(),
  ]);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Growth</h2>
      <p className="text-xs text-muted mb-6">
        Biz Dev (sage) + Marketing (lumina) — sources: COO_INBOX.md, MARKETING.md
      </p>

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
