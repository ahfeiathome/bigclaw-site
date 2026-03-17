import { fetchMarketing } from '@/lib/github';

export default async function MarketingPage() {
  const marketing = await fetchMarketing();

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Marketing</h2>
      <p className="text-xs text-muted mb-6">Source: company/MARKETING.md — compiled by CMO (lumina)</p>

      {marketing ? (
        <div className="border border-border rounded-lg p-6">
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground/80">
            {marketing}
          </pre>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-6 text-muted">
          <p>Unable to fetch marketing data from GitHub.</p>
          <p className="text-xs mt-2">
            Ensure GITHUB_TOKEN is set and the company repo is accessible.
          </p>
        </div>
      )}
    </div>
  );
}
