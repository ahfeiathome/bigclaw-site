'use client';

import { AgentOnly, CodeOnly } from '@/components/architecture-mode';
import { AgentStatusPanel, CodeStatusPanel } from '@/components/dashboard';

export function AgentOrCodePanel() {
  return (
    <>
      <AgentOnly>
        <AgentStatusPanel />
      </AgentOnly>
      <CodeOnly>
        <CodeStatusPanel />
      </CodeOnly>
    </>
  );
}
