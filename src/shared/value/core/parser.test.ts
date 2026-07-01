import { describe, it, expect } from 'vitest';

import { parseNumericString } from './parser';

describe('parseNumericString', () => {
  it('returns null for empty or invalid inputs', () => {
    expect(parseNumericString(null)).toBeNull();
    expect(parseNumericString(undefined)).toBeNull();
    expect(parseNumericString('')).toBeNull();
    expect(parseNumericString('   ')).toBeNull();
    expect(parseNumericString('abc')).toBeNull();
  });

  it('handles standard numbers', () => {
    expect(parseNumericString(85)).toBe(85);
    expect(parseNumericString(85000)).toBe(85000);
    expect(parseNumericString(-12.5)).toBe(-12.5);
  });

  it('handles simple numeric strings', () => {
    expect(parseNumericString('85')).toBe(85);
    expect(parseNumericString('-125')).toBe(-125);
    expect(parseNumericString('0')).toBe(0);
  });

  it('handles English format (dot for decimal, comma for thousand)', () => {
    expect(parseNumericString('1,234.56')).toBe(1234.56);
    expect(parseNumericString('-1,234.56')).toBe(-1234.56);
    expect(parseNumericString('1,234,567.89')).toBe(1234567.89);
  });

  it('handles Vietnamese format (comma for decimal, dot for thousand)', () => {
    expect(parseNumericString('1.234,56')).toBe(1234.56);
    expect(parseNumericString('-1.234,56')).toBe(-1234.56);
    expect(parseNumericString('1.234.567,89')).toBe(1234567.89);
  });

  it('infers single separator correctly based on trailing digits', () => {
    // Exactly 3 trailing digits -> assume thousand separator
    expect(parseNumericString('85.000')).toBe(85000);
    expect(parseNumericString('85,000')).toBe(85000);

    // Less than 3 trailing digits -> assume decimal
    expect(parseNumericString('12.5')).toBe(12.5);
    expect(parseNumericString('12,5')).toBe(12.5);
    expect(parseNumericString('12.56')).toBe(12.56);
    expect(parseNumericString('12,56')).toBe(12.56);
  });

  it('handles multipliers (k, m, tr, tỷ)', () => {
    expect(parseNumericString('85k')).toBe(85000);
    expect(parseNumericString('85K')).toBe(85000);
    expect(parseNumericString('1.5m')).toBe(1500000);
    expect(parseNumericString('1,5m')).toBe(1500000);
    expect(parseNumericString('3tr')).toBe(3000000);
    expect(parseNumericString('3 triệu')).toBe(3000000);
    expect(parseNumericString('10 tỷ')).toBe(10000000000);
    expect(parseNumericString('10ty')).toBe(10000000000);
  });

  it('handles multipliers with negative numbers', () => {
    expect(parseNumericString('-85k')).toBe(-85000);
    expect(parseNumericString('-1.5m')).toBe(-1500000);
  });
});
