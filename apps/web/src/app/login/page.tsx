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
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white mb-4 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">SubGuard</h1>
          <p className="mt-1 text-sm text-muted">
            Know what can charge you. Before it does.
          </p>
        </div>

        {/* Card */}
        <Card padding="lg" className="shadow-md">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
            <h2 className="text-base font-semibold text-primary">Sign in to your account</h2>
            <div className="flex items-center gap-1 text-[11px] text-muted">
              <Lock className="w-3 h-3 text-status-verified" />
              <span>Secure Session</span>
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
