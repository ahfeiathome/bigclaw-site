import { fetchCeoInbox } from '@/lib/github';

export default async function BizDevPage() {
  const inbox = await fetchCeoInbox();

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Business Development</h2>
      <p className="text-xs text-muted mb-6">Source: company/CEO_INBOX.md — compiled by BDM (sage)</p>

      {inbox ? (
        <div className="border border-border rounded-lg p-6">
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground/80">
            {inbox}
          </pre>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-6 text-muted">
          <p>Unable to fetch CEO inbox from GitHub.</p>
          <p className="text-xs mt-2">
            Ensure GITHUB_TOKEN is set and the company repo is accessible.
          </p>
        </div>
      )}
    </div>
  );
}
