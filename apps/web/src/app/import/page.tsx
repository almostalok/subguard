'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { api } from '@/lib/api-client';
import {
  CsvPreviewResult,
  ImportCommitResult,
  TransactionImportDto,
} from '@subguard/types';
import { Card, Button, Input, Select, Badge } from '@subguard/ui';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
  Sparkles,
  ArrowRight,
  Shield,
} from 'lucide-react';

export default function ImportPage() {
  const [tab, setTab] = useState<'upload' | 'history'>('upload');

  // Step 1: File selection
  const [file, setFile] = useState<File | null>(null);
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [previewData, setPreviewData] = useState<CsvPreviewResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 2: Column mapping
  const [dateCol, setDateCol] = useState('');
  const [descCol, setDescCol] = useState('');
  const [debitCol, setDebitCol] = useState('');
  const [creditCol, setCreditCol] = useState('');
  const [amountCol, setAmountCol] = useState('');

  // Step 3: Commit result
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);

  // History tab
  const [importHistory, setImportHistory] = useState<TransactionImportDto[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const data = await api.getImports();
      setImportHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'history') {
      loadHistory();
    }
  }, [tab]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setCommitResult(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith('.csv')) {
      setErrorMessage('Only CSV statement files are currently supported.');
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 5 MB security threshold.');
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setRawCsvText(text);
      try {
        setIsProcessing(true);
        const preview = await api.previewImport(text);
        setPreviewData(preview);
        setDateCol(preview.detectedMapping.dateColumn || preview.headers[0] || '');
        setDescCol(preview.detectedMapping.descriptionColumn || preview.headers[1] || '');
        setDebitCol(preview.detectedMapping.debitColumn || '');
        setCreditCol(preview.detectedMapping.creditColumn || '');
        setAmountCol(preview.detectedMapping.amountColumn || '');
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to parse CSV');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(selected);
  };

  const handleCommit = async () => {
    if (!previewData || !rawCsvText) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await api.commitImport({
        filename: file?.name || 'statement.csv',
        fileHash: previewData.fileHash,
        columnMapping: {
          dateColumn: dateCol,
          descriptionColumn: descCol,
          debitColumn: debitCol || undefined,
          creditColumn: creditCol || undefined,
          amountColumn: amountCol || undefined,
        },
        rawCsvText,
      });
      setCommitResult(result);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to commit import');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRollback = async (importId: string) => {
    if (!window.confirm('Roll back this import? All transactions from this upload will be removed.')) {
      return;
    }
    try {
      await api.rollbackImport(importId);
      loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const loadSampleHdfcStatement = async () => {
    const sample = `Txn Date,Narration,Withdrawal Amt,Deposit Amt,Balance
10/08/2026,UPI-NETFLIX-992381283@okhdfcbank,649.00,,45210.50
11/09/2026,UPI-NETFLIX-992381283@okhdfcbank,649.00,,44561.50
12/10/2026,UPI-NETFLIX-992381283@okhdfcbank,649.00,,43912.50
15/08/2026,BIL/AIRTEL BROADBAND/202610189912,1178.82,,42733.68
15/09/2026,BIL/AIRTEL BROADBAND/202610189912,1178.82,,41554.86
15/10/2026,BIL/AIRTEL BROADBAND/202610189912,1178.82,,40376.04
20/08/2026,SWIGGY BANGALORE,420.00,,39956.04
02/09/2026,UBER TRIP MUMBAI,340.00,,39616.04`;

    setRawCsvText(sample);
    setFile(new File([sample], 'sample_hdfc_bank_statement.csv', { type: 'text/csv' }));
    setIsProcessing(true);
    try {
      const preview = await api.previewImport(sample);
      setPreviewData(preview);
      setDateCol(preview.detectedMapping.dateColumn || 'Txn Date');
      setDescCol(preview.detectedMapping.descriptionColumn || 'Narration');
      setDebitCol(preview.detectedMapping.debitColumn || 'Withdrawal Amt');
      setCreditCol(preview.detectedMapping.creditColumn || 'Deposit Amt');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Upload className="w-6 h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary">
              Statement Ingestion Engine
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5">
            Upload bank or card statements with intelligent column mapping and duplicate deduplication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={tab === 'upload' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTab('upload')}
          >
            Import Wizard
          </Button>
          <Button
            variant={tab === 'history' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setTab('history')}
          >
            Import History
          </Button>
        </div>
      </div>

      {tab === 'upload' && (
        <div className="space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-status-risk-bg border border-status-risk-border rounded-xl text-xs text-status-risk font-medium flex items-center justify-between">
              <span>{errorMessage}</span>
              <button onClick={() => setErrorMessage(null)}>✕</button>
            </div>
          )}

          {/* Success summary after commit */}
          {commitResult && (
            <Card padding="lg" className="border-status-verified-border bg-status-verified-bg/30">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-6 h-6 text-status-verified" />
                <div>
                  <h3 className="text-base font-semibold text-primary">
                    Statement Successfully Committed!
                  </h3>
                  <p className="text-xs text-muted">
                    Atomic transaction completed. Ready for recurrence pattern scan.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
                <div className="p-3 bg-surface rounded-lg border border-border">
                  <span className="text-[11px] text-muted block">Total Processed</span>
                  <span className="text-lg font-bold text-primary font-mono tabular-nums">
                    {commitResult.totalRows}
                  </span>
                </div>
                <div className="p-3 bg-surface rounded-lg border border-border">
                  <span className="text-[11px] text-muted block">Valid Inserted</span>
                  <span className="text-lg font-bold text-status-verified font-mono tabular-nums">
                    {commitResult.validRowCount}
                  </span>
                </div>
                <div className="p-3 bg-surface rounded-lg border border-border">
                  <span className="text-[11px] text-muted block">Duplicates Skipped</span>
                  <span className="text-lg font-bold text-muted font-mono tabular-nums">
                    {commitResult.duplicateRowCount}
                  </span>
                </div>
                <div className="p-3 bg-surface rounded-lg border border-border">
                  <span className="text-[11px] text-muted block">Invalid Rows</span>
                  <span className="text-lg font-bold text-status-risk font-mono tabular-nums">
                    {commitResult.invalidRowCount}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/detection">
                  <Button variant="primary">
                    <Sparkles className="w-4 h-4 mr-2" />
                    <span>Run Recurrence Detection Now</span>
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCommitResult(null);
                    setPreviewData(null);
                    setFile(null);
                  }}
                >
                  Import Another Statement
                </Button>
              </div>
            </Card>
          )}

          {/* Step 1: Upload Dropzone (if not yet committed) */}
          {!commitResult && !previewData && (
            <Card padding="lg">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors flex flex-col items-center justify-center">
                <FileSpreadsheet className="w-12 h-12 text-muted mb-3" />
                <h3 className="text-base font-semibold text-primary">
                  Choose or drag your bank CSV statement
                </h3>
                <p className="text-xs text-muted mt-1 max-w-md">
                  Supports HDFC, ICICI, SBI, Axis, Kotak, and generic statement exports. Enforces 5 MB and 5,000 row limits.
                </p>

                <label className="mt-4 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-white hover:bg-primary-hover cursor-pointer shadow-xs min-h-[44px]">
                  <span>Browse CSV File</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                <div className="mt-6 pt-4 border-t border-border w-full flex flex-col sm:flex-row items-center justify-center gap-3">
                  <span className="text-xs text-muted">Want to test with realistic Indian bank records?</span>
                  <button
                    type="button"
                    onClick={loadSampleHdfcStatement}
                    className="text-xs font-semibold text-primary hover:underline min-h-[44px] flex items-center"
                  >
                    Load Sample HDFC Statement (3 Months)
                  </button>
                </div>
              </div>
            </Card>
          )}

          {/* Step 2: Mapping & Preview */}
          {!commitResult && previewData && (
            <div className="space-y-6">
              {/* Column Mapping Card */}
              <Card padding="md">
                <h3 className="text-sm font-semibold text-primary mb-1">
                  Step 2: Verify Column Mapping
                </h3>
                <p className="text-xs text-muted mb-4">
                  Confirm the columns corresponding to Transaction Date, Narration/Description, and Amounts.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-primary block mb-1">
                      Date Column *
                    </label>
                    <select
                      value={dateCol}
                      onChange={(e) => setDateCol(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg min-h-[44px]"
                    >
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-primary block mb-1">
                      Description / Narration *
                    </label>
                    <select
                      value={descCol}
                      onChange={(e) => setDescCol(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg min-h-[44px]"
                    >
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-primary block mb-1">
                      Debit / Withdrawal Column
                    </label>
                    <select
                      value={debitCol}
                      onChange={(e) => setDebitCol(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg min-h-[44px]"
                    >
                      <option value="">-- None / Single Amount --</option>
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-primary block mb-1">
                      Credit / Deposit Column
                    </label>
                    <select
                      value={creditCol}
                      onChange={(e) => setCreditCol(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-surface border border-border rounded-lg min-h-[44px]"
                    >
                      <option value="">-- None --</option>
                      {previewData.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              {/* Data Preview Card */}
              <Card padding="md">
                <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
                  <h3 className="text-sm font-semibold text-primary">
                    Pre-Commit Preview (Showing first {previewData.previewRows.length} of {previewData.totalRows} rows)
                  </h3>
                  <Badge variant="neutral">SHA-256 Fingerprinted</Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-surface-subtle">
                        {previewData.headers.map((header) => (
                          <th key={header} className="p-2.5 font-semibold text-primary">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {previewData.previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-surface-subtle">
                          {previewData.headers.map((header) => (
                            <td key={header} className="p-2.5 text-muted truncate max-w-xs">
                              {row[header] || '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewData(null);
                      setFile(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    isLoading={isProcessing}
                    onClick={handleCommit}
                  >
                    Commit {previewData.totalRows} Transactions
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Tab: Import History */}
      {tab === 'history' && (
        <div className="space-y-4">
          {historyLoading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-surface border border-border rounded-xl" />
              ))}
            </div>
          ) : importHistory.length === 0 ? (
            <Card padding="lg" className="text-center py-12">
              <FileSpreadsheet className="w-8 h-8 text-muted mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-primary">No statement imports on record</h3>
              <p className="text-xs text-muted mt-1">
                Uploaded files and their atomic commit status will appear here.
              </p>
            </Card>
          ) : (
            importHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-surface border border-border rounded-xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      {item.filename}
                    </span>
                    <Badge variant="success">{item.status}</Badge>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Imported on {item.importedAt.slice(0, 10)} • {item.validRowCount} valid rows committed • {item.duplicateRowCount} duplicates prevented
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRollback(item.id)}
                  title="Remove this import and all its transactions"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1 text-status-risk" />
                  <span className="text-status-risk">Rollback</span>
                </Button>
              </div>
            ))
          )}
        </div>
      )}
    </AppShell>
  );
}
