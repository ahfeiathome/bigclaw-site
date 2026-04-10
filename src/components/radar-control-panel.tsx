'use client';

import { useState, useTransition } from 'react';

const STRATEGIES = ['Accelerate', 'Grow', 'Build', 'Income'] as const;
const RISK_LEVELS = ['Auto', 'Aggressive', 'Balanced', 'Conservative'] as const;

const STRATEGY_SUBTITLES: Record<string, string> = {
  Accelerate: 'Options',
  Grow: 'Full Mix',
  Build: 'Equities',
  Income: 'Dividends',
};

const APPLIES_TO = ['Both', 'Paper Only', 'Live Only'] as const;

interface ModeConfig {
  strategy: string;
  risk: string;
  switchType: 'soft' | 'hard';
  appliesTo: string;
}

interface Props {
  currentMode?: ModeConfig;
  hasLive?: boolean;
}

export function RadarControlPanel({ currentMode, hasLive }: Props) {
  const [strategy, setStrategy] = useState(currentMode?.strategy || 'Grow');
  const [risk, setRisk] = useState(currentMode?.risk || 'Auto');
  const [switchType, setSwitchType] = useState<'soft' | 'hard'>(currentMode?.switchType || 'soft');
  const [appliesTo, setAppliesTo] = useState(currentMode?.appliesTo || 'Both');
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isIncome = (s: string) => s === 'Income';

  function handleCellClick(r: string, s: string) {
    if (isIncome(s)) return; // Coming Soon
    setRisk(r);
    setStrategy(s);
    setSaved(false);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/radar/mode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strategy, risk, switchType, appliesTo }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || `HTTP ${res.status}`);
          return;
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (e) {
        setError(String(e));
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* 4×4 Mode Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-muted-foreground"></th>
              {STRATEGIES.map((s) => (
                <th key={s} className="p-2 text-center">
                  <div className="text-foreground font-semibold">{s}</div>
                  <div className="text-[10px] text-muted-foreground font-normal">
                    {isIncome(s) ? 'Coming Soon' : `(${STRATEGY_SUBTITLES[s]})`}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RISK_LEVELS.map((r) => (
              <tr key={r}>
                <td className="p-2 text-foreground font-medium text-sm">{r}</td>
                {STRATEGIES.map((s) => {
                  const isActive = r === risk && s === strategy;
                  const disabled = isIncome(s);
                  return (
                    <td key={s} className="p-1">
                      <button
                        onClick={() => handleCellClick(r, s)}
                        disabled={disabled}
                        className={`w-full py-3 rounded-lg border transition-all text-xs font-mono ${
                          isActive
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400 ring-1 ring-blue-500/30'
                            : disabled
                            ? 'bg-muted/30 border-border/50 text-muted-foreground/30 cursor-not-allowed'
                            : 'bg-card border-border hover:border-foreground/30 hover:bg-muted/50 text-muted-foreground cursor-pointer'
                        }`}
                      >
                        {isActive ? 'ACTIVE' : disabled ? '—' : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Switch type */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Switch:</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSwitchType('hard'); setSaved(false); }}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                switchType === 'hard'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'bg-card text-muted-foreground border border-border hover:border-foreground/30'
              }`}
            >
              Hard
            </button>
            <button
              onClick={() => { setSwitchType('soft'); setSaved(false); }}
              className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                switchType === 'soft'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                  : 'bg-card text-muted-foreground border border-border hover:border-foreground/30'
              }`}
            >
              Soft
            </button>
          </div>
        </div>

        {/* Applies to */}
        {hasLive && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Applies to:</span>
            <div className="flex items-center gap-1">
              {APPLIES_TO.map((opt) => (
                <button
                  key={opt}
                  onClick={() => { setAppliesTo(opt); setSaved(false); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                    appliesTo === opt
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                      : 'bg-card text-muted-foreground border border-border hover:border-foreground/30'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isPending || saved}
          className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
            saved
              ? 'bg-green-500/20 text-green-400 border border-green-500/40'
              : isPending
              ? 'bg-muted text-muted-foreground border border-border animate-pulse'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/40 hover:bg-blue-500/30'
          }`}
        >
          {saved ? 'Saved' : isPending ? 'Saving...' : 'Apply Mode'}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-400 font-mono mt-1">Error: {error}</p>
      )}
    </div>
  );
}
