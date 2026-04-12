import { useQueryClient } from '@tanstack/react-query';

import { useDomainEvent } from '@/domain/events/useDomainEvent';
import type { PaymentCreatedEvent } from '@/domain/events/app.events';

/**
 * React Query Invalidation Bridge.
 * Bắt các Domain Events để invalidate cache (queryKey) của các Bounded Contexts tương ứng.
 * File này chạy ở gốc React (ví dụ: AppProviders/AppRouter) để lắng nghe toàn cục.
 */
export function useQueryInvalidationBridge() {
  const queryClient = useQueryClient();

  // ─── Lắng nghe thay đổi từ Payments (Phiếu Thu) ─────────────────────────────
  useDomainEvent<PaymentCreatedEvent>('PaymentCreatedEvent', (event) => {
    console.info(`[QueryBridge] Payment Created: `, event.payload.paymentId);
    // Tính năng Payment đã thêm phiếu thu -> Tính năng Orders cần update số tiền Đã thu
    if (event.payload.orderId) {
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  useDomainEvent('PaymentDeletedEvent', () => {
    // Nếu huỷ/xoá phiếu thu, Orders cũng cần cập nhật số tiền
    void queryClient.invalidateQueries({ queryKey: ['orders'] });
  });

  // ─── Lắng nghe thay đổi từ Expenses (Phiếu Chi) ─────────────────────────────
  useDomainEvent('ExpenseCreatedEvent', () => {
    // Khi tạo phiếu chi, số dư của payment-accounts có thể thay đổi
    void queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
  });

  useDomainEvent('ExpenseUpdatedEvent', () => {
    void queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
  });

  useDomainEvent('ExpenseDeletedEvent', () => {
    void queryClient.invalidateQueries({ queryKey: ['payment-accounts'] });
  });

  // Có thể bổ sung thêm các Event khác như: OrderConfirmedEvent -> Invalidate ['inventory']...
}
