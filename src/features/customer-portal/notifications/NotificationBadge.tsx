import { useState } from 'react';

import { useNotifications } from './useNotifications';
import { NotificationCenter } from './NotificationCenter';

export function NotificationBadge() {
  const { unreadCount, connectionWarning } = useNotifications();
  const [open, setOpen] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.25rem',
          position: 'relative',
          color: connectionWarning ? 'var(--warning)' : 'var(--muted)',
          fontSize: '1.1rem',
          lineHeight: 1,
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-4px',
              background: 'var(--danger)',
              color: '#fff',
              borderRadius: '999px',
              fontSize: '0.65rem',
              fontWeight: 700,
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              lineHeight: 1,
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && <NotificationCenter onClose={() => setOpen(false)} />}
    </div>
  );
}
