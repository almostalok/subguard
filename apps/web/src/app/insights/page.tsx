'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api-client';
import { FinancialSummaryDto, CategoryBreakdownDto } from '@subguard/types';
import { Card, StatCard, Badge } from '@subguard/ui';
import { formatCurrency } from '@subguard/utils';
import { PieChart, TrendingUp, AlertCircle, CheckCircle, Scale } from 'lucide-react';

export default function InsightsPage() {
  const [summary, setSummary] = useState<FinancialSummaryDto | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdownDto[]>([]);
  const [reconciliation, setReconciliation] = useState<
    Array<{
      commitmentId: string;
      name: string;
      merchant: string;
      expectedAmountMinor: number;
      lastDebitedAmountMinor: number | null;
      differenceMinor: number;
      hasPriceDiscrepancy: boolean;
      lastDebitedDate: string | null;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [sum, cats, recon] = await Promise.all([
          api.getSummary(),
          api.getCategories(),
          api.getReconciliation(),
        ]);
        setSummary(sum);
        setCategories(cats);
        setReconciliation(recon);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
              Financial Insights & Reconciliation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Audit actual statement deductions against scheduled expected commitments.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-surface border border-border rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-surface border border-border rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Metrics */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                label="Monthly Equivalent Spend"
                amountMinor={summary.monthlyCommitmentMinor}
                currency={summary.currency}
                description="Exact integer calculation from active cadences"
              />
              <StatCard
                label="Annualized Commitment"
                amountMinor={summary.annualCommitmentMinor}
                currency={summary.currency}
                description="Full 12-month projected total"
              />
              <StatCard
                label="Statement Debits (30 Days)"
                amountMinor={summary.totalRecordedSpendPast30DaysMinor}
                currency={summary.currency}
                description="Total debited across all imported statements"
              />
            </div>
          )}

          {/* Actual vs Expected Reconciliation */}
          <Card padding="md">
            <div className="flex items-center gap-2 pb-3 border-b border-border mb-4">
              <Scale className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-sm font-semibold text-primary">
                  Price Hike & Billing Reconciliation
                </h2>
                <p className="text-xs text-muted">
                  Compares your expected subscription fee against the actual amount debited in your statement.
                </p>
              </div>
            </div>

            {reconciliation.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">
                No active commitments to reconcile.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {reconciliation.map((item) => (
                  <div
                    key={item.commitmentId}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">{item.name}</span>
                        {item.hasPriceDiscrepancy ? (
                          <Badge variant="risk">Price Discrepancy</Badge>
                        ) : item.lastDebitedAmountMinor !== null ? (
                          <Badge variant="success">Reconciled</Badge>
                        ) : (
                          <Badge variant="neutral">Awaiting Debit</Badge>
                        )}
                      </div>
                      <p className="text-muted mt-0.5">
                        Merchant: {item.merchant}
                        {item.lastDebitedDate && ` • Last debited on ${item.lastDebitedDate}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div>
                        <span className="text-muted block text-[11px]">Expected</span>
                        <span className="font-mono font-semibold text-primary">
                          {formatCurrency(item.expectedAmountMinor, 'INR')}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted block text-[11px]">Actual Debited</span>
                        <span className="font-mono font-semibold text-primary">
                          {item.lastDebitedAmountMinor !== null
                            ? formatCurrency(item.lastDebitedAmountMinor, 'INR')
                            : 'No record'}
                        </span>
                      </div>

                      {item.hasPriceDiscrepancy && (
                        <div>
                          <span className="text-status-risk block text-[11px]">Delta</span>
                          <span className="font-mono font-bold text-status-risk">
                            {item.differenceMinor > 0 ? '+' : ''}
                            {formatCurrency(item.differenceMinor, 'INR')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Category Distribution */}
          <Card padding="md">
            <h2 className="text-sm font-semibold text-primary pb-3 border-b border-border mb-4">
              Category Distribution
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.category}
                  className="p-3.5 bg-surface-subtle border border-border rounded-xl space-y-2"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-primary capitalize">
                      {cat.category.toLowerCase().replace('_', ' ')}
                    </span>
                    <span className="font-mono font-semibold tabular-nums text-primary">
                      {formatCurrency(cat.monthlyEquivalentMinor, 'INR')}/mo
                    </span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${cat.percentageOfTotal}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-muted">
                    <span>{cat.commitmentCount} service(s)</span>
                    <span>{cat.percentageOfTotal}% of total spend</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
