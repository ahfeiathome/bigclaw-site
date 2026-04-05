import { readDataFile, extractSection, parseMarkdownTable } from './shared';

export interface PortfolioAccount {
  account: string;
  balance: string;
  currentPicks: string;
  proposedPicks: string;
  percent: string;
}

export interface PortfolioTicker {
  ticker: string;
  company: string;
  category: string;
  thesis: string;
  risk: string;
}

export interface CatalystEvent {
  date: string;
  event: string;
  impact: string;
}

export interface PortfolioData {
  accounts: PortfolioAccount[];
  tickers: PortfolioTicker[];
  timeline: CatalystEvent[];
}

export function parsePortfolio(): PortfolioData | null {
  const content = readDataFile('investmentPortfolio');
  if (!content) return null;

  // Master Allocation Table
  const allocSection = extractSection(content, 'Master Allocation Table')
    || extractSection(content, 'Allocation');
  const allocRows = parseMarkdownTable(allocSection);
  const accounts = allocRows.map(r => ({
    account: r['Account'] || Object.values(r)[0] || '',
    balance: r['Balance'] || Object.values(r)[1] || '',
    currentPicks: r['Current Picks'] || Object.values(r)[2] || '',
    proposedPicks: r['Proposed Picks'] || Object.values(r)[3] || '',
    percent: r['%'] || Object.values(r)[4] || '',
  }));

  // Ticker reference
  const tickerSection = extractSection(content, 'Proposed Picks')
    || extractSection(content, 'Ticker Reference');
  const tickerRows = parseMarkdownTable(tickerSection);
  const tickers = tickerRows.map(r => ({
    ticker: r['Ticker'] || Object.values(r)[0] || '',
    company: r['Company'] || Object.values(r)[1] || '',
    category: r['Category'] || Object.values(r)[2] || '',
    thesis: r['Thesis'] || Object.values(r)[3] || '',
    risk: r['Risk'] || Object.values(r)[4] || '',
  }));

  // Key Catalysts timeline
  const catSection = extractSection(content, 'Key Catalysts');
  const catRows = parseMarkdownTable(catSection);
  const timeline = catRows.map(r => ({
    date: r['Date'] || Object.values(r)[0] || '',
    event: r['Event'] || Object.values(r)[1] || '',
    impact: r['Impact'] || Object.values(r)[2] || '',
  }));

  return { accounts, tickers, timeline };
}
