'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Image from 'next/image';

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
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0D1117 0%, #1A1F2E 50%, #0D1117 100%)' }}
    >
      {/* Subtle radial glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.15) 0%, transparent 70%)' }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg px-6 animate-fade-in">
        {/* Brand */}
        <div className="text-center mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <img src="/images/bigclaw-logo-transparent.jpeg" alt="BigClaw AI" width={240} className="mx-auto mb-6 rounded-xl" style={{ background: '#0D1117' }} />
          <h1 className="text-3xl font-bold text-white tracking-tight">
            BigClaw <span style={{ color: '#F97316' }}>AI</span>
          </h1>
          <p className="mt-2 text-[#9CA3AF] text-base">
            The AI-native venture studio.
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-xl p-6 animate-slide-up"
          style={{
            background: '#1E2533',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            animationDelay: '0.3s',
          }}
        >
          <form onSubmit={handleSubmit}>
            {mode === 'email' ? (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                aria-label="Email address"
                className="w-full px-4 py-3 rounded-lg text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 transition-shadow"
                style={{
                  background: '#141921',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                autoFocus
                autoComplete="email"
              />
            ) : (
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                aria-label="Password"
                className="w-full px-4 py-3 rounded-lg text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#F97316]/50 transition-shadow"
                style={{
                  background: '#141921',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
                autoFocus
              />
            )}
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              className="w-full mt-4 px-4 py-3 font-semibold rounded-lg transition-all hover:brightness-110 active:scale-[0.98]"
              style={{
                background: '#F97316',
                color: '#FFFFFF',
              }}
            >
              Sign In →
            </button>
          </form>

          <button
            onClick={() => { setMode(mode === 'email' ? 'password' : 'email'); setError(''); }}
            className="w-full mt-3 text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
          >
            {mode === 'email' ? 'Use operator password instead' : 'Use email instead'}
          </button>
        </div>

        {/* Dashboard preview teaser */}
        <div className="mt-10 animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="relative rounded-xl overflow-hidden shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <Image
              src="/images/dashboard-preview.png"
              alt="BigClaw AI Dashboard — Mission Control"
              width={1280}
              height={800}
              className="w-full h-auto opacity-60 hover:opacity-80 transition-opacity duration-500"
              priority={false}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(180deg, transparent 40%, #0D1117 100%)' }}
            />
          </div>
        </div>

        {/* Footnote */}
        <p className="text-center mt-6 text-xs text-[#4B5563] animate-slide-up" style={{ animationDelay: '0.8s' }}>
          Mission Control for AI ventures
        </p>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        .animate-slide-up {
          opacity: 0;
          animation: slideUp 0.8s ease-out forwards;
        }
      `}</style>
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
