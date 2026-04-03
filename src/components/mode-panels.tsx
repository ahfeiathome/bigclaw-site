'use client';

import { AgentOnly, CodeOnly } from '@/components/architecture-mode';
import { AgentStatusPanel, CodeStatusPanel } from '@/components/dashboard';
import type { ReactNode } from 'react';

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

export function AgentOnlyWrapper({ children }: { children: ReactNode }) {
  return <AgentOnly>{children}</AgentOnly>;
}

export function CodeOnlyWrapper({ children }: { children: ReactNode }) {
  return <CodeOnly>{children}</CodeOnly>;
}
