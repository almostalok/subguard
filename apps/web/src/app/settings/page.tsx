'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';
import { Card, Button, Input, Select, Badge } from '@subguard/ui';
import {
  Settings,
  Download,
  Trash2,
  Shield,
  Lock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshSession, logout } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [currency, setCurrency] = useState(user?.currency || 'INR');
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Deletion modal state
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCurrency(user.currency);
      setTimezone(user.timezone);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await api.updateProfile({
        name,
        currency,
        timezone,
      });
      await refreshSession();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      const data = await api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subguard_export_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm permanent account removal');
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteAccount();
      await logout();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
              Account & Privacy Settings
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Manage your locale, security preferences, data export, and deletion rights.
          </p>
        </div>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Profile Settings */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-primary pb-3 border-b border-border mb-4">
            Profile & Locale Preferences
          </h2>

          {saveSuccess && (
            <div className="mb-4 p-3 bg-status-verified-bg text-status-verified border border-status-verified-border rounded-lg text-xs font-medium">
              Preferences updated successfully!
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rohan Sharma"
              />
              <Input
                label="Registered Email"
                disabled
                value={user?.email || ''}
                helperText="Email is permanently bound to this account"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Reporting Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                options={[
                  { value: 'INR', label: 'INR (₹) — Indian Rupee' },
                  { value: 'USD', label: 'USD ($) — US Dollar' },
                  { value: 'EUR', label: 'EUR (€) — Euro' },
                  { value: 'GBP', label: 'GBP (£) — British Pound' },
                ]}
              />

              <Select
                label="Primary Timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={[
                  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST — UTC+5:30)' },
                  { value: 'UTC', label: 'UTC' },
                  { value: 'America/New_York', label: 'America/New_York (EST)' },
                  { value: 'Europe/London', label: 'Europe/London (GMT)' },
                ]}
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" isLoading={isSaving}>
                Save Preferences
              </Button>
            </div>
          </form>
        </Card>

        {/* Data Export & Portability */}
        <Card padding="lg">
          <div className="flex items-start justify-between pb-3 border-b border-border mb-4">
            <div>
              <h2 className="text-sm font-semibold text-primary">
                Data Portability & Complete Export
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Download a full JSON archive of your subscriptions, mandates, transactions, and audit records.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="w-4 h-4 mr-1.5" />
              <span>Export JSON Archive</span>
            </Button>
          </div>

          <div className="p-3 bg-surface-subtle border border-border rounded-lg text-xs text-muted leading-relaxed">
            Exports contain raw structured records formatted in accordance with digital data portability standards. You can use this archive for personal backups or to migrate to external spreadsheets.
          </div>
        </Card>

        {/* Security & Data Privacy Disclosures */}
        <Card padding="lg">
          <h2 className="text-sm font-semibold text-primary pb-3 border-b border-border mb-3">
            Security & Retention Governance
          </h2>
          <div className="space-y-3 text-xs text-muted leading-relaxed">
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-status-verified shrink-0 mt-0.5" />
              <span>
                <strong className="text-primary font-medium">Session Token Hashing:</strong> Cookie tokens are generated as 256-bit cryptographically secure strings and stored solely as SHA-256 hashes in PostgreSQL.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-status-verified shrink-0 mt-0.5" />
              <span>
                <strong className="text-primary font-medium">Zero Sensitive Financial Credentials:</strong> SubGuard never prompts for bank passwords, UPI PINs, 16-digit card numbers, or OTPs.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-status-verified shrink-0 mt-0.5" />
              <span>
                <strong className="text-primary font-medium">CSV Sandboxing:</strong> All statement imports are parsed as raw UTF-8 text streams and stripped of formula injection prefixes (`=`, `+`, `-`, `@`).
              </span>
            </div>
          </div>
        </Card>

        {/* Danger Zone: Account Deletion */}
        <Card padding="lg" className="border-status-risk-border bg-status-risk-bg/20">
          <div className="pb-3 border-b border-status-risk-border mb-4">
            <h2 className="text-sm font-semibold text-status-risk">
              Danger Zone — Irreversible Account Deletion
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Permanently purge your account, commitments, mandates, transactions, and session tokens.
            </p>
          </div>

          {deleteError && (
            <div className="mb-4 p-3 bg-status-risk-bg border border-status-risk-border rounded-lg text-xs text-status-risk">
              {deleteError}
            </div>
          )}

          <div className="space-y-3 text-xs">
            <p className="text-muted leading-relaxed">
              In compliance with DPDP & GDPR 'Right to be Forgotten' mandates, deleting your account initiates an immediate database cascade removing all associated records from persistent storage.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <input
                type="text"
                placeholder="Type DELETE to confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 text-xs bg-surface border border-status-risk-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-status-risk min-h-[44px]"
              />
              <Button
                variant="danger"
                isLoading={isDeleting}
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span>Permanently Delete My Account</span>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
