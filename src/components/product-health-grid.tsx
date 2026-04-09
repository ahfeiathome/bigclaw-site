'use client';

import { useEffect, useState } from 'react';
import { StatusDot } from './dashboard';

interface ProductHealth {
  name: string;
  url: string;
  status: 'checking' | 'up' | 'down';
}

const PRODUCTS: { name: string; url: string }[] = [
  { name: 'GrovaKid', url: 'https://learnie-ai-ten.vercel.app' },
  { name: 'iris-studio', url: 'https://iris-studio.vercel.app' },
  { name: 'fatfrogmodels', url: 'https://fatfrogmodels.vercel.app' },
  { name: 'FairConnect', url: 'https://fairconnect.vercel.app' },
  { name: 'KeepTrack', url: 'https://keeptrack-bigclaw.vercel.app' },
  { name: 'SubCheck', url: 'https://subcheck-bigclaw.vercel.app' },
  { name: 'CORTEX', url: 'https://cortex-bigclaw.vercel.app' },
  { name: 'REHEARSAL', url: 'https://rehearsal-bigclaw.vercel.app' },
  { name: 'RADAR', url: 'https://radar-bigclaw.vercel.app' },
  { name: 'Dashboard', url: 'https://bigclaw-site.vercel.app' },
];

export function ProductHealthGrid() {
  const [health, setHealth] = useState<ProductHealth[]>(
    PRODUCTS.map(p => ({ ...p, status: 'checking' as const }))
  );

  useEffect(() => {
    PRODUCTS.forEach(async (product, i) => {
      try {
        const res = await fetch(product.url, { method: 'HEAD', mode: 'no-cors' });
        setHealth(prev => {
          const next = [...prev];
          next[i] = { ...product, status: 'up' };
          return next;
        });
      } catch {
        setHealth(prev => {
          const next = [...prev];
          next[i] = { ...product, status: 'down' };
          return next;
        });
      }
    });
  }, []);

  const upCount = health.filter(h => h.status === 'up').length;
  const downCount = health.filter(h => h.status === 'down').length;
  const checking = health.filter(h => h.status === 'checking').length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xs text-green-400">{upCount} sites online</span>
        {downCount > 0 && <span className="text-xs text-red-400">{downCount} sites DOWN</span>}
        {checking > 0 && <span className="text-xs text-muted-foreground">{checking} checking...</span>}
        <span className="text-[10px] text-muted-foreground ml-auto">Green = site responds to HTTP request</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {health.map(h => (
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
        ))}
      </div>
    </div>
  );
}
