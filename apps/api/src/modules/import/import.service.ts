import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { parse as csvParseSync } from 'csv-parse/sync';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CommitImportInput } from '@subguard/validation';
import {
  toMinorUnits,
  normalizeMerchant,
  generateTransactionFingerprint,
} from '@subguard/utils';
import {
  ImportStatus,
  TransactionDirection,
  CsvPreviewResult,
  ImportCommitResult,
} from '@subguard/types';

@Injectable()
export class ImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Previews an uploaded CSV string: validates structure, identifies headers,
   * infers column mappings, and returns the first 10 rows.
   */
  preview(rawCsvText: string): CsvPreviewResult {
    if (!rawCsvText || !rawCsvText.trim()) {
      throw new BadRequestException('CSV content is empty');
    }

    let records: string[][];
    try {
      records = csvParseSync(rawCsvText, {
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (err: unknown) {
      throw new BadRequestException(
        `Failed to parse CSV format: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (records.length < 2) {
      throw new BadRequestException('CSV file must have a header row and at least one data row');
    }

    const headers = records[0].map((h) => h.trim());
    const dataRows = records.slice(1);

    if (dataRows.length > 5000) {
      throw new BadRequestException('CSV exceeds maximum allowed limit of 5,000 rows');
    }

    const fileHash = crypto.createHash('sha256').update(rawCsvText).digest('hex');

    // Auto-detect column headers based on Indian bank formats (HDFC, ICICI, SBI, Axis, etc.)
    const detectedMapping: CsvPreviewResult['detectedMapping'] = {};

    headers.forEach((header) => {
      const lower = header.toLowerCase();
      if (!detectedMapping.dateColumn && (lower.includes('date') || lower === 'txn date' || lower === 'value date')) {
        detectedMapping.dateColumn = header;
      }
      if (!detectedMapping.descriptionColumn && (lower.includes('narration') || lower.includes('description') || lower.includes('particular') || lower.includes('remarks'))) {
        detectedMapping.descriptionColumn = header;
      }
      if (!detectedMapping.debitColumn && (lower.includes('withdrawal') || lower.includes('debit amt') || lower === 'debit' || lower === 'dr amount')) {
        detectedMapping.debitColumn = header;
      }
      if (!detectedMapping.creditColumn && (lower.includes('deposit') || lower.includes('credit amt') || lower === 'credit' || lower === 'cr amount')) {
        detectedMapping.creditColumn = header;
      }
      if (!detectedMapping.amountColumn && (lower === 'amount' || lower === 'transaction amount' || lower === 'txn amount')) {
        detectedMapping.amountColumn = header;
      }
      if (!detectedMapping.typeColumn && (lower === 'type' || lower === 'cr/dr' || lower === 'dr/cr' || lower === 'transaction type')) {
        detectedMapping.typeColumn = header;
      }
    });

    // Preview top 10 rows as key-value objects
    const previewRows = dataRows.slice(0, 10).map((row) => {
      const rowObj: Record<string, string> = {};
      headers.forEach((header, idx) => {
        rowObj[header] = row[idx] || '';
      });
      return rowObj;
    });

    return {
      headers,
      previewRows,
      totalRows: dataRows.length,
      detectedMapping,
      fileHash,
    };
  }

  /**
   * Commits the parsed CSV rows into PostgreSQL inside an atomic Prisma transaction.
   * Enforces row validation, date formatting, integer minor conversions, and fingerprint deduplication.
   */
  async commit(userId: string, input: CommitImportInput): Promise<ImportCommitResult> {
    let records: string[][];
    try {
      records = csvParseSync(input.rawCsvText, {
        skip_empty_lines: true,
        trim: true,
        relax_column_count: true,
      });
    } catch (err: unknown) {
      throw new BadRequestException(`Failed to parse CSV: ${err instanceof Error ? err.message : String(err)}`);
    }

    if (records.length < 2) {
      throw new BadRequestException('CSV file must have at least one data row');
    }

    const headers = records[0].map((h) => h.trim());
    const dataRows = records.slice(1);

    const dateIdx = headers.indexOf(input.columnMapping.dateColumn);
    const descIdx = headers.indexOf(input.columnMapping.descriptionColumn);
    const debitIdx = input.columnMapping.debitColumn ? headers.indexOf(input.columnMapping.debitColumn) : -1;
    const creditIdx = input.columnMapping.creditColumn ? headers.indexOf(input.columnMapping.creditColumn) : -1;
    const amountIdx = input.columnMapping.amountColumn ? headers.indexOf(input.columnMapping.amountColumn) : -1;
    const typeIdx = input.columnMapping.typeColumn ? headers.indexOf(input.columnMapping.typeColumn) : -1;

    if (dateIdx === -1 || descIdx === -1) {
      throw new BadRequestException('Required Date or Description column not found in CSV headers');
    }

    // Fetch existing fingerprints for this user to check duplicates efficiently
    const existingTransactions = await this.prisma.transaction.findMany({
      where: { userId },
      select: { fingerprint: true },
    });
    const existingFingerprints = new Set(existingTransactions.map((t) => t.fingerprint));

    const validRowsToInsert: Array<{
      userId: string;
      accountId: string | null;
      transactionDate: Date;
      descriptionOriginal: string;
      merchantNormalized: string;
      merchantKey: string;
      amountMinor: bigint;
      currency: string;
      direction: TransactionDirection;
      fingerprint: string;
    }> = [];

    const errors: Array<{ row: number; reason: string }> = [];
    let duplicateCount = 0;

    dataRows.forEach((row, index) => {
      const rowNum = index + 2; // 1-indexed including header
      const rawDate = row[dateIdx]?.trim();
      const rawDesc = row[descIdx]?.trim();

      if (!rawDate || !rawDesc) {
        errors.push({ row: rowNum, reason: 'Empty date or description' });
        return;
      }

      // Parse normalized date
      const parsedDate = this.parseFlexibleDate(rawDate);
      if (!parsedDate) {
        errors.push({ row: rowNum, reason: `Unrecognized date format: ${rawDate}` });
        return;
      }

      // Determine amount and direction
      let rawAmountStr = '';
      let direction: TransactionDirection = TransactionDirection.DEBIT;

      if (debitIdx !== -1 && row[debitIdx]?.trim()) {
        rawAmountStr = row[debitIdx].trim();
        direction = TransactionDirection.DEBIT;
      } else if (creditIdx !== -1 && row[creditIdx]?.trim()) {
        rawAmountStr = row[creditIdx].trim();
        direction = TransactionDirection.CREDIT;
      } else if (amountIdx !== -1 && row[amountIdx]?.trim()) {
        rawAmountStr = row[amountIdx].trim();
        if (typeIdx !== -1) {
          const typeVal = row[typeIdx].trim().toLowerCase();
          if (typeVal.includes('cr') || typeVal === 'credit') {
            direction = TransactionDirection.CREDIT;
          }
        } else if (rawAmountStr.startsWith('+')) {
          direction = TransactionDirection.CREDIT;
        } else if (rawAmountStr.startsWith('-')) {
          direction = TransactionDirection.DEBIT;
        }
      }

      const amountMinorNum = Math.abs(toMinorUnits(rawAmountStr));
      if (!amountMinorNum || amountMinorNum <= 0) {
        // Zero amount row or balance row, skip
        return;
      }

      const isoDate = parsedDate.toISOString().slice(0, 10);
      const fingerprint = generateTransactionFingerprint(
        userId,
        isoDate,
        amountMinorNum,
        rawDesc,
        input.accountId
      );

      if (existingFingerprints.has(fingerprint)) {
        duplicateCount++;
        return; // Deduplicated
      }

      const { normalized, merchantKey } = normalizeMerchant(rawDesc);

      // Add to set so same CSV file duplicates are also caught
      existingFingerprints.add(fingerprint);

      validRowsToInsert.push({
        userId,
        accountId: input.accountId || null,
        transactionDate: parsedDate,
        descriptionOriginal: rawDesc,
        merchantNormalized: normalized,
        merchantKey,
        amountMinor: BigInt(amountMinorNum),
        currency: 'INR',
        direction,
        fingerprint,
      });
    });

    // Execute atomic transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const importRecord = await tx.transactionImport.create({
        data: {
          userId,
          filename: input.filename,
          fileHash: input.fileHash,
          status: ImportStatus.COMMITTED,
          rowCount: dataRows.length,
          validRowCount: validRowsToInsert.length,
          duplicateRowCount: duplicateCount,
          errorSummary: errors.length > 0 ? { errors: errors.slice(0, 50) } : undefined,
          columnMapping: input.columnMapping,
        },
      });

      if (validRowsToInsert.length > 0) {
        await tx.transaction.createMany({
          data: validRowsToInsert.map((t) => ({
            ...t,
            importId: importRecord.id,
          })),
        });
      }

      await tx.auditEvent.create({
        data: {
          userId,
          action: 'IMPORT_COMMITTED',
          entityType: 'TransactionImport',
          entityId: importRecord.id,
          metadata: {
            filename: input.filename,
            validRows: validRowsToInsert.length,
            duplicates: duplicateCount,
          },
        },
      });

      return importRecord;
    });

    return {
      importId: result.id,
      totalRows: dataRows.length,
      validRowCount: validRowsToInsert.length,
      duplicateRowCount: duplicateCount,
      invalidRowCount: errors.length,
      errors,
    };
  }

  async listImports(userId: string) {
    const imports = await this.prisma.transactionImport.findMany({
      where: { userId },
      orderBy: { importedAt: 'desc' },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return imports.map((i) => ({
      ...i,
      importedAt: i.importedAt.toISOString(),
    }));
  }

  async rollbackImport(userId: string, importId: string) {
    const existing = await this.prisma.transactionImport.findFirst({
      where: { id: importId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Import not found');
    }

    await this.prisma.$transaction(async (tx) => {
      // Deletes import and cascades delete to all transactions created by this import
      await tx.transactionImport.delete({
        where: { id: importId },
      });

      await tx.auditEvent.create({
        data: {
          userId,
          action: 'IMPORT_ROLLED_BACK',
          entityType: 'TransactionImport',
          entityId: importId,
          metadata: { filename: existing.filename },
        },
      });
    });

    return { success: true, message: `Import ${existing.filename} and associated transactions rolled back` };
  }

  /**
   * Helper parsing multiple Indian & ISO date formats:
   * YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, DD-MMM-YYYY
   */
  private parseFlexibleDate(dateStr: string): Date | null {
    const clean = dateStr.trim();

    // ISO: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      const [y, m, d] = clean.slice(0, 10).split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d));
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10);
      const year = parseInt(dmyMatch[3], 10);
      return new Date(Date.UTC(year, month - 1, day));
    }

    const fallback = new Date(clean);
    return isNaN(fallback.getTime()) ? null : fallback;
  }
}
