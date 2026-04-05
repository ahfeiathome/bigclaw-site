import { readDataFile } from './shared';

export interface AgentReport {
  id: string;
  agent: string;
  date: string;
  status: string;
  severity: string;
  summary: string;
}

export interface AgentsData {
  agents: AgentReport[];
}

export function parseAgents(): AgentsData | null {
  const content = readDataFile('agentInbox');
  if (!content) return null;

  const agents: AgentReport[] = [];

  // Split by ## REPORT-NNN headings
  const blocks = content.split(/(?=^## )/m);

  for (const block of blocks) {
    const headerMatch = block.match(/^## (\S+)\s*—\s*(\w+)\s*—\s*(.+)$/m);
    if (!headerMatch) continue;

    // Look for severity emoji
    let severity = 'unknown';
    if (block.includes('🔴')) severity = 'critical';
    else if (block.includes('🟡')) severity = 'warning';
    else if (block.includes('✅')) severity = 'ok';

    // Extract status from metadata
    const statusMatch = block.match(/Status\s*[|:]\s*(\w+)/i);
    const status = statusMatch?.[1] || 'unknown';

    // Extract executive summary (first paragraph after ### Executive Summary)
    const summaryMatch = block.match(/### Executive Summary\s*\n+(.+)/);
    const summary = summaryMatch?.[1]?.replace(/[🔴🟡✅]/g, '').trim() || '';

    agents.push({
      id: headerMatch[1],
      agent: headerMatch[2],
      date: headerMatch[3].trim(),
      status,
      severity,
      summary,
    });
  }

  return { agents };
}
