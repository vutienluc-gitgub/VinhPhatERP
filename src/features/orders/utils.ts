import { sumBy } from '@/shared/utils/array.util';
import type { Order } from '@/domain/orders/types';

export function daysUntilDelivery(
  deliveryDate: string | null,
): { text: string; urgent: boolean } | null {
  if (!deliveryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const delivery = new Date(deliveryDate);
  const diff = Math.ceil(
    (delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff < 0) {
    return {
      text: `Trễ ${Math.abs(diff)} ngày`,
      urgent: true,
    };
  }
  if (diff === 0) {
    return {
      text: 'Hôm nay',
      urgent: true,
    };
  }
  if (diff <= 3) {
    return {
      text: `Còn ${diff} ngày`,
      urgent: true,
    };
  }
  return {
    text: `Còn ${diff} ngày`,
    urgent: false,
  };
}

export function calculateOrderKPIs(orders: Order[]) {
  const pendingReviewCount = orders.filter(
    (o) => o.status === 'pending_review',
  ).length;

  const totalRevenue = sumBy(orders, (o) => o.total_amount);

  const totalDebt = sumBy(orders, (o) =>
    Math.max(0, o.total_amount - (o.paid_amount || 0)),
  );

  return {
    pendingReviewCount,
    totalRevenue,
    totalDebt,
  };
}

export function calculateBalanceDue(order: Order): number {
  return Math.max(0, order.total_amount - (order.paid_amount || 0));
}
