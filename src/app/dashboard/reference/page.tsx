import { fetchAgentOpsIndex } from '@/lib/github';
import { SectionCard } from '@/components/dashboard';
import { MarkdownRenderer } from '@/components/markdown-renderer';

export default async function ReferencePage() {
  const indexMd = await fetchAgentOpsIndex();

  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Agent & Operations Reference</h1>
      <p className="text-sm text-muted-foreground mb-6">Complete index of the Pi5 agent system, cron jobs, and operational docs</p>

      {indexMd ? (
        <SectionCard title="">
          <MarkdownRenderer content={indexMd} />
        </SectionCard>
      ) : (
        <p className="text-sm text-muted-foreground">Reference document not available. Expected at knowledge/AGENT_OPS_INDEX.md.</p>
      )}
    </div>
  );
}
