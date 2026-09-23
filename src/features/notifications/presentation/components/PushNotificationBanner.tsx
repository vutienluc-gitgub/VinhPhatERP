import { useState } from 'react';

import { usePushSubscription } from '@/shared/hooks/usePushSubscription';
import { Icon } from '@/shared/components/Icon';

export function PushNotificationBanner() {
  const { permission, isSubscribed, isLoading, subscribe } = usePushSubscription();
  const [dismissed, setDismissed] = useState(false);

  // Chỉ hiển thị banner nếu chưa được cấp quyền (permission === 'default'), chưa subscribe và chưa bị người dùng ẩn tạm thời
  if (
    permission !== 'default' ||
    isSubscribed ||
    dismissed ||
    typeof window === 'undefined' ||
    !('Notification' in window)
  ) {
    return null;
  }

  return (
    <div className="bg-warning/10 border-b border-warning/20 px-4 py-2.5 text-foreground text-sm flex items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="p-1.5 rounded-full bg-warning/20 text-warning flex-shrink-0">
          <Icon name="Bell" className="w-4 h-4" />
        </span>
        <p className="truncate">
          <strong className="font-semibold">Bật thông báo đẩy:</strong> Nhận ngay thông báo tin nhắn và tiến độ đơn hàng trên thiết bị này.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => subscribe()}
          disabled={isLoading}
          className="px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-md shadow-xs transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Đang kích hoạt...' : 'Bật thông báo'}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
          title="Ẩn thông báo"
          aria-label="Ẩn thông báo"
        >
          <Icon name="X" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
