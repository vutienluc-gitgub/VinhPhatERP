import { useNavigate } from 'react-router-dom';

import { Icon } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';

import type { OrderKanbanItem, OrderKanbanStatus } from './types';

const NEXT_STATUS: Partial<
  Record<OrderKanbanStatus, { label: string; next: OrderKanbanStatus }>
> = {
  draft: {
    label: '✓ Xác nhận',
    next: 'confirmed',
  },
  confirmed: {
    label: '🚚 Xuất kho',
    next: 'delivering',
  },
  delivering: {
    label: '✅ Hoàn thành',
    next: 'completed',
  },
};

const PREV_STATUS: Partial<
  Record<OrderKanbanStatus, { label: string; prev: OrderKanbanStatus }>
> = {
  confirmed: {
    label: '← Draft',
    prev: 'draft',
  },
  delivering: {
    label: '← Confirmed',
    prev: 'confirmed',
  },
};

type KanbanCardProps = {
  item: OrderKanbanItem;
  onMove: (id: string, status: OrderKanbanStatus) => void;
  isMoving: boolean;
};

export function KanbanCard({ item, onMove, isMoving }: KanbanCardProps) {
  const navigate = useNavigate();

  const isOverdue =
    item.delivery_date &&
    new Date(item.delivery_date) < new Date() &&
    item.status !== 'completed';

  const next = NEXT_STATUS[item.status];
  const prev = PREV_STATUS[item.status];

  const deliveryLabel = item.delivery_date
    ? new Date(item.delivery_date).toLocaleDateString('vi-VN')
    : '—';

  const isInProgress =
    item.status === 'confirmed' || item.status === 'delivering';

  return (
    <div
      className={`kanban-card-premium ${isOverdue ? 'is-overdue border-l-4 border-danger' : ''} ${isInProgress ? 'is-active' : ''}`}
      onClick={() => navigate(`/orders/${item.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders/${item.id}`)}
    >
      {/* Header */}
      <div className="kanban-card-header">
        <div className="flex items-center gap-1.5">
          <span className="kanban-card-title">{item.order_number}</span>
          {isInProgress ? (
            <Icon
              name="Loader2"
              size={14}
              className="animate-spin text-primary"
            />
          ) : (
            <Icon name="Package" size={14} className="text-muted" />
          )}
        </div>
        {isOverdue && (
          <span className="kanban-card-tag flex items-center gap-1">
            <Icon name="AlertTriangle" size={10} /> Quá hạn
          </span>
        )}
      </div>

      {/* Customer */}
      <div className="text-[0.82rem] font-bold text-text truncate">
        {item.customer_name}
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between mt-0.5">
        <div className="kanban-card-amount">
          {formatCurrency(item.total_amount)} d
        </div>
        <div className="text-[0.7rem] text-muted font-medium flex items-center gap-1">
          <Icon name="Calendar" size={12} /> {deliveryLabel}
        </div>
      </div>

      {/* Actions */}
      {(next || prev) && (
        <div
          className="flex gap-2 pt-3 mt-1 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {prev && (
            <button
              type="button"
              className="btn-secondary flex-1 justify-center text-danger"
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.5rem',
              }}
              disabled={isMoving}
              onClick={() => onMove(item.id, prev.prev)}
            >
              {prev.label}
            </button>
          )}
          {next && (
            <button
              type="button"
              className="btn-primary flex-1 justify-center"
              style={{
                fontSize: '0.75rem',
                padding: '0.35rem 0.5rem',
              }}
              disabled={isMoving}
              onClick={() => onMove(item.id, next.next)}
            >
              {isMoving ? (
                <Icon name="Loader2" size={14} className="animate-spin" />
              ) : (
                next.label
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
