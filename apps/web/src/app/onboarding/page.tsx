'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { Button, Card, Input, Select } from '@subguard/ui';
import {
  Cadence,
  CommitmentCategory,
  CommitmentType,
  CommitmentStatus,
} from '@subguard/types';
import { Shield, CheckCircle, ArrowRight, Upload, Plus } from 'lucide-react';
import { toMinorUnits } from '@subguard/utils';

export default function OnboardingPage() {
  const { user, refreshSession } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');

  // Optional quick first subscription
  const [subName, setSubName] = useState('Netflix');
  const [subMerchant, setSubMerchant] = useState('Netflix');
  const [subAmount, setSubAmount] = useState('649.00');
  const [subNextDue, setSubNextDue] = useState('2026-11-04');
  const [subPaymentMethod, setSubPaymentMethod] = useState('Credit Card ending 1234');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompleteSetup = async (addSubscription: boolean) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Update preferences
      await api.updateProfile({
        currency,
        timezone,
        onboardingCompleted: true,
      });

      // 2. If user chose to add an initial commitment
      if (addSubscription && subName && subAmount) {
        await api.createCommitment({
          name: subName,
          merchant: subMerchant || subName,
          category: CommitmentCategory.ENTERTAINMENT,
          type: CommitmentType.SUBSCRIPTION,
          amountMinor: toMinorUnits(subAmount),
          currency,
          cadence: Cadence.MONTHLY,
          nextDueAt: subNextDue,
          status: CommitmentStatus.ACTIVE,
          paymentMethodLabel: subPaymentMethod || null,
        });
      }

      await refreshSession();
      router.push('/');
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An error occurred during onboarding setup');
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white mb-3 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            Welcome to SubGuard, {user?.name || 'Friend'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Configure your financial environment in two quick steps.
          </p>
        </div>

        {step === 1 && (
          <Card padding="lg" className="shadow-md">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <h2 className="text-base font-semibold text-primary">
                Currency & Locale Preferences
              </h2>
            </div>

            <div className="space-y-4">
              <Select
                label="Base Reporting Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={[
                  { value: 'INR', label: 'INR (₹) — Indian Rupee (Default)' },
                  { value: 'USD', label: 'USD ($) — US Dollar' },
                  { value: 'EUR', label: 'EUR (€) — Euro' },
                  { value: 'GBP', label: 'GBP (£) — British Pound' },
                ]}
              />

              <Select
                label="Timezone for Advance Reminders"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={[
                  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST — UTC+5:30)' },
                  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
                  { value: 'America/New_York', label: 'America/New_York (EST)' },
                  { value: 'Europe/London', label: 'Europe/London (GMT)' },
                ]}
              />

              <div className="p-3 bg-surface-subtle border border-border rounded-lg text-xs text-muted leading-relaxed">
                SubGuard stores all values in minor currency units (paise) with exact integer arithmetic. No third-party bank credentials are ever required.
              </div>

              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={() => setStep(2)}
              >
                <span>Continue to Vault Setup</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card padding="lg" className="shadow-md">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-base font-semibold text-primary">
                Add Your First Subscription (Optional)
              </h2>
            </div>

            <div className="space-y-4">
              <Input
                label="Service / Commitment Name"
                value={subName}
                onChange={(e) => {
                  setSubName(e.target.value);
                  setSubMerchant(e.target.value);
                }}
                placeholder="e.g. Netflix, Spotify, Gym, Broadband"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount"
                  value={subAmount}
                  onChange={(e) => setSubAmount(e.target.value)}
                  placeholder="649.00"
                />
                <Input
                  label="Next Due Date"
                  type="date"
                  value={subNextDue}
                  onChange={(e) => setSubNextDue(e.target.value)}
                />
              </div>

              <Input
                label="Payment Method Label"
                value={subPaymentMethod}
                onChange={(e) => setSubPaymentMethod(e.target.value)}
                placeholder="e.g. HDFC Credit Card, Google Pay AutoPay"
                helperText="No card numbers or credentials. Just a label for your reference."
              />

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500 leading-relaxed">
                  {error}
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2.5">

                <Button
                  variant="primary"
                  className="w-full"
                  isLoading={isLoading}
                  onClick={() => handleCompleteSetup(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  <span>Save Commitment & Finish</span>
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                  onClick={() => handleCompleteSetup(false)}
                >
                  <span>Skip for now, explore dashboard</span>
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
