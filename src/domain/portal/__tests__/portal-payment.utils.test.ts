import { describe, it, expect } from 'vitest';

import {
  computePaymentSummary,
  formatVndAmount,
  amountToVietnameseWords,
  DEFAULT_VAT_RATE,
} from '@/domain/portal/portal-payment.utils';
import type { PortalOrderItem } from '@/domain/portal/types';

/* ────────────────────────────────────────────────────────────────── */
/*  computePaymentSummary                                            */
/* ────────────────────────────────────────────────────────────────── */

describe('computePaymentSummary', () => {
  const makeItem = (qty: number, price: number): PortalOrderItem => ({
    id: 'item-1',
    fabric_name: 'Test',
    color: null,
    quantity: qty,
    unit_price: price,
    amount: qty * price,
  });

  it('computes correct VAT 8% for Monz brand scenario (808.6 kg x 78000)', () => {
    const items = [makeItem(808.6, 78000)];
    const result = computePaymentSummary(items, 0, 0.08);

    expect(result.subtotal).toBe(63070800);
    expect(result.vatRate).toBe(0.08);
    expect(result.vatAmount).toBe(5045664);
    expect(result.grandTotal).toBe(68116464);
    expect(result.remainingBalance).toBe(68116464);
    expect(result.paidAmount).toBe(0);
    expect(result.unitPricePerKg).toBe(78000);
    expect(result.totalWeightKg).toBeCloseTo(808.6, 1);
  });

  it('deducts paid amount from remaining balance', () => {
    const items = [makeItem(100, 50000)];
    const result = computePaymentSummary(items, 2000000);

    expect(result.subtotal).toBe(5000000);
    expect(result.grandTotal).toBe(5400000);
    expect(result.remainingBalance).toBe(3400000);
  });

  it('remaining balance never goes negative (overpaid)', () => {
    const items = [makeItem(10, 1000)];
    const result = computePaymentSummary(items, 999999);

    expect(result.remainingBalance).toBe(0);
  });

  it('handles empty items list', () => {
    const result = computePaymentSummary([], 0);

    expect(result.subtotal).toBe(0);
    expect(result.vatAmount).toBe(0);
    expect(result.grandTotal).toBe(0);
    expect(result.unitPricePerKg).toBe(0);
  });

  it('handles multiple items', () => {
    const items = [makeItem(500, 78000), makeItem(300, 68000)];
    const result = computePaymentSummary(items, 0);

    expect(result.subtotal).toBe(500 * 78000 + 300 * 68000);
    expect(result.totalWeightKg).toBe(800);
    expect(result.unitPricePerKg).toBe(78000);
  });

  it('uses default VAT rate of 8% when not specified', () => {
    expect(DEFAULT_VAT_RATE).toBe(0.08);
    const items = [makeItem(100, 10000)];
    const result = computePaymentSummary(items, 0);

    expect(result.vatRate).toBe(0.08);
    expect(result.vatAmount).toBe(80000);
  });

  it('supports custom VAT rate (10%)', () => {
    const items = [makeItem(100, 10000)];
    const result = computePaymentSummary(items, 0, 0.1);

    expect(result.vatRate).toBe(0.1);
    expect(result.vatAmount).toBe(100000);
  });
});

/* ────────────────────────────────────────────────────────────────── */
/*  formatVndAmount                                                  */
/* ────────────────────────────────────────────────────────────────── */

describe('formatVndAmount', () => {
  it('formats millions with dot separators', () => {
    expect(formatVndAmount(68116464)).toBe('68.116.464');
  });

  it('formats zero', () => {
    expect(formatVndAmount(0)).toBe('0');
  });

  it('formats small numbers without separators', () => {
    expect(formatVndAmount(500)).toBe('500');
  });

  it('rounds decimal amounts', () => {
    expect(formatVndAmount(12345.67)).toBe('12.346');
  });

  it('formats billions', () => {
    expect(formatVndAmount(1234567890)).toBe('1.234.567.890');
  });
});

/* ────────────────────────────────────────────────────────────────── */
/*  amountToVietnameseWords                                          */
/* ────────────────────────────────────────────────────────────────── */

describe('amountToVietnameseWords', () => {
  it('converts zero', () => {
    expect(amountToVietnameseWords(0)).toBe('Không');
  });

  it('converts simple thousands', () => {
    const result = amountToVietnameseWords(5000);
    expect(result.toLowerCase()).toContain('năm ngàn');
  });

  it('converts millions', () => {
    const result = amountToVietnameseWords(68116464);
    expect(result.toLowerCase()).toContain('triệu');
    expect(result).toMatch(/đồng$/);
  });

  it('capitalizes first letter', () => {
    const result = amountToVietnameseWords(1000);
    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
  });

  it('always ends with "đồng"', () => {
    expect(amountToVietnameseWords(100)).toMatch(/đồng$/);
    expect(amountToVietnameseWords(999999)).toMatch(/đồng$/);
  });
});
