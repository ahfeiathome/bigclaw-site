import { readDataFile, extractSection, parseMarkdownTable } from './shared';

export interface RADARData {
  equity: string;
  dailyPL: string;
  phase: string;
  reserve: string;
  positions: { symbol: string; shares: string; entry: string; current: string; change: string }[];
  strategies: { name: string; status: string; regime: string }[];
  equityHistory: { date: string; value: number }[];
  tradingMode: Record<string, string>;
}

export function parseRADAR(): RADARData | null {
  const content = readDataFile('radarDashboard');
  if (!content) return null;

  // Portfolio Summary — key-value table
  const summarySection = extractSection(content, 'Portfolio Summary');
  const summaryRows = parseMarkdownTable(summarySection);
  const meta: Record<string, string> = {};
  for (const row of summaryRows) {
    const key = Object.values(row)[0];
    const val = Object.values(row)[1];
    if (key && val) meta[key] = val;
  }

  // Trading Mode table
  const modeSection = extractSection(content, 'Trading Mode');
  const modeRows = parseMarkdownTable(modeSection);
  const tradingMode: Record<string, string> = {};
  for (const row of modeRows) {
    const key = Object.values(row)[0];
    const val = Object.values(row)[1];
    if (key && val) tradingMode[key] = val;
  }

  // Positions — bullet list
  const positions: RADARData['positions'] = [];
  const posLines = content.match(/^- ([A-Z]+):.*$/gm) || [];
  for (const line of posLines) {
    const m = line.match(/^- ([A-Z]+):\s*(\d+)\s*(?:shares?)?\s*@\s*\$?([\d.]+)\s*→\s*\$?([\d.]+)\s*\(([^)]+)\)/);
    if (m) {
      positions.push({ symbol: m[1], shares: m[2], entry: m[3], current: m[4], change: m[5] });
    }
  }

  // Strategy Status table
  const stratSection = extractSection(content, 'Strategy Status');
  const stratRows = parseMarkdownTable(stratSection);
  const strategies = stratRows.map(r => ({
    name: r['Strategy'] || r['Name'] || Object.values(r)[0] || '',
    status: r['Status'] || Object.values(r)[1] || '',
    regime: r['Regime'] || Object.values(r)[2] || '',
  }));

  // Equity History
  const histSection = extractSection(content, 'Equity History');
  const histRows = parseMarkdownTable(histSection);
  const equityHistory = histRows.map(r => ({
    date: Object.values(r)[0] || '',
    value: parseFloat((Object.values(r)[1] || '0').replace(/[$,]/g, '')),
  })).filter(r => r.value > 0);

  return {
    equity: meta['Equity'] || '--',
    dailyPL: meta['Daily P/L'] || '--',
    phase: meta['Phase'] || '--',
    reserve: meta['Reserve'] || '--',
    positions,
    strategies,
    equityHistory,
    tradingMode,
  };
}
