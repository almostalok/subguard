'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Button, Input, Card, Select } from '@subguard/ui';
import { Shield, Lock } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        currency,
        timezone: 'Asia/Kolkata',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
            <h2 className="text-base font-semibold text-primary">Create your private vault</h2>
            <div className="flex items-center gap-1 text-[11px] text-muted">
              <Lock className="w-3 h-3 text-status-verified" />
              <span>Isolated Data</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-status-risk-bg border border-status-risk-border rounded-lg text-xs text-status-risk font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Rohan Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

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
              autoComplete="new-password"
              placeholder="Minimum 8 characters"
              helperText="Must be at least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Select
              label="Default Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={[
                { value: 'INR', label: 'INR (₹) — Indian Rupee (Default)' },
                { value: 'USD', label: 'USD ($) — US Dollar' },
                { value: 'EUR', label: 'EUR (€) — Euro' },
                { value: 'GBP', label: 'GBP (£) — British Pound' },
              ]}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              Get Started
            </Button>
          </form>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-muted">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
