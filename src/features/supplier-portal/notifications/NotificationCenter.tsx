import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { Icon } from '@/shared/components/Icon';

import { useNotifications } from './useNotifications';
import type { NotificationItem } from './types';

dayjs.extend(relativeTime);

export interface NotificationCenterProps {
  supplierId?: string;
}

const TYPE_ICON: Record<NotificationItem['type'], string> = {
  purchase_order: '📦',
  rfq: '📄',
  debt: '💰',
};

export function NotificationCenter({ supplierId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    isConnectionWarning,
    markAsRead,
    clearAll,
  } = useNotifications(supplierId);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotificationClick = (item: NotificationItem) => {
    setIsOpen(false);
    if (item.type === 'purchase_order' && item.referenceId) {
      navigate(`/portal/supplier/orders`);
    } else if (item.type === 'rfq' && item.referenceId) {
      navigate(`/portal/supplier/quotations`);
    }
  };

  const hasNotifications = notifications.length > 0;

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
      }}
      ref={panelRef}
    >
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label={`Thông báo${unreadCount > 0 ? ` (${unreadCount} chưa đọc)` : ''}`}
        className="relative bg-transparent border-none cursor-pointer p-1 text-muted-foreground hover:text-foreground text-lg leading-none"
        style={{ color: isConnectionWarning ? 'var(--warning)' : 'inherit' }}
      >
        <Icon name="Bell" className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white rounded-full text-[0.65rem] font-bold min-w-[16px] h-[16px] flex items-center justify-center px-[3px] leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] right-0 w-[calc(100vw-2rem)] sm:w-[360px] max-w-[360px] max-h-[420px] overflow-y-auto bg-surface border border-default rounded-xl shadow-lg z-[100] flex flex-col">
          <div className="px-4 py-3 border-b border-default bg-surface-secondary flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">
                Thông báo
              </span>
              {unreadCount > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                  {unreadCount} mới
                </span>
              )}
            </div>

            {hasNotifications && (
              <div className="flex items-center gap-1">
                <button
                  onClick={markAsRead}
                  title="Đánh dấu đã đọc"
                  className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground p-1"
                >
                  <Icon name="Check" className="w-4 h-4" />
                </button>
                <button
                  onClick={clearAll}
                  title="Xóa tất cả"
                  className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-danger p-1"
                >
                  <Icon name="Trash2" className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {isConnectionWarning && (
            <div className="px-4 py-2 bg-warning-soft text-warning text-xs flex items-center gap-2 border-b border-warning/20 shrink-0">
              <Icon name="AlertCircle" className="w-3 h-3 shrink-0" />
              <span>
                Mất kết nối realtime. Vui lòng tải lại trang nếu không nhận được
                thông báo mới.
              </span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto overscroll-contain">
            {!hasNotifications ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Icon name="Bell" className="w-10 h-10 text-muted/30 mb-3" />
                <p className="text-sm text-muted">
                  Bạn không có thông báo nào.
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`flex gap-3 px-4 py-3 border-b border-default last:border-0 cursor-pointer transition-colors ${
                      item.isRead
                        ? 'bg-surface hover:bg-surface-secondary'
                        : 'bg-info-soft hover:bg-info/10'
                    }`}
                  >
                    <span className="text-base shrink-0 mt-[1px]">
                      {TYPE_ICON[item.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`m-0 text-sm leading-tight mb-1 ${item.isRead ? 'text-foreground font-medium' : 'text-info font-semibold'}`}
                      >
                        {item.title}
                      </p>
                      <p className="m-0 text-xs text-muted leading-relaxed line-clamp-2">
                        {item.body}
                      </p>
                      <p className="m-0 mt-2 text-[10px] text-muted-foreground">
                        {dayjs(item.createdAt).fromNow()}
                      </p>
                    </div>
                    {!item.isRead && (
                      <div className="w-2 h-2 rounded-full bg-info flex-shrink-0 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
