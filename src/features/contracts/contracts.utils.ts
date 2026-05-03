/**
 * Shared date formatter for the contracts feature.
 * Returns a Vietnamese locale date string, or '—' for null/undefined.
 */
export function formatContractDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
