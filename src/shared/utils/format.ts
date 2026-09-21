export function formatCurrency(amount: number | string | null | undefined, currency: string = 'VND'): string {
  if (amount == null || isNaN(Number(amount))) return '0 ₫';
  const num = Number(amount);
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num == null || isNaN(Number(num))) return '0';
  return new Intl.NumberFormat('vi-VN').format(Number(num));
}

export function formatDate(date: string | Date | null | undefined, formatStr: string = 'DD/MM/YYYY'): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${mins} ${day}/${month}/${year}`;
}

export function sanitizePhoneSearchQuery(query: string): string {
  if (!query) return '';
  return query.replace(/[^0-9+]/g, '');
}

export function formatCompactCurrency(amount: number | string | null | undefined): string {
  if (amount == null || isNaN(Number(amount))) return '0 ₫';
  const num = Number(amount);
  if (Math.abs(num) >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)} tỷ ₫`;
  }
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)} tr ₫`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(0)}k ₫`;
  }
  return `${num.toLocaleString('vi-VN')} ₫`;
}


