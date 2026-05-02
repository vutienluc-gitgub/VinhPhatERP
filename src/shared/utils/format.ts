/**
 * Format a number as Vietnamese currency (VNĐ).
 * Does NOT append the "đ" suffix — callers add it if needed.
 *
 * @example formatCurrency(1500000) // "1.500.000"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

/**
 * Format a number as compact Vietnamese currency for KPI cards.
 * Abbreviates large values to avoid text overflow.
 *
 * @example formatCompactCurrency(135_740_000) // "135.7 Tr"
 * @example formatCompactCurrency(2_500_000_000) // "2.5 Tỷ"
 * @example formatCompactCurrency(500_000) // "500.000 đ"
 */
export function formatCompactCurrency(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tỷ`;
  }
  if (abs >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tr`;
  }
  return `${new Intl.NumberFormat('vi-VN').format(value)} đ`;
}

/**
 * Format an optional number as Vietnamese currency with the ₫ symbol.
 * Returns '—' for null/undefined values.
 *
 * @example formatCurrencyFull(1500000) // "1.500.000 ₫"
 * @example formatCurrencyFull(null)     // "—"
 */
export function formatCurrencyFull(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}
