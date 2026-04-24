import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useNotifications } from './useNotifications';
import type { NotificationItem } from './types';

interface Props {
  onClose: () => void;
}

const TYPE_ICON: Record<NotificationItem['type'], string> = {
  order_status: '📦',
  order_progress: '🏭',
  shipment: '🚚',
  quotation: '📄',
};

export function NotificationCenter({ onClose }: Props) {
  const { items, markAllAsRead } = useNotifications();
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
        <span className="text-[0.875rem] font-semibold text-[var(--text)]">
          Thông báo
        </span>
        <button
          onClick={onClose}
          className="bg-transparent border-none cursor-pointer text-muted-foreground text-base p-0 leading-none"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

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
              className={`px-4 py-3 border-b border-[#10233d]/5 ${item.orderId || item.shipmentId || item.quotationId ? 'cursor-pointer' : 'cursor-default'} ${item.isRead ? 'bg-transparent' : 'bg-[#0b6bcb]/5'} transition-colors duration-150 flex gap-[0.625rem] items-start`}
            >
              <span className="text-base shrink-0 mt-[1px]">
                {TYPE_ICON[item.type]}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`m-0 text-[0.8rem] ${item.isRead ? 'font-normal' : 'font-semibold'} text-[var(--text)] whitespace-nowrap overflow-hidden text-ellipsis`}
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
