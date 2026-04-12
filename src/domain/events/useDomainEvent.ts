import { useEffect } from 'react';

import { DomainEventBus } from '@/domain/core/DomainEventBus';

import type { AppDomainEvent } from './app.events';

/**
 * Hook giúp Component tự động subscribe lắng nghe Domain Events.
 * Nó sẽ tự dọn dẹp (unsubscribe) khi Component unmount.
 */
export function useDomainEvent<T extends AppDomainEvent>(
  eventName: T['eventName'],
  handler: (event: T) => void,
) {
  useEffect(() => {
    // Đăng ký EventBus và nhận hàm huỷ đăng ký
    const unsubscribe = DomainEventBus.subscribe<T>(eventName, handler);

    return () => {
      // Dọn dẹp an toàn khi component bị hủy
      unsubscribe();
    };
  }, [eventName, handler]);
}
