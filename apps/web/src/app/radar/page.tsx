'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api-client';
import { RadarItemDto, EvidenceLevel } from '@subguard/types';
import { Card, Button, EvidenceBadge, Modal, Badge } from '@subguard/ui';
import { formatCurrency } from '@subguard/utils';
import {
  Radar,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Bell,
  Clock,
  Filter,
  Info,
} from 'lucide-react';

export default function RadarPage() {
  const [items, setItems] = useState<RadarItemDto[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [selectedItem, setSelectedItem] = useState<RadarItemDto | null>(null);
  const [daysAhead, setDaysAhead] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  const [reminderSaved, setReminderSaved] = useState(false);

  useEffect(() => {
    async function loadRadar() {
      setIsLoading(true);
      try {
        const data = await api.getRadarForecast(daysAhead);
        setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRadar();
  }, [daysAhead]);

  const filteredItems = items.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    return item.evidenceLevel === selectedFilter;
  });

  const handleAddReminder = async (commitmentId: string) => {
    try {
      await api.createReminder({
        commitmentId,
        reminderType: 'DAYS_BEFORE_DUE',
        offsetDays: 3,
        enabled: true,
        channel: 'IN_APP',
      });
      setReminderSaved(true);
      setTimeout(() => setReminderSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell>
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
              Deduction Radar
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Chronological lookahead of expected debits, expiring trials, and potential renewals.
          </p>
        </div>

        {/* Horizon selector */}
        <div className="flex items-center gap-1 bg-[#0A0A0A] p-1 rounded-md border border-[#222222]">
          {[14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDaysAhead(d)}
              className={`px-3 py-1.5 text-xs font-mono font-medium rounded transition-colors min-h-[32px] ${
                daysAhead === d
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Evidence Guidance Banner */}
      <div className="mb-6 p-4 bg-[#0A0A0A] border border-[#222222] rounded-lg flex items-start gap-3 text-xs text-[#888888] leading-relaxed">
        <Info className="w-4 h-4 text-white shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">
            Explainable Evidence Model:
          </span>{' '}
          SubGuard never presents predictions as guaranteed future debits. Items are tagged as{' '}
          <span className="text-emerald-400 font-mono">Confirmed</span> (active verified commitments),{' '}
          <span className="text-blue-400 font-mono">Expected</span> (from cadence schedule),{' '}
          <span className="text-amber-400 font-mono">Potential</span> (detected candidate), or{' '}
          <span className="text-red-400 font-mono">Needs Review</span> (trial expiration or past due).
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none font-mono">
        {['ALL', 'CONFIRMED', 'EXPECTED', 'POTENTIAL', 'NEEDS_REVIEW'].map(
          (filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-2.5 py-1 text-xs rounded-md shrink-0 transition-colors uppercase tracking-wider min-h-[32px] ${
                selectedFilter === filter
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#0A0A0A] text-[#888888] border border-[#27272A] hover:text-white hover:border-[#3F3F46]'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          )
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-surface border border-border rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <Card padding="lg" className="text-center py-12">
          <Calendar className="w-8 h-8 text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-primary">
            No deductions found for selected filter
          </h3>
          <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
            Change your horizon or add subscriptions in your vault to track upcoming charges.
          </p>
        </Card>
      )}

      {/* Timeline List */}
      {!isLoading && filteredItems.length > 0 && (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="p-4 bg-surface border border-border rounded-xl hover:border-border-strong cursor-pointer transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[56px]"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-subtle border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0">
                  {item.merchant.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {item.title}
                    </span>
                    <EvidenceBadge level={item.evidenceLevel} />
                    {item.isExpiringTrial && (
                      <Badge variant="risk">Trial Ending</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {item.dueDate} • via {item.paymentMethodLabel || 'Registered account'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                <div className="text-left sm:text-right">
                  <span className="text-base font-mono font-semibold tabular-nums text-primary">
                    {formatCurrency(item.amountMinor, item.currency)}
                  </span>
                  <span className="block text-[11px] text-muted capitalize">
                    {item.cadence.toLowerCase()}
                  </span>
                </div>
                <Button variant="secondary" size="sm">
                  Inspect
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Item Inspector Modal */}
      {selectedItem && (
        <Modal
          isOpen={Boolean(selectedItem)}
          onClose={() => setSelectedItem(null)}
          title={selectedItem.title}
          description={`Evidence: ${selectedItem.evidenceLevel} • Next Due: ${selectedItem.dueDate}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-surface-subtle border border-border rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Merchant</span>
                <span className="font-semibold text-primary">{selectedItem.merchant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Expected Amount</span>
                <span className="font-mono font-semibold text-primary">
                  {formatCurrency(selectedItem.amountMinor, selectedItem.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Cadence</span>
                <span className="capitalize text-primary">{selectedItem.cadence.toLowerCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Payment Channel</span>
                <span className="text-primary">{selectedItem.paymentMethodLabel || 'Not specified'}</span>
              </div>
            </div>

            {selectedItem.notes && (
              <div className="p-3 bg-surface-subtle rounded-lg">
                <span className="font-semibold text-primary block mb-1">Notes & Context</span>
                <p className="text-muted">{selectedItem.notes}</p>
              </div>
            )}

            {reminderSaved && (
              <div className="p-2.5 bg-status-verified-bg text-status-verified border border-status-verified-border rounded-lg text-center font-medium">
                Advance reminder enabled for this commitment!
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              {selectedItem.sourceId && (
                <Button
                  variant="primary"
                  onClick={() => handleAddReminder(selectedItem.sourceId)}
                >
                  <Bell className="w-4 h-4 mr-2" />
                  <span>Notify Me 3 Days Before</span>
                </Button>
              )}

              {selectedItem.cancellationUrl && (
                <a
                  href={selectedItem.cancellationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-surface-subtle text-primary border border-border hover:bg-surface-hover font-medium min-h-[44px]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Official Cancellation Portal</span>
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
