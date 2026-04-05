import { NextResponse } from 'next/server';
import { fetchBandwidth, fetchRadarDashboard, fetchRecentCommits } from '@/lib/github';

function parseMarkdownTable(section: string): { cells: string[] }[] {
  const lines = section.split('\n').filter(
    (l) => l.includes('|') && !l.match(/^\|[\s-|]+\|$/)
  );
  if (lines.length <= 1) return [];
  return lines.slice(1).map((line) => ({
    cells: line.split('|').map((c) => c.trim()).filter(Boolean),
  }));
}

function extractSection(content: string, heading: string): string {
  const regex = new RegExp(`^## ${heading}`, 'm');
  const match = content.search(regex);
  if (match === -1) return '';
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^## /)) { end = i; break; }
  }
  return lines.slice(0, end).join('\n');
}

export async function GET() {
  const [bandwidthMd, radarMd, commits] = await Promise.all([
    fetchBandwidth(),
    fetchRadarDashboard(),
    fetchRecentCommits(24),
  ]);

  // Agent status
  const agentRows = bandwidthMd ? parseMarkdownTable(extractSection(bandwidthMd, 'Current Agent Load')) : [];
  const activeAgents = agentRows.filter(r => r.cells[3]?.toLowerCase() === 'busy').length;
  const totalAgents = agentRows.length || 6;

  // RADAR
  const radarSummary = radarMd ? parseMarkdownTable(extractSection(radarMd, 'Portfolio Summary')) : [];
  const radarMeta: Record<string, string> = {};
  for (const row of radarSummary) {
    if (row.cells.length >= 2) radarMeta[row.cells[0]] = row.cells[1];
  }

  // Market hours (US Eastern, simplified)
  const now = new Date();
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = eastern.getDay();
  const hour = eastern.getHours();
  const minute = eastern.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  const marketOpen = day >= 1 && day <= 5 && timeInMinutes >= 570 && timeInMinutes < 960; // 9:30-16:00

  // Last sync — use most recent commit time
  let lastSync = 'unknown';
  if (commits.length > 0) {
    const lastCommitTime = new Date(commits[0].date);
    const diffMs = Date.now() - lastCommitTime.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) lastSync = 'just now';
    else if (diffMin < 60) lastSync = `${diffMin}m ago`;
    else lastSync = `${Math.floor(diffMin / 60)}h ago`;
  }

  return NextResponse.json({
    marketOpen,
    activeAgents,
    totalAgents,
    lastSync,
    radarEquity: radarMeta['Equity'] || '--',
    radarMode: radarMeta['Phase']?.includes('Live') ? 'Live' : 'Paper',
    commitCount: commits.length,
  });
}
