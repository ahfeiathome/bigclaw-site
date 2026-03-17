import { fetchFinanceData } from '@/lib/github';

export default async function FinancePage() {
  const finance = await fetchFinanceData();

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Financial Health</h2>
      <p className="text-xs text-muted mb-6">Source: company/FINANCE.md — compiled by CFO (rex)</p>

      {finance ? (
        <div className="border border-border rounded-lg p-6">
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed text-foreground/80">
            {finance}
          </pre>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-6 text-muted">
          <p>Unable to fetch financial data from GitHub.</p>
          <p className="text-xs mt-2">
            Ensure GITHUB_TOKEN is set and the company repo is accessible.
          </p>
        </div>
      )}
    </div>
  );
}
