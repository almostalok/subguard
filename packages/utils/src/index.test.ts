import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import {
  toMinorUnits,
  toMajorUnits,
  formatCurrency,
  toMonthlyMinor,
  toAnnualMinor,
  normalizeMerchant,
  escapeCsvCell,
  getNextDueDate,
  daysBetween,
} from './index.js';
import { Cadence } from '@subguard/types';

describe('Monetary Arithmetic', () => {
  test('converts decimal amounts to minor units without floating point loss', () => {
    assert.strictEqual(toMinorUnits(499.5), 49950);
    assert.strictEqual(toMinorUnits('499.50'), 49950);
    assert.strictEqual(toMinorUnits('1,249.99'), 124999);
    assert.strictEqual(toMinorUnits(0), 0);
    assert.strictEqual(toMinorUnits(649), 64900);
  });

  test('converts minor units back to major units', () => {
    assert.strictEqual(toMajorUnits(49950), 499.5);
    assert.strictEqual(toMajorUnits(64900), 649);
  });

  test('formats INR currency with proper symbols and commas', () => {
    const formatted = formatCurrency(12345678, 'INR');
    assert.ok(formatted.includes('1,23,456.78') || formatted.includes('123,456.78'));
  });

  test('calculates exact monthly-equivalent spend for all cadences', () => {
    // Monthly 649 stays 64900
    assert.strictEqual(toMonthlyMinor(64900, Cadence.MONTHLY), 64900);
    // Annual 1200000 (₹12,000) becomes 100000 (₹1,000)
    assert.strictEqual(toMonthlyMinor(1200000, Cadence.ANNUALLY), 100000);
    // Quarterly 300000 becomes 100000
    assert.strictEqual(toMonthlyMinor(300000, Cadence.QUARTERLY), 100000);
    // Weekly 10000 (₹100) -> 100 * 52 / 12 = 433.33 -> 43333 paise
    assert.strictEqual(toMonthlyMinor(10000, Cadence.WEEKLY), 43333);
  });

  test('calculates exact annualized recurring spend', () => {
    assert.strictEqual(toAnnualMinor(50000, Cadence.MONTHLY), 600000); // ₹500 * 12 = ₹6,000
    assert.strictEqual(toAnnualMinor(1200000, Cadence.ANNUALLY), 1200000);
    assert.strictEqual(toAnnualMinor(25000, Cadence.QUARTERLY), 100000); // ₹250 * 4 = ₹1,000
  });
});

describe('Merchant Normalization', () => {
  test('strips UPI prefixes and bank handles', () => {
    const res1 = normalizeMerchant('UPI-NETFLIX-992381283@okhdfcbank');
    assert.strictEqual(res1.normalized, 'Netflix');
    assert.strictEqual(res1.merchantKey, 'netflix');

    const res2 = normalizeMerchant('BIL/SPOTIFY INDIA/2026101912345/MUMBAI');
    assert.ok(res2.normalized.toLowerCase().includes('spotify'));
    assert.strictEqual(res2.merchantKey, 'spotify-india-mumbai');
  });
});

describe('CSV Security (Formula Injection)', () => {
  test('escapes potentially dangerous formula triggers', () => {
    assert.strictEqual(escapeCsvCell('=CMD|1'), "'=CMD|1");
    assert.strictEqual(escapeCsvCell('+SUM(A1:A10)'), "'+SUM(A1:A10)");
    assert.strictEqual(escapeCsvCell('@harmful'), "'@harmful");
    assert.strictEqual(escapeCsvCell('Safe Text'), 'Safe Text');
  });
});

describe('Date Utilities', () => {
  test('advances next due date accurately across month and leap boundaries', () => {
    assert.strictEqual(getNextDueDate('2026-01-15', Cadence.MONTHLY), '2026-02-15');
    assert.strictEqual(getNextDueDate('2026-01-15', Cadence.ANNUALLY), '2027-01-15');
    assert.strictEqual(getNextDueDate('2026-01-15', Cadence.WEEKLY), '2026-01-22');
  });

  test('calculates days between two ISO dates', () => {
    assert.strictEqual(daysBetween('2026-10-01', '2026-10-15'), 14);
  });
});
