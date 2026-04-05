import { readDataFile, extractSection, parseMarkdownTable } from './shared';

export interface CostModelData {
  burn: number;
  burnLabel: string;
  revenue: number;
  projections: { users: string; cost: string; revenue: string }[];
  unitEconomics: { product: string; costPerUnit: string; margin: string; model: string }[];
  infraTable: { service: string; purpose: string; cost: string; tier: string }[];
}

export function parseCostModel(): CostModelData | null {
  const content = readDataFile('costModel');
  if (!content) return null;

  // §7 Combined Monthly Spend — look for burn figure
  let burn = 0;
  let burnLabel = '~$5/mo';
  const burnMatch = content.match(/(?:total|combined|monthly).*?\$(\d+[\d,.]*)/i);
  if (burnMatch) {
    burn = parseFloat(burnMatch[1].replace(/,/g, ''));
    burnLabel = `$${burn}/mo`;
  }

  // Revenue — look for revenue line
  const revenueMatch = content.match(/revenue.*?\$(\d+[\d,.]*)/i);
  const revenue = revenueMatch ? parseFloat(revenueMatch[1].replace(/,/g, '')) : 0;

  // §3 Scale projections table
  const scaleSection = extractSection(content, 'Scale Projections') || extractSection(content, '3.');
  const scaleRows = parseMarkdownTable(scaleSection);
  const projections = scaleRows.map(r => ({
    users: r['Users'] || r['Scale'] || Object.values(r)[0] || '',
    cost: r['Cost'] || r['Monthly Cost'] || Object.values(r)[1] || '',
    revenue: r['Revenue'] || r['Monthly Revenue'] || Object.values(r)[2] || '',
  }));

  // §2 Unit economics per product
  const unitSections = ['2A', '2B', '2C', '2D', '2E'].map(s =>
    extractSection(content, s) || ''
  ).filter(Boolean);

  const unitEconomics: CostModelData['unitEconomics'] = [];
  for (const sec of unitSections) {
    const nameMatch = sec.match(/##\s*\S+\s+(.+?)(?:\s*[-—]|$)/m);
    const product = nameMatch?.[1]?.trim() || 'Unknown';
    const marginMatch = sec.match(/margin.*?(\d+[\d.]*%)/i);
    const costMatch = sec.match(/cost.*?\$(\d+[\d,.]*)/i);
    const modelMatch = sec.match(/(?:sonnet|haiku|opus|claude)[\s\d.]*/i);
    unitEconomics.push({
      product,
      costPerUnit: costMatch ? `$${costMatch[1]}` : '--',
      margin: marginMatch ? marginMatch[1] : '--',
      model: modelMatch ? modelMatch[0].trim() : '--',
    });
  }

  // §4 Infra table
  const infraSection = extractSection(content, 'Infrastructure Costs') || extractSection(content, '4.');
  const infraRows = parseMarkdownTable(infraSection);
  const infraTable = infraRows.map(r => ({
    service: r['Service'] || Object.values(r)[0] || '',
    purpose: r['Purpose'] || Object.values(r)[1] || '',
    cost: r['Cost'] || r['Monthly'] || Object.values(r)[2] || '',
    tier: r['Tier'] || r['Plan'] || Object.values(r)[3] || '',
  }));

  return { burn, burnLabel, revenue, projections, unitEconomics, infraTable };
}
