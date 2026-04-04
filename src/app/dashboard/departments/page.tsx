import { StatusDot, SignalPill } from '@/components/dashboard';
import Link from 'next/link';

const DEPARTMENTS = [
  { slug: 'finance', name: 'Finance', agent: 'Rex (CFO)', model: 'claude-sonnet-4', description: 'Cost breakdown, API spend, revenue projections, budget tracking' },
  { slug: 'operations', name: 'Operations', agent: 'Mika (COO)', model: 'gemini-2.5-flash', description: 'Daily briefs, agent dispatch, patrol reports, task management' },
  { slug: 'infrastructure', name: 'Infrastructure', agent: 'Byte (CIO)', model: 'deepseek-r1', description: 'System health, git sync, security posture, service monitoring' },
  { slug: 'knowledge', name: 'Knowledge Hub', agent: 'Sage (BDM)', model: 'deepseek-v3', description: 'Market intel, competitor research, investment portfolio' },
  { slug: 'marketing', name: 'Marketing', agent: 'Lumina (CMO)', model: 'llama-3.3-70b', description: 'Landing page copy, SEO, content pipeline, social strategy' },
];

export default function DepartmentsPage() {
  return (
    <div>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Departments</h1>
        <p className="text-sm text-muted-foreground mt-1">Each department maps to an AI agent with operational authority</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DEPARTMENTS.map((dept) => (
          <Link
            key={dept.slug}
            href={`/dashboard/departments/${dept.slug}`}
            className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all no-underline group"
          >
            <div className="flex items-center gap-2 mb-2">
              <StatusDot status="good" size="sm" />
              <span className="text-sm font-bold text-foreground">{dept.name}</span>
              <span className="text-[10px] text-muted-foreground ml-auto group-hover:text-primary transition-colors">→ detail</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{dept.description}</p>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">{dept.agent}</span>
              <span className="text-muted-foreground">{dept.model}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
