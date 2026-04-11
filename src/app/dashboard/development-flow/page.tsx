import { SectionCard } from '@/components/dashboard';
import { DevFlowChart } from '@/components/dev-flow-chart';
import Link from 'next/link';

export default function DevelopmentFlowPage() {
  return (
    <div>
      <h1 className="mb-1" style={{ fontSize: '28px', fontWeight: 700 }}>Development Flow</h1>
      <p className="text-sm text-muted-foreground mb-6">
        The complete pipeline from research to verified. Each box represents a document, tool, or process.
      </p>

      <SectionCard title="Pipeline Overview" className="mb-6">
        <DevFlowChart />
      </SectionCard>

      <SectionCard title="How It Works" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
          <div>
            <div className="font-semibold text-foreground mb-2">Research Phase (S1-S2)</div>
            <p>Sage runs competitive analysis → Consultant writes MRD → PRD Checklist and Test Matrix are derived from MRD. Competitive Log updated weekly by Sage.</p>
          </div>
          <div>
            <div className="font-semibold text-foreground mb-2">Design Phase</div>
            <p>/brainstorm explores context, proposes 2-3 approaches, saves design spec. /write-plan breaks the spec into TDD tasks (2-5 min each) mapped to PRD items.</p>
          </div>
          <div>
            <div className="font-semibold text-foreground mb-2">Build Phase (TDD)</div>
            <p>/execute-plan runs tasks. Each task: RED (write failing test) → GREEN (minimal code to pass) → REFACTOR → COMMIT. Updates PRD Checklist when items are Done.</p>
          </div>
          <div>
            <div className="font-semibold text-foreground mb-2">Verification Phase</div>
            <p>CI on every PR. Gemini browser-tests the live site at 6am daily. Michael reviews on phone. All three must pass before an item is marked ✅ Verified in the Test Matrix.</p>
          </div>
          <div>
            <div className="font-semibold text-foreground mb-2">Bug Loop</div>
            <p>Any bug found triggers: fix → add regression test row to Test Matrix → CI confirms fix → back to Gemini + Michael verification. Test matrix only grows, never shrinks.</p>
          </div>
        </div>
      </SectionCard>

      <div className="text-center mt-2">
        <Link
          href="https://github.com/ahfeiathome/bigclaw-ai/blob/main/knowledge/UNIFIED_DEV_FLOW.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          View documentation (UNIFIED_DEV_FLOW.md) →
        </Link>
      </div>
    </div>
  );
}
