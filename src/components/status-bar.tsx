'use client';

import { useState, useEffect } from 'react';

interface StatusData {
  marketOpen: boolean;
  activeAgents: number;
  totalAgents: number;
  lastSync: string;
  radarEquity: string;
  radarMode: string;
  commitCount: number;
}

export function StatusBar() {
  const [data, setData] = useState<StatusData | null>(null);

  useEffect(() => {
    fetch('/api/status-bar')
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => null);

    // Refresh every 60s
    const interval = setInterval(() => {
      fetch('/api/status-bar')
        .then(r => r.ok ? r.json() : null)
        .then(setData)
        .catch(() => null);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!data) {
    return (
      <div className="border-t border-border bg-card px-4 py-1.5 flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
        <span>Loading status...</span>
      </div>
    );
  }

  const agentColor = data.activeAgents === 0 ? 'text-red-400' : data.activeAgents < data.totalAgents ? 'text-amber-400' : 'text-green-400';
  const marketColor = data.marketOpen ? 'text-green-400' : 'text-muted-foreground';

  return (
    <div className="border-t border-border bg-card px-4 py-1.5 flex items-center gap-4 text-[10px] font-mono overflow-x-auto scrollbar-hide">
      <span className={marketColor}>
        Market: {data.marketOpen ? 'OPEN' : 'CLOSED'}
      </span>
      <span className="text-border">|</span>
      <span className={agentColor}>
        Agents: {data.activeAgents}/{data.totalAgents} active
      </span>
      <span className="text-border">|</span>
      <span className="text-muted-foreground">
        Last sync: {data.lastSync}
      </span>
      <span className="text-border">|</span>
      <span className="text-green-400">
        RADAR: {data.radarMode} {data.radarEquity}
      </span>
      <span className="text-border">|</span>
      <span className="text-muted-foreground">
        Git: {data.commitCount} commits today
      </span>
    </div>
  );
}
