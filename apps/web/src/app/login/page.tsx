'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Button, Input, Card } from '@subguard/ui';
import { Shield, ArrowRight, Lock } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@subguard.local');
    setPassword('DemoPassword123!');
    setIsLoading(true);
    try {
      await login({ email: 'demo@subguard.local', password: 'DemoPassword123!' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo account not seeded');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black bg-grid-vercel flex flex-col justify-center items-center p-4 antialiased text-[#EDEDED]">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-white text-black mb-3 shadow-xs font-mono font-bold text-sm">
            ▲
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">subguard</h1>
          <p className="mt-1 text-xs text-[#888888] font-mono">
            Recurring deduction guardian for India
          </p>
        </div>

        {/* Card */}
        <Card padding="lg" className="border-[#222222] shadow-2xl bg-[#0A0A0A]">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#222222]">
            <h2 className="text-sm font-semibold text-white tracking-tight">Sign in to your vault</h2>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>SECURE SESSION</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-status-risk-bg border border-status-risk-border rounded-lg text-xs text-status-risk font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              autoComplete="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Fill */}
          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="text-xs text-muted hover:text-primary transition-colors text-center py-1.5 rounded-md hover:bg-surface-subtle"
            >
              Fill Demo Account Credentials (demo@subguard.local)
            </button>
          </div>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted">
          Don&apos;t have an account yet?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
