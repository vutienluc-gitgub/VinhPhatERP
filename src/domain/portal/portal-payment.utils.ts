/**
 * Pure utility functions for Portal Payment & Packing List calculations.
 * No React or Supabase dependencies — safe to use in tests.
 */

import type {
  FabricRollBreakdownItem,
  OrderPaymentSummary,
  PortalOrderItem,
} from '@/domain/portal/types';

/** Default VAT rate for textile products in Vietnam (8%). */
export const DEFAULT_VAT_RATE = 0.08;

/**
 * Compute the full payment summary for an order.
 *
 * Business rules:
 * - Subtotal = sum of all item amounts.
 * - VAT = round(subtotal * vatRate) to integer.
 * - GrandTotal = subtotal + VAT.
 * - RemainingBalance = grandTotal - paidAmount (never negative).
 */
export function computePaymentSummary(
  items: PortalOrderItem[],
  paidAmount: number,
  vatRate: number = DEFAULT_VAT_RATE,
): OrderPaymentSummary {
  const subtotal = items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const vatAmount = Math.round(subtotal * vatRate);
  const grandTotal = subtotal + vatAmount;
  const remainingBalance = Math.max(0, grandTotal - paidAmount);

  const totalWeightKg = items.reduce(
    (sum, item: PortalOrderItem) => sum + (item.quantity ?? 0),
    0 as number,
  );
  const unitPricePerKg = items.length > 0 ? (items[0]?.unit_price ?? 0) : 0;

  return {
    subtotal,
    vatRate,
    vatAmount,
    grandTotal,
    paidAmount,
    remainingBalance,
    unitPricePerKg,
    totalWeightKg,
  };
}

/**
 * Format a number as Vietnamese currency string (VND).
 * Example: 68116464 => "68.116.464"
 */
export function formatVndAmount(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Convert a number to Vietnamese written form (bằng chữ) for amounts up to billions.
 * Simplified implementation for common textile invoice amounts.
 */
export function amountToVietnameseWords(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Không';

  const digits = [
    '',
    'một',
    'hai',
    'ba',
    'bốn',
    'năm',
    'sáu',
    'bảy',
    'tám',
    'chín',
  ];
  const units = ['', 'ngàn', 'triệu', 'tỷ'];

  function readThreeDigits(n: number): string {
    if (n === 0) return '';
    const hundreds = Math.floor(n / 100);
    const tens = Math.floor((n % 100) / 10);
    const ones = n % 10;

    const parts: string[] = [];
    if (hundreds > 0) {
      parts.push(`${digits[hundreds]} trăm`);
    }
    if (tens === 0 && ones > 0 && hundreds > 0) {
      parts.push('lẻ');
    }
    if (tens === 1) {
      parts.push('mười');
    } else if (tens > 1) {
      parts.push(`${digits[tens]} mươi`);
    }
    if (ones === 1 && tens > 1) {
      parts.push('mốt');
    } else if (ones === 5 && tens > 0) {
      parts.push('lăm');
    } else if (
      ones > 0 &&
      !(ones === 1 && tens > 1) &&
      !(ones === 5 && tens > 0)
    ) {
      const d = digits[ones];
      if (d) parts.push(d);
    }

    return parts.join(' ');
  }

  const groups: number[] = [];
  let remaining = rounded;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const result = groups
    .map((group, i) => {
      if (group === 0) return '';
      const text = readThreeDigits(group);
      return text + (units[i] ? ` ${units[i]}` : '');
    })
    .reverse()
    .filter(Boolean)
    .join(' ');

  const capitalized = result.charAt(0).toUpperCase() + result.slice(1);
  return `${capitalized} đồng`;
}

/**
 * Generate a VietQR URL for bank transfer.
 * Follows NAPAS VietQR standard: https://www.vietqr.io/
 *
 * @param bankBin - Bank BIN (e.g. '970436' for Vietcombank)
 * @param accountNumber - Bank account number
 * @param amount - Transfer amount in VND
 * @param memo - Transfer memo/description
 * @param accountName - Account holder name (optional)
 */
export function generateVietQrUrl(params: {
  bankBin: string;
  accountNumber: string;
  amount: number;
  memo: string;
  accountName?: string;
}): string {
  const { bankBin, accountNumber, amount, memo, accountName } = params;
  const roundedAmount = Math.round(amount);

  const url = new URL('https://img.vietqr.io/image');
  url.pathname = `/image/${bankBin}-${accountNumber}-compact.jpg`;
  url.searchParams.set('amount', String(roundedAmount));
  url.searchParams.set('addInfo', memo);
  if (accountName) {
    url.searchParams.set('accountName', accountName);
  }

  return url.toString();
}

/** Vietcombank BIN code */
export const VIETCOMBANK_BIN = '970436';

/**
 * Generate a VietQR URL specifically for Vinh Phat textile payments.
 */
export function generateVinhPhatVietQrUrl(
  amount: number,
  customerCode: string,
  description: string,
  accountNumber: string,
): string {
  const memo = `${customerCode} ${description}`.slice(0, 50);
  return generateVietQrUrl({
    bankBin: VIETCOMBANK_BIN,
    accountNumber,
    amount,
    memo,
    accountName: 'CTY TNHH SX TM DET MAY VINH PHAT',
  });
}

/**
 * Split an array of roll items into N balanced columns for display.
 * E.g., 35 items with 2 columns => [20, 15] distribution.
 */
export function splitRollsIntoColumns(
  rolls: FabricRollBreakdownItem[],
  columnCount: number = 2,
): FabricRollBreakdownItem[][] {
  if (columnCount <= 0) return [];
  if (columnCount === 1) return [rolls];

  const itemsPerColumn = Math.ceil(rolls.length / columnCount);
  const columns: FabricRollBreakdownItem[][] = [];

  for (let i = 0; i < columnCount; i++) {
    const start = i * itemsPerColumn;
    columns.push(rolls.slice(start, start + itemsPerColumn));
  }

  return columns;
}

/**
 * Compute total weight for a list of rolls.
 */
export function computeRollsTotalWeight(
  rolls: FabricRollBreakdownItem[],
): number {
  return rolls.reduce((sum, r) => sum + (r.weight_kg ?? 0), 0);
}
