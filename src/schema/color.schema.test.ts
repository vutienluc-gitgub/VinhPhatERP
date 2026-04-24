import { describe, it, expect } from 'vitest';

import {
  colorSchema,
  colorDefaultValues,
  getColorHex,
  COLOR_HEX_MAP,
} from './color.schema';

describe('colorSchema', () => {
  it('accepts valid complete data', () => {
    const result = colorSchema.safeParse({
      code: 'RD-02',
      name: 'Đỏ đô (Maroon)',
      note: 'Màu phổ biến',
      trend_year: 2026,
      color_group: 'Màu Đậm',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('RD-02'); // uppercased by schema
    }
  });

  it('rejects empty code', () => {
    const result = colorSchema.safeParse({
      code: '',
      name: 'Đỏ đô',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('code'))).toBe(
        true,
      );
    }
  });

  it('rejects empty name', () => {
    const result = colorSchema.safeParse({
      code: 'RD-02',
      name: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(
        true,
      );
    }
  });

  it('uppercases code automatically', () => {
    const result = colorSchema.safeParse({
      code: 'rd-02',
      name: 'Đỏ đô',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe('RD-02');
    }
  });

  it('accepts null optional fields (note, trend_year, color_group)', () => {
    const result = colorSchema.safeParse({
      code: 'BK-01',
      name: 'Đen',
      note: null,
      trend_year: null,
      color_group: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects code longer than 50 chars', () => {
    const result = colorSchema.safeParse({
      code: 'A'.repeat(51),
      name: 'Test',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('code'))).toBe(
        true,
      );
    }
  });

  it('rejects name longer than 100 chars', () => {
    const result = colorSchema.safeParse({
      code: 'XX-01',
      name: 'A'.repeat(101),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('name'))).toBe(
        true,
      );
    }
  });

  it('has correct default values', () => {
    expect(colorDefaultValues.code).toBe('');
    expect(colorDefaultValues.name).toBe('');
    expect(colorDefaultValues.note).toBe('');
    expect(colorDefaultValues.color_group).toBeNull();
    expect(typeof colorDefaultValues.trend_year).toBe('number');
  });
});

describe('getColorHex', () => {
  it('returns known hex for mapped codes', () => {
    expect(getColorHex('WH-01')).toBe('#F8F8F5');
    expect(getColorHex('BK-01')).toBe('#1A1A1A');
    expect(getColorHex('RD-01')).toBe('#E52222');
    expect(getColorHex('RAW')).toBe('#E8DCC8');
  });

  it('is case-insensitive for known codes', () => {
    expect(getColorHex('wh-01')).toBe('#F8F8F5');
    expect(getColorHex('bk-01')).toBe('#1A1A1A');
    expect(getColorHex('raw')).toBe('#E8DCC8');
  });

  it('returns deterministic HSL for unknown codes', () => {
    const result = getColorHex('UNKNOWN-99');
    expect(result).toMatch(/^hsl\(\d+, 55%, 55%\)$/);
  });

  it('returns same result for same unknown code (deterministic)', () => {
    const first = getColorHex('MY-CUSTOM-01');
    const second = getColorHex('MY-CUSTOM-01');
    expect(first).toBe(second);
  });

  it('returns different results for different unknown codes', () => {
    const a = getColorHex('AAAA');
    const b = getColorHex('ZZZZ');
    // Very unlikely to collide with different strings
    expect(a).not.toBe(b);
  });

  it('covers all entries in COLOR_HEX_MAP', () => {
    for (const [code, expectedHex] of Object.entries(COLOR_HEX_MAP)) {
      expect(getColorHex(code)).toBe(expectedHex);
    }
  });
});
