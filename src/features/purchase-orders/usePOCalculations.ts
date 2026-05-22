import { useMemo } from 'react';

import type { PurchaseOrderItem } from '@/domain/purchase-orders';

export function usePOCalculations(
  items: Partial<PurchaseOrderItem>[],
  vatRate: number,
  shippingFee: number | string,
) {
  const subtotal = useMemo(() => {
    return items.reduce(
      (acc, item) => acc + (item.ordered_qty || 0) * (item.unit_price || 0),
      0,
    );
  }, [items]);

  const vatAmount = (subtotal * vatRate) / 100;
  const totalAmount = subtotal + vatAmount + Number(shippingFee || 0);

  return {
    subtotal,
    vatAmount,
    totalAmount,
  };
}
