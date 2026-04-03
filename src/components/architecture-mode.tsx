'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ArchMode = 'AGENTS' | 'CODE_ONLY';

const ArchModeContext = createContext<{
  mode: ArchMode;
  toggle: () => void;
}>({ mode: 'AGENTS', toggle: () => {} });

export function useArchMode() {
  return useContext(ArchModeContext);
}

export function ArchModeProvider({
  defaultMode,
  children,
}: {
  defaultMode: ArchMode;
  children: ReactNode;
}) {
  const [mode, setMode] = useState<ArchMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('bigclaw-arch-mode');
      if (stored === 'AGENTS' || stored === 'CODE_ONLY') return stored;
    }
    return defaultMode;
  });

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'AGENTS' ? 'CODE_ONLY' : 'AGENTS';
      localStorage.setItem('bigclaw-arch-mode', next);
      return next;
    });
  }, []);

  return (
    <ArchModeContext.Provider value={{ mode, toggle }}>
      {children}
    </ArchModeContext.Provider>
  );
}

export function ModeToggle() {
  const { mode, toggle } = useArchMode();

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-all hover:border-primary/30 hover:bg-primary/5"
      title={`Current: ${mode === 'AGENTS' ? 'Agent View' : 'Code-Only View'}. Click to switch.`}
    >
      <span className={`w-2 h-2 rounded-full ${mode === 'AGENTS' ? 'bg-green-500' : 'bg-blue-500'}`} />
      <span className="text-muted-foreground">
        {mode === 'AGENTS' ? 'Agent View' : 'Code-Only View'}
      </span>
    </button>
  );
}

export function AgentOnly({ children }: { children: ReactNode }) {
  const { mode } = useArchMode();
  if (mode !== 'AGENTS') return null;
  return <>{children}</>;
}

export function CodeOnly({ children }: { children: ReactNode }) {
  const { mode } = useArchMode();
  if (mode !== 'CODE_ONLY') return null;
  return <>{children}</>;
}
