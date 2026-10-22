'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api-client';
import {
  DetectionCandidateDto,
  Cadence,
  CommitmentCategory,
} from '@subguard/types';
import { Card, Button, Input, Select, Modal, Badge } from '@subguard/ui';
import { formatCurrency } from '@subguard/utils';
import {
  ScanLine,
  Check,
  X,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function DetectionPage() {
  const [candidates, setCandidates] = useState<DetectionCandidateDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<DetectionCandidateDto | null>(null);

  // Confirmation Form state
  const [confName, setConfName] = useState('');
  const [confMerchant, setConfMerchant] = useState('');
  const [confCategory, setConfCategory] = useState<CommitmentCategory>(
    CommitmentCategory.ENTERTAINMENT
  );
  const [confAmount, setConfAmount] = useState('');
  const [confCadence, setConfCadence] = useState<Cadence>(Cadence.MONTHLY);
  const [confNextDue, setConfNextDue] = useState('');
  const [confPaymentMethod, setConfPaymentMethod] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const loadCandidates = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCandidates();
      setCandidates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      await api.runDetection();
      await loadCandidates();
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleOpenConfirm = (cand: DetectionCandidateDto) => {
    setSelectedCandidate(cand);
    setConfName(cand.merchantDisplayName);
    setConfMerchant(cand.merchantDisplayName);
    setConfCategory(CommitmentCategory.ENTERTAINMENT);
    setConfAmount((cand.proposedAmountMinor / 100).toFixed(2));
    setConfCadence(cand.proposedCadence);

    // Calculate next expected due date from last transaction date
    const lastDate = cand.evidence.transactionDates?.[cand.evidence.transactionDates.length - 1];
    if (lastDate) {
      const d = new Date(lastDate);
      if (cand.proposedCadence === 'MONTHLY') d.setMonth(d.getMonth() + 1);
      else if (cand.proposedCadence === 'WEEKLY') d.setDate(d.getDate() + 7);
      else if (cand.proposedCadence === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
      else if (cand.proposedCadence === 'ANNUALLY') d.setFullYear(d.getFullYear() + 1);
      setConfNextDue(d.toISOString().slice(0, 10));
    } else {
      setConfNextDue('2026-11-01');
    }
    setConfPaymentMethod('Detected from Bank Statement');
  };

  const handleConfirmSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;
    setIsConfirming(true);

    try {
      await api.confirmCandidate(selectedCandidate.id, {
        name: confName,
        merchant: confMerchant || confName,
        category: confCategory,
        amountMinor: Math.round(parseFloat(confAmount) * 100),
        cadence: confCadence,
        nextDueAt: confNextDue,
        paymentMethodLabel: confPaymentMethod,
      });
      setSelectedCandidate(null);
      loadCandidates();
    } catch (err) {
      console.error(err);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleDismiss = async (candidateId: string) => {
    try {
      await api.dismissCandidate(candidateId);
      loadCandidates();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-white" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Pattern Detection Engine
            </h1>
            <span className="px-2 py-0.5 rounded-sm bg-[#111111] border border-[#27272A] text-[10px] font-mono text-zinc-400">
              DETERMINISTIC
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#888888] mt-0.5">
            Cadence clustering analyzing repeated debit cycles from transaction statements.
          </p>
        </div>

        <Button
          variant="primary"
          isLoading={isScanning}
          onClick={handleRunScan}
        >
          <ScanLine className="w-3.5 h-3.5 mr-2" />
          <span>Scan All Transactions</span>
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-surface border border-border rounded-xl" />
          ))}
        </div>
      ) : candidates.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <Layers className="w-10 h-10 text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-primary">
            No unreviewed recurrence candidates
          </h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            Run a transaction scan or import more monthly statements to discover hidden subscriptions.
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={handleRunScan}>
              Run Recurrence Scan
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {candidates.map((cand) => (
            <Card key={cand.id} padding="md" className="border-[#222222] shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-[#161616] text-white border border-[#27272A] flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    {cand.merchantDisplayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-primary">
                        {cand.merchantDisplayName}
                      </h3>
                      <Badge variant="warning">
                        {Math.round(cand.confidence * 100)}% Confidence
                      </Badge>
                      <Badge variant="neutral">
                        {cand.proposedCadence}
                      </Badge>
                      {cand.amountIsVariable && (
                        <Badge variant="info">Variable Billing</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      Average cycle: {cand.evidence.averageIntervalDays} days • {cand.evidence.matchedTransactionCount} supporting transactions
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-4">
                  <div className="text-left lg:text-right">
                    <span className="text-xs text-muted block">Proposed Amount</span>
                    <span className="text-base font-mono font-bold tabular-nums text-primary">
                      {formatCurrency(cand.proposedAmountMinor, 'INR')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenConfirm(cand)}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Confirm Subscription</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(cand.id)}
                    >
                      <X className="w-3.5 h-3.5 mr-1 text-muted" />
                      <span>Dismiss</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Traceable Evidence Trail */}
              <div className="pt-3 text-xs">
                <span className="font-semibold text-primary block mb-1">
                  Traceable Algorithm Evidence:
                </span>
                <ul className="space-y-1 list-disc list-inside text-muted">
                  {cand.evidence.reasons?.map((reason, idx) => (
                    <li key={idx}>{reason}</li>
                  ))}
                  {cand.evidence.transactionDates && (
                    <li>
                      Billing dates observed:{' '}
                      <span className="font-mono text-primary">
                        {cand.evidence.transactionDates.join(', ')}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={Boolean(selectedCandidate)}
          onClose={() => setSelectedCandidate(null)}
          title={`Confirm Subscription: ${selectedCandidate.merchantDisplayName}`}
          description="Review and add this detected candidate into your active subscription vault."
        >
          <form onSubmit={handleConfirmSubmit} className="space-y-3.5 text-xs">
            <Input
              label="Subscription Name"
              required
              value={confName}
              onChange={(e) => setConfName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Amount (INR)"
                required
                value={confAmount}
                onChange={(e) => setConfAmount(e.target.value)}
              />
              <Select
                label="Cadence"
                value={confCadence}
                onChange={(e) => setConfCadence(e.target.value as Cadence)}
                options={[
                  { value: 'MONTHLY', label: 'Monthly' },
                  { value: 'ANNUALLY', label: 'Annually' },
                  { value: 'QUARTERLY', label: 'Quarterly' },
                  { value: 'WEEKLY', label: 'Weekly' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Category"
                value={confCategory}
                onChange={(e) => setConfCategory(e.target.value as CommitmentCategory)}
                options={[
                  { value: 'ENTERTAINMENT', label: 'Entertainment' },
                  { value: 'PRODUCTIVITY', label: 'Productivity' },
                  { value: 'UTILITIES', label: 'Utilities' },
                  { value: 'HEALTH_FITNESS', label: 'Health & Fitness' },
                  { value: 'FINANCE_EMI', label: 'Finance & EMI' },
                  { value: 'CLOUD_HOSTING', label: 'Cloud & Hosting' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
              <Input
                label="Next Expected Due Date"
                type="date"
                required
                value={confNextDue}
                onChange={(e) => setConfNextDue(e.target.value)}
              />
            </div>

            <Input
              label="Payment Channel"
              value={confPaymentMethod}
              onChange={(e) => setConfPaymentMethod(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedCandidate(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isConfirming}>
                Confirm & Add to Vault
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}
