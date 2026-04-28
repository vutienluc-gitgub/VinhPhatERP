import { useNavigate } from 'react-router-dom';

import { Icon, type IconName } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';

import { KANBAN_LABELS, isOrderOverdue } from './constants';
import type { OrderKanbanItem, OrderKanbanStatus } from './types';

const NEXT_STATUS: Partial<
  Record<
    OrderKanbanStatus,
    { label: string; icon: IconName; next: OrderKanbanStatus }
  >
> = {
  draft: {
    label: 'Xác nhận',
    icon: 'CircleCheck',
    next: 'confirmed',
  },
  confirmed: {
    label: 'Xuất kho',
    icon: 'Truck',
    next: 'delivering',
  },
  delivering: {
    label: 'Hoàn thành',
    icon: 'CheckCheck',
    next: 'completed',
  },
};

const PREV_STATUS: Partial<
  Record<
    OrderKanbanStatus,
    { label: string; icon: IconName; prev: OrderKanbanStatus }
  >
> = {
  confirmed: {
    label: 'Bản nháp',
    icon: 'ArrowLeft',
    prev: 'draft',
  },
  delivering: {
    label: 'Xác nhận',
    icon: 'ArrowLeft',
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

  const isOverdue = isOrderOverdue(item);

  const next = NEXT_STATUS[item.status];
  const prev = PREV_STATUS[item.status];

  const deliveryLabel = item.delivery_date
    ? new Date(item.delivery_date).toLocaleDateString('vi-VN')
    : '—';

  const isInProgress =
    item.status === 'confirmed' || item.status === 'delivering';

  return (
    <div
      className={`kanban-card-premium ${isOverdue ? 'is-overdue' : ''} ${isInProgress ? 'is-active' : ''}`}
      onClick={() => navigate(`/orders/${item.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders/${item.id}`)}
    >
      {/* Header */}
      <div className="kanban-card-header">
        <div className="flex items-center gap-1.5">
          <span className="kanban-card-title">{item.order_number}</span>
          {isMoving ? (
            <Icon
              name="Loader2"
              size={16}
              className="animate-spin text-primary"
            />
          ) : isInProgress ? (
            <Icon name="CircleDot" size={16} className="text-primary" />
          ) : (
            <Icon name="Package" size={16} className="text-muted" />
          )}
        </div>
        {isOverdue && (
          <span className="kanban-card-tag flex items-center gap-1">
            <Icon name="TriangleAlert" size={16} /> {KANBAN_LABELS.OVERDUE_TAG}
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
          {formatCurrency(item.total_amount)}đ
        </div>
        <div className="text-[0.7rem] text-muted font-medium flex items-center gap-1">
          <Icon name="Calendar" size={16} /> {deliveryLabel}
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
              className="btn-secondary flex-1 justify-center gap-1.5 text-xs py-1.5 px-2"
              disabled={isMoving}
              onClick={() => onMove(item.id, prev.prev)}
            >
              <Icon name={prev.icon} size={16} /> {prev.label}
            </button>
          )}
          {next && (
            <button
              type="button"
              className="btn-primary flex-1 justify-center gap-1.5 text-xs py-1.5 px-2"
              disabled={isMoving}
              onClick={() => onMove(item.id, next.next)}
            >
              {isMoving ? (
                <Icon name="Loader2" size={16} className="animate-spin" />
              ) : (
                <>
                  <Icon name={next.icon} size={16} /> {next.label}
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
