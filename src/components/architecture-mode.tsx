'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

type ArchMode = 'AGENTS' | 'CODE_ONLY';

const ArchModeContext = createContext<{
  mode: ArchMode;
  hydrated: boolean;
  toggle: () => void;
}>({ mode: 'AGENTS', hydrated: false, toggle: () => {} });

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
  const [mode, setMode] = useState<ArchMode>(defaultMode);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('bigclaw-arch-mode');
    if (stored === 'AGENTS' || stored === 'CODE_ONLY') setMode(stored);
    setHydrated(true);
  }, []);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'AGENTS' ? 'CODE_ONLY' : 'AGENTS';
      localStorage.setItem('bigclaw-arch-mode', next);
      return next;
    });
  }, []);

  return (
    <ArchModeContext.Provider value={{ mode, hydrated, toggle }}>
      {children}
    </ArchModeContext.Provider>
  );
}

export function ModeToggle() {
  const { mode, hydrated, toggle } = useArchMode();

  if (!hydrated) return null;

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={mode === 'AGENTS'}
      aria-label={`Architecture view: ${mode === 'AGENTS' ? 'Agent View' : 'Code-Only View'}`}
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
  const { mode, hydrated } = useArchMode();
  if (!hydrated || mode !== 'AGENTS') return null;
  return <>{children}</>;
}

export function CodeOnly({ children }: { children: ReactNode }) {
  const { mode, hydrated } = useArchMode();
  if (!hydrated || mode !== 'CODE_ONLY') return null;
  return <>{children}</>;
}
