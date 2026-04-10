'use client';

import { useState } from 'react';
import type { PendingGate } from '@/app/api/controls/pending/route';

interface Props {
  initialGates: PendingGate[];
}

interface GateState {
  loading: boolean;
  done: boolean;
  decision: 'approve' | 'reject' | null;
  error: string | null;
  rejectPrompt: boolean;
  rejectReason: string;
}

export function DeployApprovalSection({ initialGates }: Props) {
  const [gates, setGates] = useState(initialGates);
  const [states, setStates] = useState<Record<string, GateState>>({});

  function getState(product: string): GateState {
    return states[product] ?? { loading: false, done: false, decision: null, error: null, rejectPrompt: false, rejectReason: '' };
  }

  function patchState(product: string, patch: Partial<GateState>) {
    setStates(prev => ({ ...prev, [product]: { ...getState(product), ...patch } }));
  }

  async function handleApprove(product: string) {
    patchState(product, { loading: true, error: null });
    try {
      const res = await fetch('/api/controls/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, action: 'approve' }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        patchState(product, { loading: false, error: data.error || 'Failed' });
      } else {
        patchState(product, { loading: false, done: true, decision: 'approve' });
        setGates(prev => prev.filter(g => g.product !== product));
      }
    } catch {
      patchState(product, { loading: false, error: 'Network error' });
    }
  }

  async function handleReject(product: string, reason: string) {
    patchState(product, { loading: true, error: null });
    try {
      const res = await fetch('/api/controls/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product, action: 'reject', reason }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        patchState(product, { loading: false, error: data.error || 'Failed' });
      } else {
        patchState(product, { loading: false, done: true, decision: 'reject', rejectPrompt: false });
        setGates(prev => prev.filter(g => g.product !== product));
      }
    } catch {
      patchState(product, { loading: false, error: 'Network error' });
    }
  }

  if (gates.length === 0) {
    return <p className="text-sm text-green-400 font-medium">No deploys awaiting approval. ✅</p>;
  }

  return (
    <div className="space-y-3">
      {gates.map(gate => {
        const s = getState(gate.product);
        return (
          <div key={gate.product} className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-base font-bold text-foreground">{gate.product}</span>
              {gate.testStatus && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-mono">
                  ✅ {gate.testStatus}
                </span>
              )}
              <span className="text-[10px] text-muted-foreground font-mono ml-auto">{gate.date}</span>
            </div>

            {/* Summary */}
            {gate.summary && (
              <p className="text-xs text-muted-foreground mb-3">{gate.summary}</p>
            )}

            {/* Actions */}
            {!s.rejectPrompt ? (
              <div className="flex gap-2 flex-wrap">
                {gate.previewUrl && (
                  <a
                    href={gate.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg border border-border bg-card text-foreground no-underline hover:bg-muted/50 transition-colors"
                  >
                    📱 Open Preview ↗
                  </a>
                )}
                <button
                  onClick={() => handleApprove(gate.product)}
                  disabled={s.loading}
                  className="text-xs px-3 py-2 rounded-lg bg-green-600/20 border border-green-500/40 text-green-400 font-semibold hover:bg-green-600/30 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {s.loading && s.decision !== 'reject' ? '...' : '✅ APPROVE'}
                </button>
                <button
                  onClick={() => patchState(gate.product, { rejectPrompt: true })}
                  disabled={s.loading}
                  className="text-xs px-3 py-2 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 font-semibold hover:bg-red-600/30 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ❌ REJECT
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  autoFocus
                  value={s.rejectReason}
                  onChange={e => patchState(gate.product, { rejectReason: e.target.value })}
                  placeholder="Reason for rejection..."
                  className="w-full text-xs px-3 py-2 rounded-lg border border-red-500/40 bg-card text-foreground placeholder:text-muted-foreground resize-none"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(gate.product, s.rejectReason)}
                    disabled={s.loading || !s.rejectReason.trim()}
                    className="text-xs px-3 py-2 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 font-semibold hover:bg-red-600/30 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {s.loading ? '...' : 'Confirm Reject'}
                  </button>
                  <button
                    onClick={() => patchState(gate.product, { rejectPrompt: false, rejectReason: '' })}
                    className="text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {s.error && <p className="text-xs text-red-400 mt-2">{s.error}</p>}
          </div>
        );
      })}
    </div>
  );
}
