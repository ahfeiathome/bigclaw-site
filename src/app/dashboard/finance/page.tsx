import { fetchFinanceData } from '@/lib/github';

function buildFinanceSummary(content: string): string[] {
  const lines: string[] = [];
  const lower = content.toLowerCase();

  // Try to extract burn / cost info
  const burnMatch = content.match(/burn[:\s]+\$?([\d,.]+)/i);
  if (burnMatch) {
    lines.push(`Monthly burn rate: $${burnMatch[1]}.`);
  }

  // Free tier detection
  if (lower.includes('free tier') || lower.includes('free-tier')) {
    const freeMatch = content.match(/free[- ]tier[^.]*\d+%[^.]*/i);
    lines.push(freeMatch ? `Free-tier usage: ${freeMatch[0].trim()}.` : 'Operating within free-tier limits where possible.');
  }

  // Cost trajectory
  if (lower.includes('increase') || lower.includes('rising')) {
    lines.push('Cost trajectory trending upward — review line items below.');
  } else if (lower.includes('decrease') || lower.includes('stable') || lower.includes('flat')) {
    lines.push('Cost trajectory stable or declining. No immediate budget concerns.');
  }

  // Warnings
  if (lower.includes('warning') || lower.includes('⚠') || lower.includes('over budget')) {
    lines.push('Financial warnings detected — see details below.');
  }

  if (lines.length === 0) {
    lines.push('Financial data loaded. Review the breakdown below for current cost posture.');
  }

  return lines;
}

export default async function FinancePage() {
  const finance = await fetchFinanceData();
  const execLines = finance ? buildFinanceSummary(finance) : [];

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Financial Health</h2>
      <p className="text-xs text-muted mb-6">Source: company/FINANCE.md — compiled by CFO (rex)</p>

      {finance && execLines.length > 0 && (
        <div className="border border-border rounded-lg p-5 mb-6 bg-zinc-900/50">
          <div className="text-xs font-semibold text-amber-400 uppercase tracking-wide mb-3">Executive Summary</div>
          <div className="space-y-1.5">
            {execLines.map((line, i) => (
              <p key={i} className="text-xs text-foreground/80 leading-relaxed">{line}</p>
            ))}
          </div>
        </div>
      )}

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
