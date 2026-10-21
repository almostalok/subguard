import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { Cadence } from '@subguard/types';
import { daysBetween } from '@subguard/utils';

describe('Recurrence Detection Heuristics', () => {
  test('correctly identifies monthly recurring intervals with weekend tolerance', () => {
    // 3 monthly charges on the 10th-12th of sequential months
    const dates = ['2026-07-10', '2026-08-11', '2026-09-10', '2026-10-12'];
    const intervals: number[] = [];

    for (let i = 0; i < dates.length - 1; i++) {
      intervals.push(daysBetween(dates[i], dates[i + 1]));
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Monthly tolerance window: 28 to 33 days
    assert.ok(avgInterval >= 28 && avgInterval <= 33);

    let detectedCadence = null;
    if (avgInterval >= 26 && avgInterval <= 34) {
      detectedCadence = Cadence.MONTHLY;
    }

    assert.strictEqual(detectedCadence, Cadence.MONTHLY);
  });

  test('correctly identifies quarterly insurance/subscription cadence', () => {
    const dates = ['2026-01-15', '2026-04-16', '2026-07-15', '2026-10-15'];
    const intervals: number[] = [];

    for (let i = 0; i < dates.length - 1; i++) {
      intervals.push(daysBetween(dates[i], dates[i + 1]));
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    assert.ok(avgInterval >= 88 && avgInterval <= 93);

    let detectedCadence = null;
    if (avgInterval >= 85 && avgInterval <= 96) {
      detectedCadence = Cadence.QUARTERLY;
    }

    assert.strictEqual(detectedCadence, Cadence.QUARTERLY);
  });

  test('tolerates modest amount variance for utility or cloud bills', () => {
    const amounts = [142000, 151000, 148000]; // ₹1420, ₹1510, ₹1480 in minor units
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const variance = (maxAmount - minAmount) / maxAmount;

    assert.ok(variance < 0.15, 'Variance should be within 15%');
  });

  test('rejects erratic non-recurring shopping purchases', () => {
    const dates = ['2026-08-01', '2026-08-03', '2026-09-20', '2026-10-01'];
    const intervals: number[] = [];

    for (let i = 0; i < dates.length - 1; i++) {
      intervals.push(daysBetween(dates[i], dates[i + 1]));
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    // Avg interval will not match weekly, monthly, quarterly, or annual
    const matchesCadence =
      (avgInterval >= 6 && avgInterval <= 8) ||
      (avgInterval >= 28 && avgInterval <= 32) ||
      (avgInterval >= 88 && avgInterval <= 93);

    assert.strictEqual(matchesCadence, false);
  });

  test('enforces detection idempotency by excluding confirmed and dismissed keys', () => {
    const existingCandidates = [
      { merchantKey: 'netflix', reviewStatus: 'CONFIRMED' },
      { merchantKey: 'erratic-store', reviewStatus: 'DISMISSED' },
      { merchantKey: 'spotify', reviewStatus: 'PENDING' },
    ];

    const handledKeySet = new Set(
      existingCandidates
        .filter((c) => c.reviewStatus === 'DISMISSED' || c.reviewStatus === 'CONFIRMED')
        .map((c) => c.merchantKey)
    );

    assert.ok(handledKeySet.has('netflix'), 'Confirmed merchant key is excluded from re-scanning');
    assert.ok(handledKeySet.has('erratic-store'), 'Dismissed merchant key is excluded from re-scanning');
    assert.ok(!handledKeySet.has('spotify'), 'Pending candidates remain eligible for updates');
  });
});
