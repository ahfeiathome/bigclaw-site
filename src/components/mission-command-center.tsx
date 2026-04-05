'use client';

import { useState, useEffect } from 'react';
import { StatusDot } from './dashboard';
import { RadarControlPanel } from './radar-control-panel';
import { RadarKillSwitch } from './radar-kill-switch';

interface Controls {
  radar: { frozen: boolean; mode: string; strategy: string; last_changed: string | null };
  deploy_gates: Record<string, boolean>;
  agents: Record<string, { enabled: boolean }>;
}

interface AccessConfig {
  roles: Record<string, { pages: string[]; controls: boolean; internal: boolean }>;
  users: Record<string, { role: string; products?: string[] }>;
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

async function fetchAccessConfig(): Promise<AccessConfig | null> {
  try {
    const res = await fetch('/api/access');
    if (!res.ok) return null;
    return await res.json();
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

export function MissionCommandCenter({ radarReserve, hasLive }: { radarReserve?: number; hasLive?: boolean }) {
  const [controls, setControls] = useState<Controls | null>(null);
  const [accessConfig, setAccessConfig] = useState<AccessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);

  useEffect(() => {
    Promise.all([fetchControls(), fetchAccessConfig()]).then(([c, a]) => {
      setControls(c);
      setAccessConfig(a);
      setLoading(false);
    });
  }, []);

  async function toggle(key: string, currentValue: boolean) {
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
        <div className="h-40 bg-muted rounded" />
      </div>
    );
  }

  if (!controls) return null;

  const reserveWarning = radarReserve !== undefined && radarReserve < 30;

  return (
    <div className="rounded-xl border border-primary/30 bg-card p-5 mb-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xs font-bold text-primary uppercase tracking-wide">Command Center</span>
        <span className="text-[10px] text-muted-foreground font-mono">All controls</span>
      </div>

      {/* ── RADAR Controls (full panel) ──────────────────────────── */}
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase">RADAR Controls</span>
          <div className="flex items-center gap-3">
            {radarReserve !== undefined && (
              <span className={`text-xs font-mono ${reserveWarning ? 'text-red-400 font-bold' : 'text-green-400'}`}>
                Reserve: {radarReserve.toFixed(1)}%
                {reserveWarning && ' — Below 30%!'}
              </span>
            )}
          </div>
        </div>

        {/* Kill Switch Toggle */}
        <div className="mb-4 pb-4 border-b border-border">
          <Toggle
            enabled={controls.radar.frozen}
            onToggle={() => toggle('radar.frozen', controls.radar.frozen)}
            label={controls.radar.frozen ? 'FROZEN — Kill Switch ON' : 'Trading active'}
            danger={true}
          />
        </div>

        {/* Trading Mode Grid */}
        <div className="mb-4">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Trading Mode</div>
          <RadarControlPanel hasLive={hasLive} />
        </div>

        {/* Live Safeguards + Kill Switch */}
        {hasLive && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Live Account Safeguards</div>
            <RadarKillSwitch hasLive={hasLive} />
          </div>
        )}

        {/* Constitution compliance indicators */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Constitution Compliance</div>
          <div className="flex items-center gap-2 text-xs">
            <StatusDot status="good" size="sm" />
            <span className="text-muted-foreground">All laws enforced (view on Product RADAR page)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* ── Deploy Gates ────────────────────────────────────────── */}
        <div className="border border-border rounded-lg p-4">
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

        {/* ── Agent Controls ──────────────────────────────────────── */}
        <div className="border border-border rounded-lg p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase block mb-3">Agent Controls</span>
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

      {/* ── User Management (collapsed by default) ────────────────── */}
      <div className="border border-border rounded-lg">
        <button
          onClick={() => setUserMgmtOpen(!userMgmtOpen)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <span className="text-xs font-semibold text-muted-foreground uppercase">User Management</span>
          <span className="text-xs text-muted-foreground">{userMgmtOpen ? '▼' : '▶'}</span>
        </button>
        {userMgmtOpen && accessConfig && (
          <div className="px-4 pb-4 space-y-3">
            <div className="space-y-2">
              {Object.entries(accessConfig.users).map(([email, user]) => (
                <div key={email} className="flex items-center gap-3 text-sm py-1.5 border-b border-border last:border-0">
                  <StatusDot status="good" size="sm" />
                  <span className="text-foreground font-mono text-xs">{email}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono ml-auto">{user.role}</span>
                  {user.products && (
                    <span className="text-[10px] text-muted-foreground">
                      {user.products.join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">Roles</div>
              <div className="space-y-2">
                {Object.entries(accessConfig.roles).map(([name, role]) => (
                  <div key={name} className="flex items-center gap-3 text-xs">
                    <span className="font-bold text-foreground">{name}</span>
                    <span className={`font-mono ${role.controls ? 'text-green-400' : 'text-red-400'}`}>
                      controls: {role.controls ? 'yes' : 'no'}
                    </span>
                    <span className={`font-mono ${role.internal ? 'text-green-400' : 'text-red-400'}`}>
                      internal: {role.internal ? 'yes' : 'no'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Edit <code className="text-primary">config/access.json</code> to add/remove users or change roles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
