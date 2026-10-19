import { Cadence } from '@subguard/types';
import * as crypto from 'crypto';

// ==========================================
// 1. Monetary & Exact Currency Arithmetic
// ==========================================

/**
 * Converts a standard decimal representation (e.g. 499.50) into integer minor units (e.g. 49950 paise).
 * Avoids floating-point rounding quirks by parsing strings or using fixed decimal multiplication.
 */
export function toMinorUnits(amount: number | string): number {
  if (typeof amount === 'string') {
    const cleanStr = amount.replace(/,/g, '').trim();
    if (!cleanStr) return 0;
    const parts = cleanStr.split('.');
    const integerPart = parseInt(parts[0], 10) || 0;
    let fractionPart = 0;
    if (parts.length > 1) {
      const fracStr = parts[1].padEnd(2, '0').slice(0, 2);
      fractionPart = parseInt(fracStr, 10) || 0;
    }
    const sign = integerPart < 0 || cleanStr.startsWith('-') ? -1 : 1;
    return (Math.abs(integerPart) * 100 + fractionPart) * sign;
  }

  // If number, round safely to avoid IEEE 754 precision issues
  return Math.round(amount * 100);
}

/**
 * Converts minor units back to standard decimal units (e.g. 49950 -> 499.50).
 */
export function toMajorUnits(minorUnits: number): number {
  return minorUnits / 100;
}

/**
 * Formats minor currency units into localized currency strings with standard tabular formatting.
 * Default is Indian Rupee (INR) formatting: e.g. ₹1,23,456.00 or ₹499.
 */
export function formatCurrency(
  minorUnits: number,
  currency: string = 'INR',
  showDecimals: boolean = true
): string {
  const major = toMajorUnits(minorUnits);
  try {
    return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: showDecimals ? 2 : 0,
      maximumFractionDigits: showDecimals ? 2 : 0,
    }).format(major);
  } catch {
    // Fallback if currency code is unusual
    return `${currency} ${major.toFixed(2)}`;
  }
}

/**
 * Computes the normalized monthly-equivalent amount in integer minor units.
 * Documented cadence conversion ratios:
 * - WEEKLY: (amount * 52) / 12
 * - MONTHLY: amount
 * - QUARTERLY: amount / 3
 * - SEMI_ANNUALLY: amount / 6
 * - ANNUALLY: amount / 12
 * - CUSTOM: (amount / customDays) * (365 / 12)
 */
export function toMonthlyMinor(
  amountMinor: number,
  cadence: Cadence,
  customCadenceDays?: number | null
): number {
  switch (cadence) {
    case Cadence.WEEKLY:
      return Math.round((amountMinor * 52) / 12);
    case Cadence.MONTHLY:
      return amountMinor;
    case Cadence.QUARTERLY:
      return Math.round(amountMinor / 3);
    case Cadence.SEMI_ANNUALLY:
      return Math.round(amountMinor / 6);
    case Cadence.ANNUALLY:
      return Math.round(amountMinor / 12);
    case Cadence.CUSTOM:
      if (customCadenceDays && customCadenceDays > 0) {
        return Math.round((amountMinor / customCadenceDays) * (365 / 12));
      }
      return amountMinor;
    default:
      return amountMinor;
  }
}

/**
 * Computes the annualized recurring commitment in integer minor units.
 * - WEEKLY: amount * 52
 * - MONTHLY: amount * 12
 * - QUARTERLY: amount * 4
 * - SEMI_ANNUALLY: amount * 2
 * - ANNUALLY: amount
 * - CUSTOM: (amount / customDays) * 365
 */
export function toAnnualMinor(
  amountMinor: number,
  cadence: Cadence,
  customCadenceDays?: number | null
): number {
  switch (cadence) {
    case Cadence.WEEKLY:
      return amountMinor * 52;
    case Cadence.MONTHLY:
      return amountMinor * 12;
    case Cadence.QUARTERLY:
      return amountMinor * 4;
    case Cadence.SEMI_ANNUALLY:
      return amountMinor * 2;
    case Cadence.ANNUALLY:
      return amountMinor;
    case Cadence.CUSTOM:
      if (customCadenceDays && customCadenceDays > 0) {
        return Math.round((amountMinor / customCadenceDays) * 365);
      }
      return amountMinor * 12;
    default:
      return amountMinor * 12;
  }
}

// ==========================================
// 2. Normalization & Fingerprinting
// ==========================================

const UPI_AND_GATEWAY_PREFIXES = [
  /^UPI[-/]/i,
  /^POS\s+/i,
  /^E-?COM\s+/i,
  /^BIL[/]/i,
  /^PAYTM[*]/i,
  /^RAZORPAY[*]/i,
  /^CC\s+BILL\s+/i,
  /^ACH[-/]/i,
  /^NACH[-/]/i,
  /^SI[-/]/i,
  /^INB[-/]/i,
  /^VPA\s+/i,
];

/**
 * Normalizes an raw banking statement description into a clean display merchant
 * and a sanitized grouping key.
 * E.g. "UPI-NETFLIX ENTERTAINMENT-102938@hdfcbank" ->
 * { normalized: "Netflix Entertainment", merchantKey: "netflix-entertainment" }
 */
export function normalizeMerchant(rawDescription: string): {
  normalized: string;
  merchantKey: string;
} {
  if (!rawDescription) {
    return { normalized: 'Unknown Merchant', merchantKey: 'unknown' };
  }

  let cleaned = rawDescription.trim();

  // Strip known prefix patterns
  for (const prefix of UPI_AND_GATEWAY_PREFIXES) {
    cleaned = cleaned.replace(prefix, '');
  }

  // Remove trailing UPI handles (e.g. @okaxis, @okhdfcbank, @paytm)
  cleaned = cleaned.replace(/@[a-zA-Z0-9._-]+/g, '');

  // Remove long numerical reference strings (e.g. /2026101912345/ or *891234 or 992381283)
  cleaned = cleaned.replace(/[/][0-9A-Z]{6,}[/]/g, ' ');
  cleaned = cleaned.replace(/\*[0-9]{4,}/g, '');
  cleaned = cleaned.replace(/[0-9]{6,}/g, '');

  // Strip trailing dates in DD/MM or DD-MM format
  cleaned = cleaned.replace(/\b\d{2}[/-]\d{2}[/-]\d{2,4}\b/g, '');

  // Clean punctuation and excess whitespace
  cleaned = cleaned.replace(/[-_/\\|*#]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!cleaned) {
    cleaned = rawDescription.trim();
  }

  // Capitalize properly
  const normalized = cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // Generate URL-friendly merchantKey for clustering
  const merchantKey = cleaned
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'unknown';

  return { normalized, merchantKey };
}

/**
 * Generates an immutable SHA-256 fingerprint for a transaction to prevent duplicate imports.
 */
export function generateTransactionFingerprint(
  userId: string,
  date: string,
  amountMinor: number,
  description: string,
  accountId?: string | null
): string {
  const payload = `${userId}:${accountId || 'default'}:${date}:${amountMinor}:${description.trim().toLowerCase()}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Escapes CSV cell contents to protect against CSV Formula Injection / DDE attacks.
 * If content begins with =, +, -, @, tab, or carriage return, it prefixes it with a single quote (').
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

// ==========================================
// 3. Date Arithmetic & Windows
// ==========================================

export function parseDate(dateStr: string): Date {
  // Handles YYYY-MM-DD or ISO strings
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDate(d);
}

export function daysBetween(dateStrA: string, dateStrB: string): number {
  const a = parseDate(dateStrA).getTime();
  const b = parseDate(dateStrB).getTime();
  return Math.round(Math.abs(b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Advances a due date by one recurrence cycle.
 */
export function getNextDueDate(
  currentDueDateStr: string,
  cadence: Cadence,
  customDays?: number | null
): string {
  const d = parseDate(currentDueDateStr);
  switch (cadence) {
    case Cadence.WEEKLY:
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case Cadence.MONTHLY:
      d.setUTCMonth(d.getUTCMonth() + 1);
      break;
    case Cadence.QUARTERLY:
      d.setUTCMonth(d.getUTCMonth() + 3);
      break;
    case Cadence.SEMI_ANNUALLY:
      d.setUTCMonth(d.getUTCMonth() + 6);
      break;
    case Cadence.ANNUALLY:
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
    case Cadence.CUSTOM:
      d.setUTCDate(d.getUTCDate() + (customDays && customDays > 0 ? customDays : 30));
      break;
    default:
      d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return formatDate(d);
}

export function isDateWithinWindow(
  dateStr: string,
  startWindowStr: string,
  endWindowStr: string
): boolean {
  return dateStr >= startWindowStr && dateStr <= endWindowStr;
}
