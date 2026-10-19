'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api-client';
import {
  FinancialSummaryDto,
  CategoryBreakdownDto,
  RadarItemDto,
  CommitmentDto,
  TransactionDto,
} from '@subguard/types';
import {
  StatCard,
  Card,
  Button,
  Badge,
  EvidenceBadge,
} from '@subguard/ui';
import { formatCurrency } from '@subguard/utils';
import {
  Radar,
  CreditCard,
  Upload,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<FinancialSummaryDto | null>(null);
  const [categories, setCategories] = useState<CategoryBreakdownDto[]>([]);
  const [radarItems, setRadarItems] = useState<RadarItemDto[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<TransactionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const [sum, cats, radar, txs] = await Promise.all([
          api.getSummary(),
          api.getCategories(),
          api.getRadarForecast(14), // Next 14 days lookahead
          api.getTransactions({ limit: 5 }),
        ]);
        setSummary(sum);
        setCategories(cats);
        setRadarItems(radar);
        setRecentTransactions(txs.items);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <AppShell>
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
            Deduction Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted">
            Know what can charge you. Before it does.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/subscriptions?action=new">
            <Button variant="primary" size="sm">
              <span className="font-semibold">+ Add Commitment</span>
            </Button>
          </Link>
          <Link href="/import">
            <Button variant="secondary" size="sm">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              <span>Import CSV</span>
            </Button>
          </Link>
          <Link href="/detection">
            <Button variant="secondary" size="sm">
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-status-warning" />
              <span>Detect</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-6 bg-status-risk-bg border border-status-risk-border rounded-xl text-sm text-status-risk flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-surface border border-border rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-surface border border-border rounded-xl" />
        </div>
      )}

      {!isLoading && summary && (
        <div className="space-y-6">
          {/* Top KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Monthly Commitment"
              amountMinor={summary.monthlyCommitmentMinor}
              currency={summary.currency}
              description={`Standardized across ${summary.activeCommitmentsCount} active recurring services`}
            />

            <StatCard
              label="Annualized Spend"
              amountMinor={summary.annualCommitmentMinor}
              currency={summary.currency}
              description="Projected 12-month commitment"
            />

            <StatCard
              label="Upcoming in 7 Days"
              amountMinor={summary.next7DaysMinor}
              currency={summary.currency}
              description="Immediate cash outflow scheduled"
              badge={
                summary.next7DaysMinor > 0 ? (
                  <Badge variant="warning">Action window</Badge>
                ) : undefined
              }
            />

            <StatCard
              label="Requires Attention"
              value={summary.itemsRequiringReviewCount}
              description="Trials ending or candidates pending review"
              badge={
                summary.itemsRequiringReviewCount > 0 ? (
                  <Badge variant="risk">Needs Review</Badge>
                ) : (
                  <Badge variant="success">All Clear</Badge>
                )
              }
            />
          </div>

          {/* Radar Lookahead Widget */}
          <Card padding="md">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Radar className="w-5 h-5 text-primary" />
                <h2 className="text-base font-semibold text-primary">
                  Deduction Radar — Next 14 Days
                </h2>
              </div>
              <Link
                href="/radar"
                className="text-xs font-medium text-primary hover:text-muted flex items-center gap-1"
              >
                <span>View Full Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {radarItems.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-primary">No debits scheduled in the next 14 days</p>
                <p className="text-xs text-muted mt-1">
                  Add subscriptions or import your bank statement to populate your radar.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border mt-2">
                {radarItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-subtle flex items-center justify-center font-bold text-xs text-primary shrink-0">
                        {item.merchant.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {item.title}
                          </span>
                          <EvidenceBadge level={item.evidenceLevel} />
                        </div>
                        <p className="text-xs text-muted">
                          Expected on {item.dueDate} via {item.paymentMethodLabel || 'Registered account'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-mono font-semibold tabular-nums text-primary">
                        {formatCurrency(item.amountMinor, item.currency)}
                      </span>
                      <span className="block text-[11px] text-muted capitalize">
                        {item.cadence.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Two-column layout: Spending by Category & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <Card padding="md">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="text-sm font-semibold text-primary">
                  Commitment by Category
                </h3>
                <Link
                  href="/insights"
                  className="text-xs text-muted hover:text-primary flex items-center gap-1"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {categories.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted">
                  No active categories recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat.category} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-primary capitalize">
                          {cat.category.toLowerCase().replace('_', ' ')}
                        </span>
                        <span className="font-mono tabular-nums text-muted">
                          {formatCurrency(cat.monthlyEquivalentMinor, 'INR')}/mo ({cat.percentageOfTotal}%)
                        </span>
                      </div>
                      <div className="w-full bg-surface-subtle rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${cat.percentageOfTotal}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Actual Transactions */}
            <Card padding="md">
              <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
                <h3 className="text-sm font-semibold text-primary">
                  Recent Statement Ingestions
                </h3>
                <Link
                  href="/transactions"
                  className="text-xs text-muted hover:text-primary flex items-center gap-1"
                >
                  <span>All Transactions</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-xs text-muted">No transactions imported yet.</p>
                  <Link href="/import" className="inline-block mt-2">
                    <Button variant="outline" size="sm">
                      Upload Bank Statement
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-3">
                        <p className="font-medium text-primary truncate">
                          {tx.merchantNormalized}
                        </p>
                        <p className="text-[11px] text-muted truncate">
                          {tx.transactionDate} • {tx.descriptionOriginal}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono font-semibold tabular-nums ${
                            tx.direction === 'DEBIT' ? 'text-primary' : 'text-status-verified'
                          }`}
                        >
                          {tx.direction === 'DEBIT' ? '-' : '+'}
                          {formatCurrency(tx.amountMinor, tx.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
