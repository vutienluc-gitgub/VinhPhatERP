import { describe, it, expect } from 'vitest';

import { formatValue, formatCurrency, formatQuantity } from './formatter';

describe('formatValue', () => {
  it('returns fallback for null/undefined', () => {
    expect(formatValue(null)).toBe('—');
    expect(formatValue(undefined)).toBe('—');
    expect(formatValue(null, { fallback: 'N/A' })).toBe('N/A');
  });

  it('formats basic numbers', () => {
    expect(formatValue(85000)).toBe('85.000');
    expect(formatValue(-1250)).toBe('-1.250');
    expect(formatValue(0)).toBe('0');
  });

  it('handles decimals', () => {
    expect(formatValue(12.5, { decimals: 1 })).toBe('12,5');
    expect(formatValue(12.56, { decimals: 1 })).toBe('12,6'); // rounding
    expect(formatValue(12.56, { decimals: 2 })).toBe('12,56');
  });

  it('handles prefix and suffix', () => {
    expect(formatValue(85000, { suffix: 'đ' })).toBe('85.000 đ');
    expect(formatValue(85000, { prefix: 'Từ', suffix: 'đ/kg' })).toBe(
      'Từ 85.000 đ/kg',
    );
  });

  it('handles compact mode', () => {
    expect(formatValue(850, { compact: true })).toBe('850');
    expect(formatValue(85000, { compact: true })).toBe('85K');
    expect(formatValue(1500000, { compact: true })).toBe('1,5 Tr');
    expect(formatValue(2500000000, { compact: true })).toBe('2,5 Tỷ');
  });

  it('combines compact mode with suffix', () => {
    expect(formatValue(85000, { compact: true, suffix: 'đ' })).toBe('85K đ');
  });
});

describe('formatCurrency', () => {
  it('formats currency without decimals by default', () => {
    expect(formatCurrency(85000.5)).toBe('85.001'); // Rounded
  });

  it('allows overriding suffix', () => {
    expect(formatCurrency(85000, { suffix: 'đ/kg' })).toBe('85.000 đ/kg');
  });
});

describe('formatQuantity', () => {
  it('formats with 1 decimal by default', () => {
    expect(formatQuantity(12.5)).toBe('12,5');
    expect(formatQuantity(12)).toBe('12'); // Doesn't pad by default
  });
});
