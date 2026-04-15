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
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: '320px',
        maxHeight: '400px',
        overflowY: 'auto',
        background: 'var(--surface-strong)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow)',
        zIndex: 100,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text)',
          }}
        >
          Thông báo
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--muted)',
            fontSize: '1rem',
            padding: 0,
            lineHeight: 1,
          }}
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--muted)',
          }}
        >
          Không có thông báo nào
        </div>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {items.map((item) => (
            <li
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                padding: '0.75rem 1rem',
                borderBottom: '1px solid rgba(16,35,61,0.05)',
                cursor:
                  item.orderId || item.shipmentId || item.quotationId
                    ? 'pointer'
                    : 'default',
                background: item.isRead
                  ? 'transparent'
                  : 'rgba(11,107,203,0.04)',
                transition: 'background 0.15s',
                display: 'flex',
                gap: '0.625rem',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  fontSize: '1rem',
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                {TYPE_ICON[item.type]}
              </span>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.8rem',
                    fontWeight: item.isRead ? 400 : 600,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.title}
                </p>
                <p
                  style={{
                    margin: '0.15rem 0 0',
                    fontSize: '0.75rem',
                    color: 'var(--muted)',
                  }}
                >
                  {item.body}
                </p>
                <p
                  style={{
                    margin: '0.2rem 0 0',
                    fontSize: '0.7rem',
                    color: 'var(--muted)',
                    opacity: 0.7,
                  }}
                >
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
