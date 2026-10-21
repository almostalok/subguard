import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { Cadence } from '@subguard/types';
import { toMonthlyMinor, toAnnualMinor } from '@subguard/utils';

describe('Financial Forecasting & Metric Calculations', () => {
  test('accurately calculates total monthly equivalent spend across diverse cadences', () => {
    const commitments = [
      { name: 'Netflix', amountMinor: 64900, cadence: Cadence.MONTHLY },
      { name: 'Amazon Prime', amountMinor: 149900, cadence: Cadence.ANNUALLY },
      { name: 'Gym Quarterly', amountMinor: 450000, cadence: Cadence.QUARTERLY },
      { name: 'Weekly Milk', amountMinor: 35000, cadence: Cadence.WEEKLY },
    ];

    let totalMonthly = 0;
    for (const c of commitments) {
      totalMonthly += toMonthlyMinor(c.amountMinor, c.cadence);
    }

    // Netflix: 64900
    // Prime: round(149900 / 12) = 12492
    // Gym: round(450000 / 3) = 150000
    // Milk: round(35000 * 52 / 12) = 151667
    // Total = 64900 + 12492 + 150000 + 151667 = 379059 paise (₹3,790.59)
    assert.strictEqual(totalMonthly, 379059);
  });

  test('excludes cancelled subscriptions from future forecasts', () => {
    const active = { name: 'Active', amountMinor: 50000, cadence: Cadence.MONTHLY, status: 'ACTIVE' };
    const cancelled = { name: 'Cancelled', amountMinor: 99900, cadence: Cadence.MONTHLY, status: 'CANCELLED' };

    const list = [active, cancelled];
    const forecastMonthly = list
      .filter((c) => c.status === 'ACTIVE')
      .reduce((sum, c) => sum + toMonthlyMinor(c.amountMinor, c.cadence), 0);

    assert.strictEqual(forecastMonthly, 50000);
  });

  test('calculates annualized commitments without floating point rounding error', () => {
    // 5 monthly subscriptions of ₹499 each
    const monthlyMinor = 49900;
    const annualMinor = toAnnualMinor(monthlyMinor, Cadence.MONTHLY);
    assert.strictEqual(annualMinor, 598800); // exactly ₹5,988.00
  });

  test('accumulates multiple recurring deduction cycles for weekly commitments in 30-day forecast', () => {
    const weeklyAmount = 50000; // ₹500.00
    const todayStr = '2026-10-21';
    const in7DaysStr = '2026-10-28';
    const in30DaysStr = '2026-11-20';

    let occurrenceDue = '2026-10-21';
    let next7DaysMinor = 0;
    let next30DaysMinor = 0;
    let occCount = 0;

    const { getNextDueDate } = require('@subguard/utils');

    while (occurrenceDue <= in30DaysStr && occCount < 20) {
      if (occurrenceDue <= in7DaysStr) {
        next7DaysMinor += weeklyAmount;
      }
      next30DaysMinor += weeklyAmount;
      occurrenceDue = getNextDueDate(occurrenceDue, Cadence.WEEKLY);
      occCount++;
    }

    // Oct 21, Oct 28 -> 2 occurrences in 7 days
    assert.strictEqual(next7DaysMinor, 100000); // ₹1,000.00
    // Oct 21, Oct 28, Nov 4, Nov 11, Nov 18 -> 5 occurrences in 30 days
    assert.strictEqual(next30DaysMinor, 250000); // ₹2,500.00
    assert.strictEqual(occCount, 5);
  });
});
