export function calculateTotalLength(
  items: Array<{ length_m: number | null }>,
): number {
  let total = 0;
  for (const item of items) {
    total += item.length_m ?? 0;
  }
  return total;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('vi-VN');
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}

export function formatQty(qty: number | null | undefined): string {
  if (qty === null || qty === undefined) return '0';
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(qty);
}
