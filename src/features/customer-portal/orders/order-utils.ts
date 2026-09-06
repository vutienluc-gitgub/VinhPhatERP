import type { PortalOrder } from '@/domain/portal/types';
import {
  TIMELINE_STEPS,
  ORDER_STATUS_LABELS,
} from '@/features/customer-portal/constants';

export function getPaymentBadge(order: PortalOrder): {
  label: string;
  className: string;
} {
  if (order.paid_amount >= order.total_amount && order.total_amount > 0) {
    return {
      label: 'Đã thanh toán',
      className: 'portal-badge portal-badge--paid',
    };
  }
  if (order.paid_amount > 0) {
    return {
      label: 'Thanh toán một phần',
      className: 'portal-badge portal-badge--partial',
    };
  }
  return {
    label: 'Chưa thanh toán',
    className: 'portal-badge portal-badge--unpaid',
  };
}

export function getStepStates(order: PortalOrder) {
  const isCancelled = order.status === 'cancelled';
  if (isCancelled) return { steps: [], activeIndex: -1 };

  const hasShipping =
    order.shipments?.some(
      (s) => s.status === 'shipped' || s.status === 'delivered',
    ) ?? false;

  const statusOrder: Record<string, number> = {
    pending_review: 0,
    draft: 0,
    confirmed: 1,
    in_progress: 2,
    completed: 4,
  };

  let completedUpTo = statusOrder[order.status] ?? 0;

  // If shipments are in transit but order isn't completed yet, mark shipping as active
  if (hasShipping && completedUpTo < 3) {
    completedUpTo = 3;
  }

  const steps = TIMELINE_STEPS.map((_step, idx) => {
    if (idx < completedUpTo) return 'completed' as const;
    if (idx === completedUpTo) return 'active' as const;
    return 'pending' as const;
  });

  return { steps, activeIndex: completedUpTo };
}

export function getMobileStatusLabel(order: PortalOrder): string {
  const { activeIndex } = getStepStates(order);
  if (order.status === 'cancelled') return 'Đã hủy';
  const stepEntry = TIMELINE_STEPS[activeIndex];
  if (activeIndex >= 0 && activeIndex < TIMELINE_STEPS.length && stepEntry) {
    return stepEntry.label;
  }
  return ORDER_STATUS_LABELS[order.status] ?? order.status;
}

export function calculateProgressPercent(steps: readonly string[]): number {
  if (steps.length <= 1) return 0;
  const lastCompleted = steps.lastIndexOf('completed');
  const activeIdx = steps.indexOf('active');
  const furthest = activeIdx >= 0 ? activeIdx : lastCompleted;
  return furthest >= 0 ? (furthest / (steps.length - 1)) * 100 : 0;
}
