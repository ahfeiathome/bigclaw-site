import { SectionCard } from './dashboard';
import { CollapsibleSection } from './collapsible-section';

interface TodoItem { num: string; item: string; detail: string; type: string; time: string; unblocks: string }

function parseTodoSection(content: string, heading: string): TodoItem[] {
  const regex = new RegExp(`### ${heading}`, 'i');
  const match = content.search(regex);
  if (match === -1) return [];
  const rest = content.slice(match);
  const lines = rest.split('\n');
  let end = lines.length;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].match(/^###? /)) { end = i; break; }
  }
  const section = lines.slice(0, end).join('\n');

  const items: TodoItem[] = [];
  for (const line of section.split('\n')) {
    if (!line.startsWith('|') || line.match(/^\|[\s-|]+\|$/) || line.includes('| # |')) continue;
    const cols = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cols.length < 5 || !cols[0].match(/^\d+$/)) continue;
    const fullItem = cols[1].replace(/\*\*/g, '');
    const [name, ...rest] = fullItem.split('—');
    items.push({
      num: cols[0],
      item: name.trim(),
      detail: rest.join('—').trim(),
      type: cols[2],
      time: cols[3],
      unblocks: cols[4],
    });
  }
  return items;
}

function typeIcon(type: string): string {
  if (type.includes('money') || type.includes('💳')) return '💳';
  if (type.includes('legal') || type.includes('⚖️')) return '⚖️';
  if (type.includes('decision') || type.includes('🧠')) return '🧠';
  return '📋';
}

function typeBg(type: string): string {
  if (type.includes('money') || type.includes('💳')) return 'bg-blue-500/10 text-blue-400';
  if (type.includes('legal') || type.includes('⚖️')) return 'bg-purple-500/10 text-purple-400';
  if (type.includes('decision') || type.includes('🧠')) return 'bg-amber-500/10 text-amber-400';
  return 'bg-muted text-muted-foreground';
}

function TodoCard({ item }: { item: TodoItem }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base">{typeIcon(item.type)}</span>
        <span className="text-sm font-medium text-foreground">{item.item}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${typeBg(item.type)}`}>{item.type}</span>
        <span className="text-[10px] text-muted-foreground font-mono ml-auto">{item.time}</span>
      </div>
      {item.detail && <p className="text-xs text-muted-foreground ml-7">{item.detail}</p>}
      <p className="text-xs text-muted-foreground ml-7 mt-0.5">Unblocks: {item.unblocks}</p>
    </div>
  );
}

function parseInvestmentPortfolio(content: string): { cells: string[] }[] {
  const start = content.indexOf('## 📈 Investment Portfolio');
  const end = content.indexOf('## Priority Timeline');
  if (start === -1 || end === -1) return [];
  const section = content.slice(start, end);
  return section.split('\n')
    .filter(l => l.startsWith('|') && !l.match(/^\|[\s-|]+\|$/) && !l.includes('Account'))
    .map(line => ({ cells: line.split('|').map(c => c.trim()).filter(Boolean) }));
}

function parseDependencyChains(content: string): string[] {
  const start = content.indexOf('## Dependency Chains');
  if (start === -1) return [];
  const section = content.slice(start);
  const codeMatch = section.match(/```([\s\S]*?)```/);
  if (!codeMatch) return [];
  return codeMatch[1].split('\n').filter(l => l.trim());
}

export function ActionItems({ todoMd }: { todoMd: string | null }) {
  if (!todoMd) return null;

  const thisWeek = parseTodoSection(todoMd, 'THIS WEEK.*');
  const byApril10 = parseTodoSection(todoMd, 'BY APRIL 10');
  const afterNaming = parseTodoSection(todoMd, 'AFTER NAMING.*');
  const phase0Gate = parseTodoSection(todoMd, 'APRIL 18.*');
  const whenReady = parseTodoSection(todoMd, 'WHEN READY.*');
  const portfolio = parseInvestmentPortfolio(todoMd);
  const chains = parseDependencyChains(todoMd);
  const allItems = [...thisWeek, ...byApril10, ...afterNaming, ...phase0Gate, ...whenReady];

  if (allItems.length === 0) return null;

  return (
    <div className="mb-6">
      {/* This Week — always expanded as cards */}
      {thisWeek.length > 0 && (
        <SectionCard title={`Action Items — This Week (${thisWeek.length})`} className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {thisWeek.map((item, i) => <TodoCard key={i} item={item} />)}
          </div>
        </SectionCard>
      )}

      {/* Upcoming — collapsed */}
      {(byApril10.length > 0 || afterNaming.length > 0) && (
        <div className="mb-4">
          <CollapsibleSection title={`Upcoming (${byApril10.length + afterNaming.length})`} defaultOpen={false}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1">
              {[...byApril10, ...afterNaming].map((item, i) => <TodoCard key={i} item={item} />)}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Investment Portfolio — collapsed */}
      {portfolio.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title={`Investment Portfolio (${portfolio.length})`} defaultOpen={false}>
            <div className="rounded-xl border border-border bg-card p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-muted-foreground border-b border-border">
                    <th className="text-left py-2 pr-3">Account</th>
                    <th className="text-right py-2 px-2">Balance</th>
                    <th className="text-left py-2 px-2">Current</th>
                    <th className="text-left py-2 px-2">Proposed</th>
                    <th className="text-right py-2 px-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      {row.cells.slice(0, 5).map((cell, ci) => (
                        <td key={ci} className={`py-1.5 ${ci === 0 ? 'text-foreground font-medium pr-3' : ci === 1 || ci === 4 ? 'text-right px-2 font-mono text-muted-foreground' : 'text-left px-2 text-muted-foreground'}`}>
                          {cell.replace(/\*\*/g, '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Dependency Chains — collapsed */}
      {chains.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title="Dependency Chains" defaultOpen={false}>
            <div className="rounded-xl border border-border bg-card p-4">
              <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">{chains.join('\n')}</pre>
            </div>
          </CollapsibleSection>
        </div>
      )}
    </div>
  );
}
