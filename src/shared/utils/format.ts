/**
 * Format a number as Vietnamese currency (VNĐ).
 * Does NOT append the "đ" suffix — callers add it if needed.
 *
 * @example formatCurrency(1500000) // "1.500.000"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

/**
 * Format an optional number as Vietnamese currency with the ₫ symbol.
 * Returns '—' for null/undefined values.
 *
 * @example formatCurrencyFull(1500000) // "1.500.000 ₫"
 * @example formatCurrencyFull(null)     // "—"
 */
export function formatCurrencyFull(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}
