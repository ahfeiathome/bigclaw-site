'use client';

import { useState, useEffect } from 'react';
import { StatusDot } from './dashboard';

interface Controls {
  radar: { frozen: boolean; mode: string; strategy: string; last_changed: string | null };
  deploy_gates: Record<string, boolean>;
  agents: Record<string, { enabled: boolean }>;
}

interface AccessConfig {
  users: Record<string, { role: string; products?: string[] }>;
}

interface PipelineProduct { slug: string; name: string; stage: string; nextGate: string }

const ALL_PRODUCTS: PipelineProduct[] = [
  { slug: 'grovakid', name: 'GrovaKid', stage: 'S4 BUILD', nextGate: 'S5 HARDEN (⚖️)' },
  { slug: 'rehearsal', name: 'REHEARSAL', stage: 'S3 DESIGN', nextGate: 'S4 BUILD' },
  { slug: 'iris-studio', name: 'iris-studio', stage: 'S4 BUILD', nextGate: 'DNS + Stripe (💳)' },
  { slug: 'fatfrogmodels', name: 'fatfrogmodels', stage: 'S7 LAUNCH', nextGate: 'S8 GROW' },
  { slug: 'fairconnect', name: 'FairConnect', stage: 'S4 BUILD', nextGate: 'Merge PR #1 (🔒)' },
  { slug: 'keeptrack', name: 'KeepTrack', stage: 'S5 HARDEN', nextGate: 'Apple Dev (💳)' },
  { slug: 'subcheck', name: 'SubCheck', stage: 'ARCHIVED', nextGate: 'Merged into KeepTrack Lane 3' },
  { slug: 'cortex', name: 'CORTEX', stage: 'RETIRED', nextGate: '—' },
  { slug: 'radar', name: 'RADAR', stage: 'S4 BUILD', nextGate: 'Phase 0 gate Apr 18 (🧠)' },
  { slug: 'bigclaw-dashboard', name: 'BigClaw Dashboard', stage: 'S7 LAUNCH', nextGate: 'S8 GROW' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-500/20 text-purple-400',
  'product-viewer': 'bg-blue-500/20 text-blue-400',
  investor: 'bg-amber-500/20 text-amber-400',
};

async function fetchControls(): Promise<Controls | null> {
  try { const r = await fetch('/api/controls'); return r.ok ? r.json() : null; } catch { return null; }
}

async function updateControl(key: string, value: boolean | string): Promise<Controls | null> {
  try {
    const r = await fetch('/api/controls', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
    return r.ok ? (await r.json()).controls : null;
  } catch { return null; }
}

async function fetchAccessConfig(): Promise<AccessConfig | null> {
  try { const r = await fetch('/api/admin/users'); return r.ok ? r.json() : null; } catch { return null; }
}

function Toggle({ enabled, onToggle, label, danger }: { enabled: boolean; onToggle: () => void; label: string; danger?: boolean }) {
  return (
    <button onClick={onToggle} className="flex items-center gap-1.5 group border-none bg-transparent cursor-pointer p-0">
      <div className={`w-7 h-3.5 rounded-full transition-colors relative ${enabled ? (danger ? 'bg-red-500' : 'bg-green-500') : 'bg-muted'}`}>
        <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
    </button>
  );
}

export function MissionCommandCenter({ radarReserve, hasLive, defaultCollapsed }: { radarReserve?: number; hasLive?: boolean; defaultCollapsed?: boolean }) {
  const [controls, setControls] = useState<Controls | null>(null);
  const [accessConfig, setAccessConfig] = useState<AccessConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!defaultCollapsed);

  // Trading mode state
  const [selectedStrategy, setSelectedStrategy] = useState('Auto');
  const [selectedMode, setSelectedMode] = useState('Grow');
  const [switchType, setSwitchType] = useState('Soft');

  // User management state
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('product-viewer');
  const [newProduct, setNewProduct] = useState('');

  useEffect(() => {
    Promise.all([fetchControls(), fetchAccessConfig()]).then(([c, a]) => {
      setControls(c);
      setAccessConfig(a);
      if (c) { setSelectedStrategy(c.radar.strategy || 'Auto'); setSelectedMode(c.radar.mode || 'Grow'); }
      setLoading(false);
    });
  }, []);

  async function toggle(key: string, currentValue: boolean) {
    const nc = controls ? JSON.parse(JSON.stringify(controls)) : null;
    if (!nc) return;
    const parts = key.split('.');
    let t: Record<string, unknown> = nc;
    for (let i = 0; i < parts.length - 1; i++) t = t[parts[i]] as Record<string, unknown>;
    t[parts[parts.length - 1]] = !currentValue;
    setControls(nc);
    const result = await updateControl(key, !currentValue);
    if (result) setControls(result);
  }

  async function handleApplyMode() {
    await updateControl('radar.strategy', selectedStrategy);
    const result = await updateControl('radar.mode', selectedMode);
    if (result) setControls(result);
  }

  async function handleAddUser() {
    if (!newEmail.trim()) return;
    const body: Record<string, unknown> = { action: 'add', email: newEmail, role: newRole };
    if (newRole === 'product-viewer' && newProduct) body.products = [newProduct];
    const r = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) { const d = await r.json(); if (d.config) setAccessConfig(d.config); setNewEmail(''); setNewProduct(''); }
  }

  async function handleRemoveUser(email: string) {
    const r = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'remove', email }) });
    if (r.ok) { const d = await r.json(); if (d.config) setAccessConfig(d.config); }
  }

  if (loading) return <div className="rounded-xl border border-primary/30 bg-card p-3 mb-2 animate-pulse"><div className="h-4 bg-muted rounded w-40" /></div>;
  if (!controls) return null;

  const reserveWarning = radarReserve !== undefined && radarReserve < 30;
  const deployAllowed = Object.values(controls.deploy_gates).filter(Boolean).length;
  const deployTotal = Object.keys(controls.deploy_gates).length;
  const agentOn = Object.values(controls.agents).filter(a => a.enabled).length;
  const agentTotal = Object.keys(controls.agents).length;

  return (
    <div className="rounded-xl border border-primary/30 bg-card mb-2">
      <div className="flex items-center gap-3 p-3">
        <span className="text-xs font-bold text-primary uppercase tracking-wide">Command Center</span>
        <span className="text-[10px] font-mono text-muted-foreground">{deployAllowed}/{deployTotal} deploys | {agentOn}/{agentTotal} agents</span>
        {reserveWarning && <span className="text-[10px] text-red-400 font-bold ml-auto">Reserve: {radarReserve?.toFixed(1)}% — Below 30%!</span>}
      </div>

      <div className="px-3 pb-3 pt-0 space-y-2">

          {/* RADAR controls removed — lives in RADAR app (radar-bigclaw.vercel.app) */}

          {/* ── Product Pipeline ────────────────────────────── */}
          <div className="border border-border/50 rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Product Development Life Cycle</div>
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-muted-foreground border-b border-border/50">
                  <th className="text-left py-1 pr-2 font-normal">Product</th>
                  <th className="text-left py-1 px-2 font-normal">Stage</th>
                  <th className="text-left py-1 px-2 font-normal">Next Gate</th>
                  <th className="text-right py-1 pl-2 font-normal">Deploy</th>
                </tr>
              </thead>
              <tbody>
                {ALL_PRODUCTS.map(product => {
                  const deployOn = controls.deploy_gates[product.slug] ?? true;
                  const stageColor = product.stage === 'RETIRED' || product.stage === 'ARCHIVED' ? 'text-muted-foreground/50 line-through' : product.stage.includes('S7') || product.stage.includes('S8') ? 'text-green-400' : product.stage.includes('S4') || product.stage.includes('S5') ? 'text-amber-400' : 'text-muted-foreground';
                  return (
                    <tr key={product.slug} className="border-b border-border/20">
                      <td className="py-1 pr-2 text-foreground">{product.name}</td>
                      <td className={`py-1 px-2 font-mono ${stageColor}`}>{product.stage}</td>
                      <td className="py-1 px-2 text-muted-foreground truncate max-w-[160px]">{product.nextGate}</td>
                      <td className="py-1 pl-2 text-right">
                        <Toggle enabled={deployOn} onToggle={() => toggle(`deploy_gates.${product.slug}`, deployOn)} label={deployOn ? 'ALLOWED' : 'BLOCKED'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Agents — status only ───────────────────────── */}
          <div className="border border-border/50 rounded-lg p-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">Agents</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(controls.agents).map(([name, agent]) => (
                <div key={name} className="flex items-center gap-1.5">
                  <StatusDot status={agent.enabled ? 'good' : 'neutral'} size="sm" />
                  <span className="text-xs text-muted-foreground capitalize">{name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Management moved to Access Control (/dashboard/settings/users) */}

        </div>
    </div>
  );
}
