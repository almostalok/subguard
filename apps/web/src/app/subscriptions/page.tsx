'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api-client';
import {
  CommitmentDto,
  Cadence,
  CommitmentCategory,
  CommitmentType,
  CommitmentStatus,
} from '@subguard/types';
import {
  Card,
  Button,
  Input,
  Select,
  StatusBadge,
  Modal,
} from '@subguard/ui';
import { formatCurrency, toMinorUnits } from '@subguard/utils';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  Archive,
} from 'lucide-react';

function SubscriptionsContent() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CommitmentDto[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formCategory, setFormCategory] = useState<CommitmentCategory>(
    CommitmentCategory.ENTERTAINMENT
  );
  const [formType, setFormType] = useState<CommitmentType>(
    CommitmentType.SUBSCRIPTION
  );
  const [formAmount, setFormAmount] = useState('');
  const [formCadence, setFormCadence] = useState<Cadence>(Cadence.MONTHLY);
  const [formNextDue, setFormNextDue] = useState('2026-11-01');
  const [formPaymentMethod, setFormPaymentMethod] = useState('');
  const [formCancellationUrl, setFormCancellationUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<CommitmentStatus>(
    CommitmentStatus.ACTIVE
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCommitments({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: search || undefined,
        limit: 50,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, search]);

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      openCreateModal();
    }
  }, [searchParams]);

  const openCreateModal = () => {
    setEditingId(null);
    setFormName('');
    setFormMerchant('');
    setFormCategory(CommitmentCategory.ENTERTAINMENT);
    setFormType(CommitmentType.SUBSCRIPTION);
    setFormAmount('');
    setFormCadence(Cadence.MONTHLY);
    setFormNextDue('2026-11-01');
    setFormPaymentMethod('');
    setFormCancellationUrl('');
    setFormNotes('');
    setFormStatus(CommitmentStatus.ACTIVE);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: CommitmentDto) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormMerchant(item.merchant);
    setFormCategory(item.category);
    setFormType(item.type);
    setFormAmount((item.amountMinor / 100).toFixed(2));
    setFormCadence(item.cadence);
    setFormNextDue(item.nextDueAt);
    setFormPaymentMethod(item.paymentMethodLabel || '');
    setFormCancellationUrl(item.cancellationUrl || '');
    setFormNotes(item.notes || '');
    setFormStatus(item.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountMinor = toMinorUnits(formAmount);
    if (amountMinor <= 0) {
      setFormError('Please specify a positive amount');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await api.updateCommitment(editingId, {
          name: formName,
          merchant: formMerchant || formName,
          category: formCategory,
          type: formType,
          amountMinor,
          cadence: formCadence,
          nextDueAt: formNextDue,
          status: formStatus,
          paymentMethodLabel: formPaymentMethod || null,
          cancellationUrl: formCancellationUrl || null,
          notes: formNotes || null,
        });
      } else {
        await api.createCommitment({
          name: formName,
          merchant: formMerchant || formName,
          category: formCategory,
          type: formType,
          amountMinor,
          currency: 'INR',
          cadence: formCadence,
          nextDueAt: formNextDue,
          status: formStatus,
          paymentMethodLabel: formPaymentMethod || null,
          cancellationUrl: formCancellationUrl || null,
          notes: formNotes || null,
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to save commitment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: CommitmentStatus) => {
    try {
      await api.updateCommitment(id, { status });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this commitment?')) {
      return;
    }
    try {
      await api.deleteCommitment(id);
      loadData();
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
              Subscription Vault
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Organize, update, and manage all your recurring commitments and subscriptions.
          </p>
        </div>

        <Button variant="primary" onClick={openCreateModal}>
          <Plus className="w-4 h-4 mr-2" />
          <span>Add Commitment</span>
        </Button>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="p-4 bg-surface border border-border rounded-xl shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search subscriptions or cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-subtle border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          >
            <option value="ACTIVE">Status: Active</option>
            <option value="PAUSED">Status: Paused</option>
            <option value="CANCELLED">Status: Cancelled</option>
            <option value="ARCHIVED">Status: Archived</option>
            <option value="">Status: All</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-subtle border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          >
            <option value="">All Categories</option>
            <option value="ENTERTAINMENT">Entertainment</option>
            <option value="PRODUCTIVITY">Productivity</option>
            <option value="UTILITIES">Utilities</option>
            <option value="HEALTH_FITNESS">Health & Fitness</option>
            <option value="FINANCE_EMI">Finance & EMI</option>
            <option value="CLOUD_HOSTING">Cloud & Hosting</option>
            <option value="MEMBERSHIP">Membership</option>
            <option value="INSURANCE">Insurance</option>
          </select>
        </div>
      </div>

      {/* Table / Card View */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-surface border border-border rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <CreditCard className="w-8 h-8 text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-primary">No commitments match your filter</h3>
          <p className="text-xs text-muted mt-1">
            Click &quot;Add Commitment&quot; to track your first recurring subscription.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start md:items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-subtle border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0">
                  {item.merchant.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {item.name}
                    </span>
                    <StatusBadge status={item.status} />
                    <span className="text-[11px] text-muted capitalize px-2 py-0.5 rounded-full bg-surface-subtle border border-border">
                      {item.category.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Next Due: <span className="font-medium text-primary">{item.nextDueAt}</span> • {item.paymentMethodLabel || 'No card label'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-border">
                <div className="text-left md:text-right">
                  <span className="text-base font-mono font-semibold tabular-nums text-primary">
                    {formatCurrency(item.amountMinor, item.currency)}
                  </span>
                  <span className="block text-[11px] text-muted capitalize">
                    {item.cadence.toLowerCase()}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      handleStatusChange(
                        item.id,
                        e.target.value as CommitmentStatus
                      )
                    }
                    className="text-xs bg-surface-subtle border border-border rounded-md px-2 py-1 text-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[36px]"
                    aria-label="Change commitment status"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditModal(item)}
                    aria-label="Edit commitment"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-muted hover:text-primary" />
                  </Button>

                  {item.cancellationUrl && (
                    <a
                      href={item.cancellationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-muted hover:text-primary min-w-[36px] min-h-[36px] flex items-center justify-center"
                      title="Open cancellation page"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    aria-label="Delete commitment"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-status-risk" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingId ? 'Edit Commitment' : 'Add Recurring Commitment'}
          description="Enter exact billing details to monitor charges and configure reminders."
        >
          {formError && (
            <div className="mb-4 p-3 bg-status-risk-bg border border-status-risk-border rounded-lg text-xs text-status-risk">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Commitment Name"
              required
              placeholder="e.g. Netflix 4K, Spotify Family, AWS"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Merchant"
                required
                placeholder="e.g. Netflix"
                value={formMerchant}
                onChange={(e) => setFormMerchant(e.target.value)}
              />
              <Input
                label="Amount (INR)"
                required
                placeholder="649.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Cadence"
                value={formCadence}
                onChange={(e) => setFormCadence(e.target.value as Cadence)}
                options={[
                  { value: 'MONTHLY', label: 'Monthly' },
                  { value: 'ANNUALLY', label: 'Annually' },
                  { value: 'QUARTERLY', label: 'Quarterly' },
                  { value: 'WEEKLY', label: 'Weekly' },
                  { value: 'SEMI_ANNUALLY', label: 'Semi-Annually' },
                ]}
              />
              <Input
                label="Next Due Date"
                type="date"
                required
                value={formNextDue}
                onChange={(e) => setFormNextDue(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Category"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as CommitmentCategory)}
                options={[
                  { value: 'ENTERTAINMENT', label: 'Entertainment' },
                  { value: 'PRODUCTIVITY', label: 'Productivity' },
                  { value: 'UTILITIES', label: 'Utilities' },
                  { value: 'HEALTH_FITNESS', label: 'Health & Fitness' },
                  { value: 'FINANCE_EMI', label: 'Finance & EMI' },
                  { value: 'CLOUD_HOSTING', label: 'Cloud & Hosting' },
                  { value: 'MEMBERSHIP', label: 'Membership' },
                  { value: 'INSURANCE', label: 'Insurance' },
                  { value: 'OTHER', label: 'Other' },
                ]}
              />
              <Select
                label="Commitment Type"
                value={formType}
                onChange={(e) => setFormType(e.target.value as CommitmentType)}
                options={[
                  { value: 'SUBSCRIPTION', label: 'Subscription' },
                  { value: 'MANDATE', label: 'AutoPay / Mandate' },
                  { value: 'EMI', label: 'EMI / Loan' },
                  { value: 'FREE_TRIAL', label: 'Free Trial' },
                  { value: 'INSURANCE_PREMIUM', label: 'Insurance Premium' },
                  { value: 'UTILITY_BILL', label: 'Utility Bill' },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as CommitmentStatus)}
                options={[
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'PAUSED', label: 'Paused' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                  { value: 'ARCHIVED', label: 'Archived' },
                ]}
              />
              <Input
                label="Payment Method Label"
                placeholder="e.g. HDFC Infinia ending 1042"
                value={formPaymentMethod}
                onChange={(e) => setFormPaymentMethod(e.target.value)}
                helperText="Safe label. No card numbers or passwords stored."
              />
            </div>

            <Input
              label="Official Cancellation URL"
              type="url"
              placeholder="https://..."
              value={formCancellationUrl}
              onChange={(e) => setFormCancellationUrl(e.target.value)}
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
                Save Commitment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </AppShell>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      }
    >
      <SubscriptionsContent />
    </Suspense>
  );
}
