'use client';

import { useEffect, useState } from 'react';
import { StatusDot } from './dashboard';

interface ProductEntry { name: string; url: string; notDeployed?: boolean }
type HealthStatus = 'checking' | 'up' | 'down' | 'not-deployed';
interface ProductHealth extends ProductEntry { status: HealthStatus }

const PRODUCTS: ProductEntry[] = [
  { name: 'GrovaKid', url: 'https://learnie-ai-ten.vercel.app' },
  { name: 'iris-studio', url: 'https://iris-studio.vercel.app' },
  { name: 'fatfrogmodels', url: 'https://fatfrogmodels.com' },
  { name: 'FairConnect', url: 'https://fairconnect.vercel.app' },
  { name: 'KeepTrack', url: 'https://keeptrack-bigclaw.vercel.app' },
  { name: 'SubCheck', url: 'https://subcheck-bigclaw.vercel.app', notDeployed: true },
  { name: 'REHEARSAL', url: 'https://rehearsal-bigclaw.vercel.app', notDeployed: true },
  { name: 'RADAR', url: 'https://radar-bigclaw.vercel.app' },
  { name: 'Dashboard', url: 'https://bigclaw-site.vercel.app' },
];

const DEPLOYED = PRODUCTS.filter(p => !p.notDeployed);
const NOT_DEPLOYED = PRODUCTS.filter(p => p.notDeployed);

export function ProductHealthGrid() {
  const [health, setHealth] = useState<ProductHealth[]>([
    ...DEPLOYED.map(p => ({ ...p, status: 'checking' as HealthStatus })),
    ...NOT_DEPLOYED.map(p => ({ ...p, status: 'not-deployed' as HealthStatus })),
  ]);

  useEffect(() => {
    const urls = DEPLOYED.map(p => p.url);

    fetch('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls }),
    })
      .then(res => res.json())
      .then((data: { results: { url: string; status: 'up' | 'down' }[] }) => {
        const statusMap = new Map(data.results.map(r => [r.url, r.status]));
        setHealth([
          ...DEPLOYED.map(p => ({ ...p, status: (statusMap.get(p.url) ?? 'down') as HealthStatus })),
          ...NOT_DEPLOYED.map(p => ({ ...p, status: 'not-deployed' as HealthStatus })),
        ]);
      })
      .catch(() => {
        setHealth([
          ...DEPLOYED.map(p => ({ ...p, status: 'down' as HealthStatus })),
          ...NOT_DEPLOYED.map(p => ({ ...p, status: 'not-deployed' as HealthStatus })),
        ]);
      });
  }, []);

  const upCount = health.filter(h => h.status === 'up').length;
  const downCount = health.filter(h => h.status === 'down').length;
  const notDeployedCount = health.filter(h => h.status === 'not-deployed').length;
  const checking = health.filter(h => h.status === 'checking').length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-green-400">{upCount} sites online</span>
        {downCount > 0 && <span className="text-xs text-red-400">{downCount} DOWN</span>}
        {notDeployedCount > 0 && <span className="text-xs text-muted-foreground">{notDeployedCount} not deployed</span>}
        {checking > 0 && <span className="text-xs text-muted-foreground">{checking} checking...</span>}
        <span className="text-[10px] text-muted-foreground ml-auto">Green = site responds to HTTP</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {health.map(h => (
          h.status === 'not-deployed'
            ? (
              <div
                key={h.name}
                className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/30 px-3 py-2"
              >
                <StatusDot status="neutral" size="sm" />
                <div className="min-w-0">
                  <div className="text-[10px] text-muted-foreground/60 font-medium truncate">{h.name}</div>
                  <div className="text-[9px] text-muted-foreground/40">Not Deployed</div>
                </div>
              </div>
            ) : (
              <a
                key={h.name}
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2 no-underline hover:bg-muted/50 transition-colors"
              >
                <StatusDot
                  status={h.status === 'up' ? 'good' : h.status === 'down' ? 'bad' : 'neutral'}
                  size="sm"
                />
                <span className="text-[10px] text-foreground font-medium truncate">{h.name}</span>
              </a>
            )
        ))}
      </div>
    </div>
  );
}
