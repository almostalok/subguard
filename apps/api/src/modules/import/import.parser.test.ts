import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { parse as csvParseSync } from 'csv-parse/sync';
import {
  toMinorUnits,
  generateTransactionFingerprint,
  normalizeMerchant,
} from '@subguard/utils';

describe('CSV Ingestion and Transaction Normalization', () => {
  const sampleBankCsv = `Txn Date,Narration,Withdrawal Amt,Deposit Amt,Balance
10/08/2026,UPI-NETFLIX-992381283@okhdfcbank,649.00,,45210.50
11/09/2026,UPI-NETFLIX-992381283@okhdfcbank,649.00,,44561.50
12/10/2026,UPI-NETFLIX-992381283@okhdfcbank,649.00,,43912.50
15/10/2026,SALARY CREDIT BY TECH CORP,,85000.00,128912.50
18/10/2026,BIL/AIRTEL BROADBAND/202610189912,1178.82,,127733.68`;

  test('parses CSV records safely without code execution', () => {
    const records = csvParseSync(sampleBankCsv, {
      skip_empty_lines: true,
      trim: true,
    });

    assert.strictEqual(records.length, 6); // 1 header + 5 rows
    const header = records[0];
    assert.strictEqual(header[0], 'Txn Date');
    assert.strictEqual(header[1], 'Narration');
    assert.strictEqual(header[2], 'Withdrawal Amt');
  });

  test('converts withdrawal amounts to positive integer minor units (paise)', () => {
    assert.strictEqual(toMinorUnits('649.00'), 64900);
    assert.strictEqual(toMinorUnits('1178.82'), 117882);
    assert.strictEqual(toMinorUnits('85000.00'), 8500000);
  });

  test('normalizes raw transaction narrations into clean merchant keys', () => {
    const res1 = normalizeMerchant('UPI-NETFLIX-992381283@okhdfcbank');
    assert.strictEqual(res1.normalized, 'Netflix');
    assert.strictEqual(res1.merchantKey, 'netflix');

    const res2 = normalizeMerchant('BIL/AIRTEL BROADBAND/202610189912');
    assert.ok(res2.normalized.toLowerCase().includes('airtel broadband'));
  });

  test('generates deterministic SHA-256 fingerprints to eliminate duplicate rows', () => {
    const fp1 = generateTransactionFingerprint(
      'user-1',
      '2026-08-10',
      64900,
      'UPI-NETFLIX-992381283@okhdfcbank'
    );
    const fp2 = generateTransactionFingerprint(
      'user-1',
      '2026-08-10',
      64900,
      'UPI-NETFLIX-992381283@okhdfcbank'
    );
    const fpDiffUser = generateTransactionFingerprint(
      'user-2',
      '2026-08-10',
      64900,
      'UPI-NETFLIX-992381283@okhdfcbank'
    );

    assert.strictEqual(fp1, fp2, 'Identical transactions produce identical fingerprints');
    assert.notStrictEqual(fp1, fpDiffUser, 'Different users have isolated fingerprints');
  });
});
