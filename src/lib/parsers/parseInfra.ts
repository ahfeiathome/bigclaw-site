import { readDataFile, parseMarkdownTable, extractSubSection } from './shared';

export interface InfraService {
  service: string;
  purpose: string;
  usedBy: string;
  freeTier: string;
  paidTier: string;
  current: string;
  action: string;
  category: string;
}

export interface InfraData {
  services: InfraService[];
  recommendations: { category: string; items: { tool: string; purpose: string; priority: string }[] }[];
}

export function parseInfra(): InfraData | null {
  const content = readDataFile('infraAssessment');
  if (!content) return null;

  const services: InfraService[] = [];

  // UPGRADE NOW section
  const upgradeSection = extractSubSection(content, 'UPGRADE NOW');
  const upgradeRows = parseMarkdownTable(upgradeSection);
  for (const r of upgradeRows) {
    services.push({
      service: r['Service'] || Object.values(r)[0] || '',
      purpose: r['Purpose'] || Object.values(r)[1] || '',
      usedBy: r['Used By'] || Object.values(r)[2] || '',
      freeTier: r['Free Tier'] || Object.values(r)[3] || '',
      paidTier: r['Paid Tier'] || Object.values(r)[4] || '',
      current: r['Current'] || Object.values(r)[5] || '',
      action: r['Action'] || Object.values(r)[6] || '',
      category: 'upgrade',
    });
  }

  // STAY FREE section
  const staySection = extractSubSection(content, 'STAY FREE');
  const stayRows = parseMarkdownTable(staySection);
  for (const r of stayRows) {
    services.push({
      service: r['Service'] || Object.values(r)[0] || '',
      purpose: r['Purpose'] || Object.values(r)[1] || '',
      usedBy: r['Used By'] || Object.values(r)[2] || '',
      freeTier: r['Free Tier'] || Object.values(r)[3] || '',
      paidTier: r['Paid Tier'] || Object.values(r)[4] || '',
      current: r['Current'] || Object.values(r)[5] || '',
      action: r['Action'] || Object.values(r)[6] || '',
      category: 'free',
    });
  }

  // Recommendations
  const recommendations: InfraData['recommendations'] = [];
  for (const cat of ['HIGH VALUE', 'NICE TO HAVE', 'NOT NEEDED NOW']) {
    const sec = extractSubSection(content, cat);
    const rows = parseMarkdownTable(sec);
    if (rows.length > 0) {
      recommendations.push({
        category: cat,
        items: rows.map(r => ({
          tool: Object.values(r)[0] || '',
          purpose: Object.values(r)[1] || '',
          priority: cat,
        })),
      });
    }
  }

  return { services, recommendations };
}
