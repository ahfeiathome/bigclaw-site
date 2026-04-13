import { fetchMichaelTodo } from '@/lib/github';
import { SectionCard, SignalPill, StatusDot } from '@/components/dashboard';
import { ViewSource } from '@/components/view-source';
import { CollapsibleSection } from '@/components/collapsible-section';

interface TodoItem { num: string; item: string; detail: string; type: string; time: string; unblocks: string }

function parseTodoSection(content: string, heading: string): TodoItem[] {
  // Find section by heading
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
  if (type.includes('💳')) return '💳';
  if (type.includes('⚖️')) return '⚖️';
  if (type.includes('🧠')) return '🧠';
  return '📋';
}

function typeBg(type: string): string {
  if (type.includes('💳')) return 'bg-blue-500/10 text-blue-400';
  if (type.includes('⚖️')) return 'bg-purple-500/10 text-purple-400';
  if (type.includes('🧠')) return 'bg-amber-500/10 text-amber-400';
  return 'bg-muted text-muted-foreground';
}

function TodoRow({ item }: { item: TodoItem }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border last:border-0">
      <span className="text-lg mt-0.5">{typeIcon(item.type)}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{item.item}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${typeBg(item.type)}`}>{item.type}</span>
          <span className="text-[10px] text-muted-foreground font-mono ml-auto shrink-0">{item.time}</span>
        </div>
        {item.detail && <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>}
        <p className="text-xs text-muted-foreground mt-0.5">Unblocks: {item.unblocks}</p>
      </div>
    </div>
  );
}

function parseInvestmentPortfolio(content: string): { cells: string[] }[] {
  const section = content.slice(
    content.indexOf('## 📈 Investment Portfolio'),
    content.indexOf('## Priority Timeline')
  );
  if (!section) return [];
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

export default async function FounderTodoPage() {
  const todoMd = await fetchMichaelTodo();

  if (!todoMd) {
    return (
      <div className="text-center py-20 text-muted-foreground animate-fade-in">
        <div className="text-3xl font-mono mb-2">--</div>
        <div>Unable to fetch sponsor TODO data.</div>
      </div>
    );
  }

  const thisWeek = parseTodoSection(todoMd, 'THIS WEEK.*');
  const byApril10 = parseTodoSection(todoMd, 'BY APRIL 10');
  const afterNaming = parseTodoSection(todoMd, 'AFTER NAMING.*');
  const phase0Gate = parseTodoSection(todoMd, 'APRIL 18.*');
  const whenReady = parseTodoSection(todoMd, 'WHEN READY.*');
  const portfolio = parseInvestmentPortfolio(todoMd);
  const chains = parseDependencyChains(todoMd);

  const totalItems = thisWeek.length + byApril10.length + afterNaming.length + phase0Gate.length + whenReady.length;
  const moneyItems = [thisWeek, byApril10, afterNaming, phase0Gate, whenReady].flat().filter(i => i.type.includes('💳')).length;
  const legalItems = [thisWeek, byApril10, afterNaming, phase0Gate, whenReady].flat().filter(i => i.type.includes('⚖️')).length;
  const decisionItems = [thisWeek, byApril10, afterNaming, phase0Gate, whenReady].flat().filter(i => i.type.includes('🧠')).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Founder TODO</h1>
            <SignalPill label={`${totalItems} items`} tone="warning" />
          </div>
          <ViewSource repo="bigclaw-ai" path="founder/FOUNDER_TODO.md" />
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground font-mono">
          <span>💳 {moneyItems} money</span>
          <span>⚖️ {legalItems} legal</span>
          <span>🧠 {decisionItems} decisions</span>
        </div>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">This Week</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{thisWeek.length}</div>
          <div className="flex items-center gap-1 mt-1"><StatusDot status={thisWeek.length > 0 ? 'warn' : 'good'} size="sm" /><span className="text-xs text-amber-400">Urgent</span></div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Upcoming</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{byApril10.length + afterNaming.length}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">Gate Review</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{phase0Gate.length}</div>
          <div className="text-xs text-muted-foreground mt-1">April 18</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">No Deadline</div>
          <div className="text-2xl font-bold font-mono text-foreground mt-1">{whenReady.length}</div>
        </div>
      </div>

      {/* This Week — always expanded */}
      {thisWeek.length > 0 && (
        <SectionCard title="This Week" className="mb-6">
          {thisWeek.map((item, i) => <TodoRow key={i} item={item} />)}
        </SectionCard>
      )}

      {/* By April 10 */}
      {byApril10.length > 0 && (
        <SectionCard title="By April 10" className="mb-6">
          {byApril10.map((item, i) => <TodoRow key={i} item={item} />)}
        </SectionCard>
      )}

      {/* After Naming */}
      {afterNaming.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title={`After Naming Decision (${afterNaming.length})`} defaultOpen={false}>
            <div className="rounded-xl border border-border bg-card p-4">
              {afterNaming.map((item, i) => <TodoRow key={i} item={item} />)}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Phase 0 Gate */}
      {phase0Gate.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title={`Phase 0 Gate — April 18 (${phase0Gate.length})`} defaultOpen={false}>
            <div className="rounded-xl border border-border bg-card p-4">
              {phase0Gate.map((item, i) => <TodoRow key={i} item={item} />)}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* When Ready */}
      {whenReady.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title={`When Ready — No Deadline (${whenReady.length})`} defaultOpen={false}>
            <div className="rounded-xl border border-border bg-card p-4">
              {whenReady.map((item, i) => <TodoRow key={i} item={item} />)}
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Investment Portfolio — collapsed */}
      {portfolio.length > 0 && (
        <div className="mb-4">
          <CollapsibleSection title={`Investment Portfolio (${portfolio.length} positions)`} defaultOpen={false}>
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
