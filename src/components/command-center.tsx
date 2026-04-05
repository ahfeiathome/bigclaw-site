'use client';

import { useState, useEffect } from 'react';
import { StatusDot } from './dashboard';
import Link from 'next/link';

interface Controls {
  radar: { frozen: boolean; mode: string; strategy: string; last_changed: string | null };
  deploy_gates: Record<string, boolean>;
  agents: Record<string, { enabled: boolean }>;
}

async function fetchControls(): Promise<Controls | null> {
  try {
    const res = await fetch('/api/controls');
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function updateControl(key: string, value: boolean | string): Promise<Controls | null> {
  try {
    const res = await fetch('/api/controls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.controls;
  } catch { return null; }
}

function Toggle({ enabled, onToggle, label, danger }: { enabled: boolean; onToggle: () => void; label: string; danger?: boolean }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-2 group">
      <div className={`w-8 h-4 rounded-full transition-colors relative ${enabled ? (danger ? 'bg-red-500' : 'bg-green-500') : 'bg-muted'}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </button>
  );
}

export function CommandCenter({ radarReserve }: { radarReserve?: number }) {
  const [controls, setControls] = useState<Controls | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchControls().then(c => { setControls(c); setLoading(false); });
  }, []);

  async function toggle(key: string, currentValue: boolean) {
    // Optimistic update
    const newControls = controls ? JSON.parse(JSON.stringify(controls)) : null;
    if (!newControls) return;
    const parts = key.split('.');
    let target: Record<string, unknown> = newControls;
    for (let i = 0; i < parts.length - 1; i++) target = target[parts[i]] as Record<string, unknown>;
    (target as Record<string, unknown>)[parts[parts.length - 1]] = !currentValue;
    setControls(newControls);

    const result = await updateControl(key, !currentValue);
    if (result) setControls(result);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-primary/30 bg-card p-5 mb-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-40 mb-4" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (!controls) return null;

  const reserveWarning = radarReserve !== undefined && radarReserve < 30;

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-bold text-primary uppercase tracking-wide">Command Center</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RADAR Quick Controls */}
        <div className="border border-border rounded-lg p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase">RADAR</span>
            <Link href="/dashboard/radar" className="text-[10px] text-primary no-underline hover:underline">Full controls →</Link>
          </div>
          <div className="space-y-2">
            <Toggle
              enabled={controls.radar.frozen}
              onToggle={() => toggle('radar.frozen', controls.radar.frozen)}
              label={controls.radar.frozen ? 'FROZEN — Kill Switch ON' : 'Trading active'}
              danger={true}
            />
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Mode:</span>
              <span className="font-mono text-foreground">{controls.radar.strategy}</span>
            </div>
            {radarReserve !== undefined && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">Reserve:</span>
                <span className={`font-mono ${reserveWarning ? 'text-red-400 font-bold' : 'text-green-400'}`}>{radarReserve.toFixed(1)}%</span>
                {reserveWarning && <span className="text-[10px] text-red-400">Below 30%!</span>}
              </div>
            )}
          </div>
        </div>

        {/* Deploy Gates */}
        <div className="border border-border rounded-lg p-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase block mb-3">Deploy Gates</span>
          <div className="space-y-2">
            {Object.entries(controls.deploy_gates).map(([product, allowed]) => (
              <div key={product} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={allowed ? 'good' : 'bad'} size="sm" />
                  <span className="text-xs text-foreground">{product}</span>
                </div>
                <Toggle
                  enabled={allowed}
                  onToggle={() => toggle(`deploy_gates.${product}`, allowed)}
                  label={allowed ? 'ALLOWED' : 'BLOCKED'}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Agent Controls */}
        <div className="border border-border rounded-lg p-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase block mb-3">Agents</span>
          <div className="space-y-2">
            {Object.entries(controls.agents).map(([name, agent]) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusDot status={agent.enabled ? 'good' : 'neutral'} size="sm" />
                  <span className="text-xs text-foreground capitalize">{name}</span>
                </div>
                <Toggle
                  enabled={agent.enabled}
                  onToggle={() => toggle(`agents.${name}.enabled`, agent.enabled)}
                  label={agent.enabled ? 'ON' : 'OFF'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
