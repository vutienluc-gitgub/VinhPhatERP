import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '@/shared/components/Icon';
import { usePushSubscription } from '@/shared/hooks/usePushSubscription';

import { useNotifications } from './useNotifications';
import type { NotificationItem } from './types';

interface Props {
  onClose: () => void;
}

const TYPE_ICON_NAME: Record<
  NotificationItem['type'],
  'Package' | 'Building2' | 'Truck' | 'FileText'
> = {
  order_status: 'Package',
  order_progress: 'Building2',
  shipment: 'Truck',
  quotation: 'FileText',
};

export function NotificationCenter({ onClose }: Props) {
  const { items, markAllAsRead } = useNotifications();
  const { isSupported, isSubscribed, permission, isLoading, subscribe } =
    usePushSubscription();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  // Mark all read when opened
  useEffect(() => {
    markAllAsRead();
  }, [markAllAsRead]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  function handleItemClick(item: NotificationItem) {
    if (item.orderId) {
      navigate(`/portal/orders/${item.orderId}`);
    } else if (item.shipmentId) {
      navigate(`/portal/shipments/${item.shipmentId}`);
    } else if (item.quotationId) {
      navigate(`/portal/quotations/${item.quotationId}`);
    }
    onClose();
  }

  return (
    <div
      ref={panelRef}
      className="absolute top-[calc(100%+8px)] right-0 w-[calc(100vw-2rem)] sm:w-[320px] max-w-[320px] max-h-[400px] overflow-y-auto bg-[var(--surface-strong)] border border-border rounded-md shadow-[var(--shadow)] z-[100]"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-[0.875rem] font-semibold text-[var(--foreground)]">
          Thông báo
        </span>
        <button
          type="button"
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground p-1 leading-none rounded"
          aria-label="Đóng"
        >
          <Icon name="X" size={16} />
        </button>
      </div>

      {/* Web Push Prompt for Mobile / Desktop PWA */}
      {isSupported && !isSubscribed && permission !== 'denied' && (
        <div className="p-3 bg-primary/10 border-b border-border flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="BellRing" size={16} className="text-primary shrink-0" />
            <span className="text-[0.75rem] text-[var(--foreground)] font-medium truncate">
              Bật thông báo trên màn hình
            </span>
          </div>
          <button
            type="button"
            onClick={() => void subscribe()}
            disabled={isLoading}
            className="px-2.5 py-1 text-[0.7rem] font-semibold bg-primary text-white rounded-md shrink-0 border-none cursor-pointer hover:bg-primary/90 transition-colors"
          >
            {isLoading ? 'Đang bật...' : 'Bật ngay'}
          </button>
        </div>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <div className="py-8 px-4 text-center text-[0.875rem] text-muted-foreground">
          Không có thông báo nào
        </div>
      ) : (
        <ul className="list-none m-0 p-0">
          {items.map((item) => (
            <li
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`px-4 py-3 border-b border-border/50 ${item.orderId || item.shipmentId || item.quotationId ? 'cursor-pointer' : 'cursor-default'} ${item.isRead ? 'bg-transparent' : 'bg-primary/5'} transition-colors duration-150 flex gap-[0.625rem] items-start`}
            >
              <span className="shrink-0 mt-0.5 text-primary">
                <Icon name={TYPE_ICON_NAME[item.type] ?? 'Bell'} size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`m-0 text-[0.8rem] ${item.isRead ? 'font-normal' : 'font-semibold'} text-[var(--foreground)] whitespace-nowrap overflow-hidden text-ellipsis`}
                >
                  {item.title}
                </p>
                <p className="mt-[0.15rem] mb-0 text-[0.75rem] text-muted-foreground">
                  {item.body}
                </p>
                <p className="mt-[0.2rem] mb-0 text-[0.7rem] text-muted-foreground/70">
                  {new Date(item.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
