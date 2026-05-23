import { useMemo } from 'react';

import type { PurchaseOrderItem } from '@/domain/purchase-orders';

export function usePOCalculations(
  items: Partial<PurchaseOrderItem>[],
  vatRate: number,
  shippingFee: number | string,
) {
  const lineTotals = useMemo(() => {
    return (items || []).map((item) => {
      const qty = Number(item.ordered_qty) || 0;
      const price = Number(item.unit_price) || 0;
      // Tránh lỗi floating point của JS (VD: 0.1 * 0.2)
      return Number((qty * price).toFixed(4));
    });
  }, [items]);

  const subtotal = useMemo(() => {
    return lineTotals.reduce((acc, total) => acc + total, 0);
  }, [lineTotals]);

  const vatAmount = (subtotal * Number(vatRate || 0)) / 100;
  const totalAmount = subtotal + vatAmount + Number(shippingFee || 0);

  return {
    lineTotals,
    subtotal,
    vatAmount,
    totalAmount,
  };
}
