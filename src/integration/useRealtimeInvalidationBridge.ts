import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useDomainEvent } from '@/domain/events/useDomainEvent';
import { realtimeService } from '@/infrastructure/realtime/RealtimeListenerService';
import type {
  ReceivableUpdatedEvent,
  ReceivableCreatedEvent,
  ReceivableDeletedEvent,
} from '@/domain/events/app.events';

/**
 * Realtime Invalidation Bridge.
 * Dedicated hook to bridge incoming Server-to-Client Global Realtime Events
 * payload into React Query invalidations (optimizing and debouncing where necessary).
 */
export function useRealtimeInvalidationBridge() {
  const queryClient = useQueryClient();

  // Khởi tạo Realtime Server Connection tại level gốc ứng dụng
  useEffect(() => {
    realtimeService.initialize();

    return () => {
      // Dọn dẹp connection khi App unmount
      realtimeService.cleanup();
    };
  }, []);

  // ─── Lắng nghe Realtime Receivable Events ───────────────────────────────────

  const handleReceivableInvalidation = (customerId: string) => {
    // 1. Invalidate toàn bộ danh sách khách hàng đang nợ
    void queryClient.invalidateQueries({ queryKey: ['debts'] });

    // 2. Granular Invalidation: Chỉ invalidate đúng ID Khách hàng bị ảnh hưởng
    if (customerId) {
      void queryClient.invalidateQueries({
        queryKey: ['customer-debt', customerId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['debt-transactions', customerId],
      });
      void queryClient.invalidateQueries({
        queryKey: ['customers', customerId],
      });

      console.info(
        `[RealtimeBridge] Granular invalidate cached debts for Customer: ${customerId}`,
      );
    }
  };

  useDomainEvent<ReceivableUpdatedEvent>('ReceivableUpdatedEvent', (event) => {
    handleReceivableInvalidation(event.payload.customerId);
  });

  useDomainEvent<ReceivableCreatedEvent>('ReceivableCreatedEvent', (event) => {
    handleReceivableInvalidation(event.payload.customerId);
  });

  useDomainEvent<ReceivableDeletedEvent>('ReceivableDeletedEvent', (event) => {
    handleReceivableInvalidation(event.payload.customerId);
  });
}
