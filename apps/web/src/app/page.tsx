'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api-client';
import {
  FinancialSummaryDto,
  CategoryBreakdownDto,
  RadarItemDto,
  TransactionDto,
} from '@subguard/types';
import {
  Badge,
  EvidenceBadge,
  Button,
} from '@subguard/ui';
import { formatCurrency } from '@subguard/utils';
import {
  Radar,
  CreditCard,
  Upload,
  ScanLine,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Activity,
  AlertCircle,
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
          api.getRadarForecast(14),
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
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Overview
            </h1>
            <span className="px-2 py-0.5 rounded-sm bg-[#111111] border border-[#27272A] text-[10px] font-mono text-zinc-400">
              AUDIT READY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#888888] font-sans">
            Continuous recurring payment monitoring & deduction radar for India.
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
              <ScanLine className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
              <span>Detect</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 mb-6 bg-red-950/40 border border-red-800/40 rounded-lg text-sm text-red-300 flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading && (
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#222222] divide-y sm:divide-y-0 sm:divide-x divide-[#222222] bg-[#0A0A0A] rounded-lg overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 p-5 bg-[#0A0A0A]" />
            ))}
          </div>
          <div className="h-64 bg-[#0A0A0A] border border-[#222222] rounded-lg" />
        </div>
      )}

      {!isLoading && summary && (
        <div className="space-y-6">
          {/* Top KPI Grid (Vercel Interlocking Border Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border border-[#222222] divide-y sm:divide-y-0 sm:divide-x divide-[#222222] bg-[#0A0A0A] rounded-lg overflow-hidden shadow-xs">
            {/* KPI 1 */}
            <div className="p-5 flex flex-col justify-between hover:bg-[#111111]/50 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono tracking-wider text-[#888888] uppercase">
                  Monthly Commitment
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  {summary.activeCommitmentsCount} active
                </span>
              </div>
              <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
                {formatCurrency(summary.monthlyCommitmentMinor, summary.currency)}
              </div>
              <p className="mt-2.5 text-xs text-[#888888]">
                Standardized across recurring services
              </p>
            </div>

            {/* KPI 2 */}
            <div className="p-5 flex flex-col justify-between hover:bg-[#111111]/50 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono tracking-wider text-[#888888] uppercase">
                  Annualized Spend
                </span>
                <span className="text-[10px] font-mono text-zinc-500">
                  RUN-RATE
                </span>
              </div>
              <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
                {formatCurrency(summary.annualCommitmentMinor, summary.currency)}
              </div>
              <p className="mt-2.5 text-xs text-[#888888]">
                Projected 12-month commitment
              </p>
            </div>

            {/* KPI 3 */}
            <div className="p-5 flex flex-col justify-between hover:bg-[#111111]/50 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono tracking-wider text-[#888888] uppercase">
                  Upcoming in 7 Days
                </span>
                {summary.next7DaysMinor > 0 ? (
                  <Badge variant="warning">Action window</Badge>
                ) : (
                  <Badge variant="neutral">None due</Badge>
                )}
              </div>
              <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
                {formatCurrency(summary.next7DaysMinor, summary.currency)}
              </div>
              <p className="mt-2.5 text-xs text-[#888888]">
                Scheduled immediate debit forecast
              </p>
            </div>

            {/* KPI 4 */}
            <div className="p-5 flex flex-col justify-between hover:bg-[#111111]/50 transition-colors">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono tracking-wider text-[#888888] uppercase">
                  Audit Attention
                </span>
                {summary.itemsRequiringReviewCount > 0 ? (
                  <Badge variant="risk">Needs Review</Badge>
                ) : (
                  <Badge variant="success">All Clear</Badge>
                )}
              </div>
              <div className="text-2xl lg:text-3xl font-semibold tracking-tight text-white font-mono tabular-nums">
                {summary.itemsRequiringReviewCount}
              </div>
              <p className="mt-2.5 text-xs text-[#888888]">
                Trials ending or candidates pending review
              </p>
            </div>
          </div>

          {/* Radar Lookahead Widget */}
          <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#222222] bg-[#0E0E0E]">
              <div className="flex items-center gap-2.5">
                <Radar className="w-4 h-4 text-white" />
                <h2 className="text-sm font-semibold text-white tracking-tight">
                  Deduction Radar — Next 14 Days
                </h2>
                <span className="text-[10px] font-mono text-zinc-500 bg-[#161616] px-2 py-0.5 rounded border border-zinc-800">
                  {radarItems.length} SCHEDULED
                </span>
              </div>
              <Link
                href="/radar"
                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>timeline</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {radarItems.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm font-medium text-white">No debits scheduled in the next 14 days</p>
                <p className="text-xs text-[#888888] mt-1 font-sans">
                  Add subscriptions or import your bank statement to populate your radar.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#1F1F1F]">
                {radarItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#111111] transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-[#161616] border border-[#27272A] flex items-center justify-center font-mono font-bold text-xs text-white shrink-0">
                        {item.merchant.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">
                            {item.title}
                          </span>
                          <EvidenceBadge level={item.evidenceLevel} />
                        </div>
                        <p className="text-xs text-[#888888] font-mono mt-0.5">
                          Due {item.dueDate} • {item.paymentMethodLabel || 'Registered mandate'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-mono font-semibold tabular-nums text-white">
                        {formatCurrency(item.amountMinor, item.currency)}
                      </span>
                      <span className="block text-[10px] font-mono text-[#888888] uppercase">
                        {item.cadence.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Two-column layout: Spending by Category & Recent Transactions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#0E0E0E]">
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-zinc-400" />
                  <h3 className="text-xs font-semibold text-white tracking-tight uppercase font-mono">
                    Commitment by Category
                  </h3>
                </div>
                <Link
                  href="/insights"
                  className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>breakdown</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-5">
                {categories.length === 0 ? (
                  <p className="py-6 text-center text-xs text-[#888888]">
                    No active categories recorded yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {categories.map((cat) => (
                      <div key={cat.category} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono">
                          <span className="text-white capitalize">
                            {cat.category.toLowerCase().replace('_', ' ')}
                          </span>
                          <span className="tabular-nums text-[#888888]">
                            {formatCurrency(cat.monthlyEquivalentMinor, 'INR')}/mo ({cat.percentageOfTotal}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#1A1A1A] rounded-full h-1 overflow-hidden">
                          <div
                            className="bg-white h-1 rounded-full transition-all duration-300"
                            style={{ width: `${cat.percentageOfTotal}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Actual Transactions */}
            <div className="bg-[#0A0A0A] border border-[#222222] rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#0E0E0E]">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-zinc-400" />
                  <h3 className="text-xs font-semibold text-white tracking-tight uppercase font-mono">
                    Recent Statement Ingestions
                  </h3>
                </div>
                <Link
                  href="/transactions"
                  className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <span>all records</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="p-2 sm:p-3">
                {recentTransactions.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-xs text-[#888888]">No transactions imported yet.</p>
                    <Link href="/import" className="inline-block mt-3">
                      <Button variant="outline" size="sm">
                        Upload Bank Statement
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1F1F1F]">
                    {recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2.5 flex items-center justify-between text-xs hover:bg-[#111111] rounded-md transition-colors"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="font-medium text-white truncate">
                            {tx.merchantNormalized}
                          </p>
                          <p className="text-[11px] text-[#888888] font-mono truncate">
                            {tx.transactionDate} • {tx.descriptionOriginal}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono font-semibold tabular-nums ${
                              tx.direction === 'DEBIT' ? 'text-white' : 'text-emerald-400'
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
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
