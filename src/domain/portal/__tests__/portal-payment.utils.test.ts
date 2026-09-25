import { describe, it, expect } from 'vitest';

import {
  computePaymentSummary,
  formatVndAmount,
  amountToVietnameseWords,
  generateVietQrUrl,
  generateVinhPhatVietQrUrl,
  splitRollsIntoColumns,
  computeRollsTotalWeight,
  DEFAULT_VAT_RATE,
  VIETCOMBANK_BIN,
} from '@/domain/portal/portal-payment.utils';
import type {
  FabricRollBreakdownItem,
  PortalOrderItem,
} from '@/domain/portal/types';

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
    expect(result.grandTotal).toBe(5400000); // 5M + 400K VAT
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
    expect(result.unitPricePerKg).toBe(78000); // first item
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

/* ────────────────────────────────────────────────────────────────── */
/*  generateVietQrUrl                                                */
/* ────────────────────────────────────────────────────────────────── */

describe('generateVietQrUrl', () => {
  it('generates valid VietQR URL with all params', () => {
    const url = generateVietQrUrl({
      bankBin: '970436',
      accountNumber: '123456789',
      amount: 68116464,
      memo: 'KH010 Monz brand thanh toan',
      accountName: 'VINH PHAT',
    });

    expect(url).toContain('img.vietqr.io');
    expect(url).toContain('970436-123456789');
    expect(url).toContain('amount=68116464');
    expect(url).toContain('addInfo=');
    expect(url).toContain('accountName=');
  });

  it('omits accountName when not provided', () => {
    const url = generateVietQrUrl({
      bankBin: '970436',
      accountNumber: '999',
      amount: 1000,
      memo: 'test',
    });

    expect(url).not.toContain('accountName');
  });

  it('rounds amount to integer', () => {
    const url = generateVietQrUrl({
      bankBin: '970436',
      accountNumber: '999',
      amount: 1234.56,
      memo: 'test',
    });

    expect(url).toContain('amount=1235');
  });
});

/* ────────────────────────────────────────────────────────────────── */
/*  generateVinhPhatVietQrUrl                                        */
/* ────────────────────────────────────────────────────────────────── */

describe('generateVinhPhatVietQrUrl', () => {
  it('uses Vietcombank BIN', () => {
    const url = generateVinhPhatVietQrUrl(
      68116464,
      'KH-010',
      'thanh toan vai Muoi Tieu',
      '123456789',
    );

    expect(url).toContain(VIETCOMBANK_BIN);
    expect(url).toContain('123456789');
    expect(url).toContain('amount=68116464');
  });

  it('truncates memo to 50 chars', () => {
    const longDesc = 'A'.repeat(100);
    const url = generateVinhPhatVietQrUrl(1000, 'KH', longDesc, '999');

    // memo = "KH " + 100 chars => sliced to 50
    const addInfoParam = new URL(url).searchParams.get('addInfo');
    expect(addInfoParam).not.toBeNull();
    expect(addInfoParam!.length).toBeLessThanOrEqual(50);
  });
});

/* ────────────────────────────────────────────────────────────────── */
/*  splitRollsIntoColumns                                            */
/* ────────────────────────────────────────────────────────────────── */

describe('splitRollsIntoColumns', () => {
  const makeRolls = (count: number): FabricRollBreakdownItem[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `roll-${i}`,
      roll_code: `R-${i + 1}`,
      weight_kg: 23.0 + (i % 5) * 0.1,
      length_m: null,
      display_index: i + 1,
    }));

  it('splits 35 rolls into 2 columns (20 + 15)', () => {
    const rolls = makeRolls(35);
    const columns = splitRollsIntoColumns(rolls, 2);

    expect(columns).toHaveLength(2);
    expect(columns[0]!).toHaveLength(18); // ceil(35/2)=18
    expect(columns[1]!).toHaveLength(17);
    expect(columns[0]!.length + columns[1]!.length).toBe(35);
  });

  it('handles single column', () => {
    const rolls = makeRolls(10);
    const columns = splitRollsIntoColumns(rolls, 1);

    expect(columns).toHaveLength(1);
    expect(columns[0]).toHaveLength(10);
  });

  it('handles empty rolls', () => {
    const columns = splitRollsIntoColumns([], 2);

    expect(columns).toHaveLength(2);
    expect(columns[0]).toHaveLength(0);
    expect(columns[1]).toHaveLength(0);
  });

  it('handles zero columns', () => {
    const columns = splitRollsIntoColumns(makeRolls(5), 0);
    expect(columns).toHaveLength(0);
  });
});

/* ────────────────────────────────────────────────────────────────── */
/*  computeRollsTotalWeight                                          */
/* ────────────────────────────────────────────────────────────────── */

describe('computeRollsTotalWeight', () => {
  it('sums all weights', () => {
    const rolls: FabricRollBreakdownItem[] = [
      {
        id: '1',
        roll_code: 'R1',
        weight_kg: 23.3,
        length_m: null,
        display_index: 1,
      },
      {
        id: '2',
        roll_code: 'R2',
        weight_kg: 23.2,
        length_m: null,
        display_index: 2,
      },
      {
        id: '3',
        roll_code: 'R3',
        weight_kg: 22.0,
        length_m: null,
        display_index: 3,
      },
    ];

    expect(computeRollsTotalWeight(rolls)).toBeCloseTo(68.5, 1);
  });

  it('returns 0 for empty list', () => {
    expect(computeRollsTotalWeight([])).toBe(0);
  });
});
