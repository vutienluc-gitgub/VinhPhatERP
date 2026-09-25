import { describe, it, expect } from 'vitest';

import {
  generateVietQrUrl,
  generateVinhPhatVietQrUrl,
  splitRollsIntoColumns,
  computeRollsTotalWeight,
  VIETCOMBANK_BIN,
} from '@/domain/portal/portal-payment.utils';
import type { FabricRollBreakdownItem } from '@/domain/portal/types';

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
    expect(columns[0]!).toHaveLength(18);
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
