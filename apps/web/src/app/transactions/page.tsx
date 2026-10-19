'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api-client';
import { TransactionDto, TransactionDirection } from '@subguard/types';
import { Card, Button, Badge } from '@subguard/ui';
import { formatCurrency } from '@subguard/utils';
import { Receipt, Search, Filter, Ban, CheckCircle2 } from 'lucide-react';

export default function TransactionsPage() {
  const [items, setItems] = useState<TransactionDto[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<string>('DEBIT');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTransactions({
        direction: direction || undefined,
        search: search || undefined,
        page,
        limit: 25,
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
    loadTransactions();
  }, [direction, search, page]);

  const handleToggleExclude = async (id: string) => {
    try {
      const res = await api.toggleExcludeTransaction(id);
      setItems((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, isExcludedFromDetection: res.isExcludedFromDetection } : t
        )
      );
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
            <Receipt className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
              Transaction Ledger
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Audit normalized transaction records and exclude irregular one-off purchases.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="p-4 bg-surface border border-border rounded-xl shadow-xs mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search narrations or merchants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface-subtle border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="px-3 py-2 text-xs bg-surface-subtle border border-border rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
          >
            <option value="DEBIT">Direction: Debits Only</option>
            <option value="CREDIT">Direction: Credits Only</option>
            <option value="">Direction: All</option>
          </select>
        </div>
      </div>

      {/* Table / Cards */}
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-surface border border-border rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card padding="lg" className="text-center py-12">
          <Receipt className="w-8 h-8 text-muted mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-primary">No transactions found</h3>
          <p className="text-xs text-muted mt-1">
            Import a bank statement to populate your ledger.
          </p>
        </Card>
      ) : (
        <div className="space-y-2.5">
          {items.map((tx) => (
            <div
              key={tx.id}
              className={`p-3.5 bg-surface border rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                tx.isExcludedFromDetection ? 'opacity-60 border-dashed border-border' : 'border-border'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-surface-subtle border border-border flex items-center justify-center font-bold text-xs text-primary shrink-0">
                  {tx.merchantNormalized.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {tx.merchantNormalized}
                    </span>
                    <Badge variant={tx.direction === 'DEBIT' ? 'neutral' : 'success'}>
                      {tx.direction}
                    </Badge>
                    {tx.isExcludedFromDetection && (
                      <Badge variant="risk">Excluded From Detection</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5 truncate max-w-md">
                    {tx.transactionDate} • {tx.descriptionOriginal}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-border">
                <span
                  className={`font-mono text-sm font-semibold tabular-nums ${
                    tx.direction === 'DEBIT' ? 'text-primary' : 'text-status-verified'
                  }`}
                >
                  {tx.direction === 'DEBIT' ? '-' : '+'}
                  {formatCurrency(tx.amountMinor, tx.currency)}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleExclude(tx.id)}
                  title={
                    tx.isExcludedFromDetection
                      ? 'Re-include in recurrence engine scan'
                      : 'Exclude this one-off charge from pattern detection'
                  }
                >
                  {tx.isExcludedFromDetection ? (
                    <span className="text-status-verified">Include</span>
                  ) : (
                    <span className="text-muted">Exclude</span>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
