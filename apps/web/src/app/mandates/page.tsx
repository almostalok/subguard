'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api-client';
import {
  MandateDto,
  MandateKind,
  MandateFrequency,
  MandateStatus,
} from '@subguard/types';
import { Card, Button, Input, Select, Modal, Badge } from '@subguard/ui';
import { formatCurrency, toMinorUnits } from '@subguard/utils';
import {
  CreditCard,
  Plus,
  ShieldAlert,
  Info,
  ExternalLink,
  Trash2,
  CheckCircle,
} from 'lucide-react';

export default function MandatesPage() {
  const [mandates, setMandates] = useState<MandateDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inspectMandate, setInspectMandate] = useState<MandateDto | null>(null);

  // Form State
  const [formKind, setFormKind] = useState<MandateKind>(MandateKind.UPI_AUTOPAY);
  const [formReference, setFormReference] = useState('');
  const [formMaxAmount, setFormMaxAmount] = useState('');
  const [formFrequency, setFormFrequency] = useState<MandateFrequency>(
    MandateFrequency.MONTHLY
  );
  const [formNextExpected, setFormNextExpected] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMandates = async () => {
    setIsLoading(true);
    try {
      const data = await api.getMandates();
      setMandates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMandates();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createMandate({
        kind: formKind,
        providerReference: formReference || null,
        maximumAmountMinor: formMaxAmount ? toMinorUnits(formMaxAmount) : null,
        currency: 'INR',
        frequency: formFrequency,
        status: MandateStatus.ACTIVE,
        nextExpectedAt: formNextExpected || null,
        cancellationInstructions: formInstructions || null,
      });
      setIsModalOpen(false);
      loadMandates();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this mandate record from your register?')) return;
    try {
      await api.deleteMandate(id);
      loadMandates();
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
            <CreditCard className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
              AutoPay & Mandate Register
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Audit registered UPI AutoPay, e-mandates, NACH, and standing instructions.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          <span>Record Mandate</span>
        </Button>
      </div>

      {/* Security & Verification Disclaimer */}
      <div className="mb-6 p-4 bg-surface border border-border rounded-xl flex items-start gap-3 text-xs text-muted leading-relaxed">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-primary">Mandate Governance Notice:</span>{' '}
          In accordance with RBI e-mandate guidelines, recurring instructions can only be legally modified or revoked directly through your issuing bank or UPI application (e.g. BHIM, Google Pay, PhonePe, NetBanking). SubGuard maintains an independent audit register to help you track maximum caps and expected dates, and never claims to execute bank-level revocations without verified authorization.
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface border border-border rounded-xl" />
          ))}
        </div>
      ) : mandates.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <CreditCard className="w-8 h-8 text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-primary">No mandates registered</h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            Record active UPI AutoPay approvals or card recurring mandates to ensure you are never caught off guard.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {mandates.map((mandate) => (
            <div
              key={mandate.id}
              className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start md:items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-subtle border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0">
                  {mandate.kind === 'UPI_AUTOPAY' ? 'UPI' : 'SI'}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {mandate.commitment?.name || mandate.kind.replace('_', ' ')}
                    </span>
                    <Badge variant="neutral">
                      {mandate.kind.replace('_', ' ')}
                    </Badge>
                    <Badge variant="warning">
                      Manual Unverified
                    </Badge>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Ref / UMN: <span className="font-mono text-primary">{mandate.providerReference || 'None'}</span> • Frequency: {mandate.frequency.toLowerCase()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                <div className="text-left md:text-right">
                  <span className="text-xs text-muted block">Maximum Debit Cap</span>
                  <span className="text-sm font-mono font-semibold tabular-nums text-primary">
                    {mandate.maximumAmountMinor
                      ? formatCurrency(mandate.maximumAmountMinor, mandate.currency)
                      : 'As Presented'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setInspectMandate(mandate)}
                  >
                    Cancellation Guide
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(mandate.id)}
                    aria-label="Delete mandate record"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-status-risk" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guide Modal */}
      {inspectMandate && (
        <Modal
          isOpen={Boolean(inspectMandate)}
          onClose={() => setInspectMandate(null)}
          title={`How to Revoke: ${inspectMandate.kind.replace('_', ' ')}`}
          description="Legitimate revocation requires authentication within your payment provider app."
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-surface-subtle border border-border rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Mandate Type</span>
                <span className="font-semibold text-primary">{inspectMandate.kind}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Unique Mandate Number (UMN)</span>
                <span className="font-mono font-semibold text-primary">
                  {inspectMandate.providerReference || 'Not provided'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Debit Limit Cap</span>
                <span className="font-mono text-primary">
                  {inspectMandate.maximumAmountMinor
                    ? formatCurrency(inspectMandate.maximumAmountMinor, inspectMandate.currency)
                    : 'Unlimited / As Presented'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-status-warning-bg border border-status-warning-border rounded-lg text-primary">
              <span className="font-semibold block mb-1">Revocation Steps</span>
              <p className="leading-relaxed">
                {inspectMandate.cancellationInstructions ||
                  'Open your UPI app (Google Pay / PhonePe / Paytm / BHIM) > Profile > Autopay Mandates > Find this merchant > Tap "Pause" or "Revoke Mandate" and enter your UPI PIN to authenticate.'}
              </p>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setInspectMandate(null)}>
                Understood
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record Mandate or AutoPay Instruction"
          description="Log authorized recurring debits from your bank or UPI statements."
        >
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <Select
              label="Mandate Type"
              value={formKind}
              onChange={(e) => setFormKind(e.target.value as MandateKind)}
              options={[
                { value: 'UPI_AUTOPAY', label: 'UPI AutoPay (Google Pay / PhonePe / Paytm)' },
                { value: 'CARD_E_MANDATE', label: 'Card Recurring Mandate (e-Mandate)' },
                { value: 'BANK_STANDING_INSTRUCTION', label: 'Bank Standing Instruction (SI)' },
                { value: 'NACH_DEBIT', label: 'NACH / ECS Direct Debit' },
                { value: 'OTHER', label: 'Other Recurring Mandate' },
              ]}
            />

            <Input
              label="Provider Reference / UMN"
              placeholder="e.g. UMN-102938102 or Mandate ID"
              value={formReference}
              onChange={(e) => setFormReference(e.target.value)}
              helperText="Found on SMS confirmation or UPI app mandate list"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Maximum Limit Cap (INR)"
                placeholder="e.g. 2000.00"
                value={formMaxAmount}
                onChange={(e) => setFormMaxAmount(e.target.value)}
              />
              <Select
                label="Frequency"
                value={formFrequency}
                onChange={(e) => setFormFrequency(e.target.value as MandateFrequency)}
                options={[
                  { value: 'MONTHLY', label: 'Monthly' },
                  { value: 'AS_PRESENTED', label: 'As Presented' },
                  { value: 'WEEKLY', label: 'Weekly' },
                  { value: 'QUARTERLY', label: 'Quarterly' },
                  { value: 'ANNUALLY', label: 'Annually' },
                ]}
              />
            </div>

            <Input
              label="Next Expected Date"
              type="date"
              value={formNextExpected}
              onChange={(e) => setFormNextExpected(e.target.value)}
            />

            <Input
              label="Revocation Guidance Notes"
              placeholder="e.g. Go to PhonePe > Autopay > Cancel"
              value={formInstructions}
              onChange={(e) => setFormInstructions(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Save Mandate
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}
