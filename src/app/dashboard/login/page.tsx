'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'email' | 'password'>('email');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const body = mode === 'email'
      ? { email: email.toLowerCase().trim() }
      : { password };

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const from = searchParams.get('from') || '/dashboard';
      router.push(from);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">Dashboard Login</h1>
        <p className="text-muted text-sm mb-6">
          {mode === 'email' ? 'Enter your authorized email to continue.' : 'Enter the operator password to continue.'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'email' ? (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              autoFocus
              autoComplete="email"
            />
          ) : (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
              autoFocus
            />
          )}
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            className="w-full mt-4 px-4 py-2.5 bg-accent text-background font-medium rounded-lg hover:bg-accent-dim transition-colors"
          >
            Sign In
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'email' ? 'password' : 'email'); setError(''); }}
          className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === 'email' ? 'Use operator password instead' : 'Use email instead'}
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
