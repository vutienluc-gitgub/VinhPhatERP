import { useState } from 'react';

import { Icon } from '@/shared/components/Icon';

import { useNotifications } from './useNotifications';
import { NotificationCenter } from './NotificationCenter';

export function NotificationBadge() {
  const { unreadCount, connectionWarning } = useNotifications();
  const [open, setOpen] = useState(false);

  const buttonAriaLabel =
    unreadCount > 0 ? `Thông báo (${unreadCount} chưa đọc)` : 'Thông báo';

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={buttonAriaLabel}
        aria-expanded={open}
        className={`portal-notif-btn relative ${
          connectionWarning ? 'text-warning' : ''
        }`}
      >
        <Icon name="Bell" size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 flex items-center justify-center text-[0.65rem] font-bold text-inverse-foreground bg-danger rounded-full ring-2 ring-[#0f1f3d] leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationCenter onClose={() => setOpen(false)} />}
    </div>
  );
}
