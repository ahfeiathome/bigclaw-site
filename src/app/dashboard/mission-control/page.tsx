'use client';

import { useState, useEffect } from 'react';

const MC_URL = 'http://localhost:3001';

export default function MissionControlPage() {
  const [status, setStatus] = useState<'loading' | 'online' | 'offline'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    fetch(MC_URL, { mode: 'no-cors', signal: controller.signal })
      .then(() => {
        clearTimeout(timer);
        setStatus('online');
      })
      .catch(() => {
        clearTimeout(timer);
        setStatus('offline');
      });

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">Mission Control</h2>
          <p className="text-xs text-muted">
            Agent orchestration dashboard — localhost:3001
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-mono px-2 py-1 rounded ${
              status === 'online'
                ? 'bg-green-500/10 text-green-400'
                : status === 'offline'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                status === 'online'
                  ? 'bg-green-400'
                  : status === 'offline'
                    ? 'bg-red-400'
                    : 'bg-amber-400 animate-pulse'
              }`}
            />
            {status === 'loading' ? 'Checking...' : status === 'online' ? 'Online' : 'Offline'}
          </span>
          {status === 'offline' && (
            <button
              onClick={() => {
                setStatus('loading');
                fetch(MC_URL, { mode: 'no-cors' })
                  .then(() => setStatus('online'))
                  .catch(() => setStatus('offline'));
              }}
              className="text-xs text-accent hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      {status === 'online' && (
        <div className="border border-border rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
          <iframe
            src={MC_URL}
            className="w-full h-full border-0"
            title="Mission Control"
            allow="clipboard-write"
          />
        </div>
      )}

      {status === 'offline' && (
        <div className="border border-border rounded-lg p-12 text-center">
          <div className="text-4xl mb-4">🖥️</div>
          <h3 className="text-lg font-semibold mb-2">Mission Control is offline</h3>
          <p className="text-muted text-sm mb-6 max-w-md mx-auto">
            Mission Control runs locally on port 3001. Start it to see the agent orchestration
            dashboard here.
          </p>
          <div className="bg-surface border border-border rounded-lg p-4 inline-block text-left">
            <p className="text-xs text-muted mb-1">Start Mission Control:</p>
            <code className="text-sm font-mono text-accent">
              cd ~/Projects/mission-control && ./restart.sh
            </code>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="border border-border rounded-lg p-12 text-center">
          <div className="text-muted text-sm">Checking Mission Control availability...</div>
        </div>
      )}
    </div>
  );
}
