'use client';

import { useState, useTransition } from 'react';

interface Props {
  hasLive: boolean;
  liveHalted?: boolean;
  haltReason?: string;
  dailyPnl?: string;
  drawdown?: string;
  pdtCount?: string;
}

export function RadarKillSwitch({ hasLive, liveHalted, haltReason, dailyPnl, drawdown, pdtCount }: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [halted, setHalted] = useState(liveHalted || false);

  function handleHalt() {
    startTransition(async () => {
      try {
        await fetch('/api/radar/halt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ halted: true, reason: 'Manual kill switch' }),
        });
        setHalted(true);
        setShowConfirm(false);
      } catch {
        // fail silently
      }
    });
  }

  if (!hasLive) return null;

  return (
    <div className="space-y-3">
      {/* Safeguard Status */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border p-3 bg-card">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Daily Loss Limit</div>
          <div className="text-sm font-mono font-semibold text-foreground">{dailyPnl || '$0.00'} / -$250</div>
        </div>
        <div className="rounded-lg border border-border p-3 bg-card">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Max Drawdown</div>
          <div className="text-sm font-mono font-semibold text-foreground">{drawdown || '$0.00'} / -$1,000</div>
        </div>
        <div className="rounded-lg border border-border p-3 bg-card">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">PDT (5-day)</div>
          <div className="text-sm font-mono font-semibold text-foreground">{pdtCount || '0'} / 3</div>
        </div>
      </div>

      {/* Safeguard rules */}
      <div className="text-[10px] text-muted-foreground space-y-1">
        <div>No options on live account (equities only)</div>
        <div>No margin (cash account only)</div>
        <div>Max position: $500 | Max account: $5,000</div>
        <div>Auto-restore sell cap: 2 positions max</div>
      </div>

      {/* Kill switch */}
      {halted ? (
        <div className="rounded-xl border-2 border-red-500/40 bg-red-500/10 p-4 text-center">
          <div className="text-red-400 font-bold text-sm">LIVE TRADING HALTED</div>
          <div className="text-xs text-muted-foreground mt-1">{haltReason || 'Manual kill switch'}</div>
          <div className="text-[10px] text-muted-foreground mt-2">Paper account continues running</div>
        </div>
      ) : (
        <>
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full py-3 rounded-xl border-2 border-red-500/40 bg-red-500/10 text-red-400 font-bold text-sm hover:bg-red-500/20 transition-all"
            >
              HALT LIVE
            </button>
          ) : (
            <div className="rounded-xl border-2 border-red-500/60 bg-red-500/10 p-4 space-y-3">
              <div className="text-sm text-red-400 font-semibold text-center">
                Sell all live positions and halt trading?
              </div>
              <div className="text-xs text-muted-foreground text-center">
                This will cancel all pending live orders, market-sell all live positions, and set live to observation-only. Paper continues.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-2 rounded-lg border border-border text-muted-foreground text-xs hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHalt}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-lg bg-red-500 text-white font-bold text-xs hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {isPending ? 'Halting...' : 'CONFIRM HALT'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
