import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon, type IconName } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import type {
  OrderKanbanItem,
  OrderKanbanStatus,
} from '@/domain/orders/kanban.types';
import {
  getAllowedOrderTransitions,
  applyOrderTransition,
} from '@/domain/orders/OrderDomain';
import {
  ORDER_TRANSITION_LABELS,
  type OrderTransition,
} from '@/domain/orders/OrderStateMachine';

import { KANBAN_LABELS, isOrderOverdue } from './constants';

const TRANSITION_ICONS: Record<OrderTransition, IconName> = {
  approve: 'CircleCheck',
  confirm: 'CircleCheck',
  start_production: 'Layers',
  complete: 'CheckCheck',
  cancel: 'X',
  reject: 'X',
};

type KanbanCardProps = {
  item: OrderKanbanItem;
  onMove: (id: string, status: OrderKanbanStatus) => void;
  isMoving: boolean;
};

export function KanbanCard({ item, onMove, isMoving }: KanbanCardProps) {
  const navigate = useNavigate();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const isOverdue = isOrderOverdue(item);
  const transitions = getAllowedOrderTransitions(item.status);

  const deliveryLabel = item.delivery_date
    ? new Date(item.delivery_date).toLocaleDateString('vi-VN')
    : '—';

  const isInProgress = item.status === 'in_progress';

  function handleTransitionClick(t: OrderTransition) {
    if (t === 'cancel' || t === 'reject') {
      setConfirmCancel(true);
      return;
    }
    const nextStatus = applyOrderTransition(item.status, t);
    onMove(item.id, nextStatus as OrderKanbanStatus);
  }

  function handleConfirmCancel(t: OrderTransition) {
    const nextStatus = applyOrderTransition(item.status, t);
    setConfirmCancel(false);
    onMove(item.id, nextStatus as OrderKanbanStatus);
  }

  return (
    <div
      className={`kanban-card-premium ${isOverdue ? 'is-overdue' : ''} ${
        isInProgress ? 'border-info/40 bg-surface' : ''
      }`}
      onClick={() => navigate(`/orders/${item.id}`)}
      role="button"
      tabIndex={0}
      draggable={!isMoving}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders/${item.id}`)}
    >
      {/* Header */}
      <div className="kanban-card-header">
        <div className="flex items-center gap-1.5">
          <span className="kanban-card-title">{item.order_number}</span>
          {isMoving ? (
            <Icon
              name="Loader2"
              size={15}
              className="animate-spin text-primary"
            />
          ) : isInProgress ? (
            <Icon name="CircleDot" size={15} className="text-info" />
          ) : (
            <Icon name="Package" size={15} className="text-muted-foreground" />
          )}
        </div>
        {isOverdue && (
          <span className="kanban-card-tag flex items-center gap-1 text-danger bg-danger/10 border border-danger/20 rounded px-1.5 py-0.5 text-[0.7rem] font-bold">
            <Icon name="TriangleAlert" size={13} /> {KANBAN_LABELS.OVERDUE_TAG}
          </span>
        )}
      </div>

      {/* Customer Info */}
      <div>
        <div className="text-[0.82rem] font-bold text-foreground truncate">
          {item.customer_name}
        </div>
        {item.customer_code && (
          <span className="text-[0.7rem] text-muted-foreground">
            {item.customer_code}
          </span>
        )}
      </div>

      {/* Notes preview if available */}
      {item.notes && (
        <p className="text-[0.72rem] text-muted-foreground line-clamp-1 italic">
          {item.notes}
        </p>
      )}

      {/* Meta: Amount & Delivery */}
      <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/50">
        <div className="kanban-card-amount">
          <MoneyText value={item.total_amount} />
        </div>
        <div
          className={`text-[0.7rem] font-medium flex items-center gap-1 ${
            isOverdue ? 'text-danger font-bold' : 'text-muted-foreground'
          }`}
        >
          <Icon name="Calendar" size={13} /> {deliveryLabel}
        </div>
      </div>

      {/* Actions based on State Machine */}
      {transitions.length > 0 && (
        <div
          className="flex flex-col gap-1.5 pt-2 mt-1 border-t border-border"
          onClick={(e) => e.stopPropagation()}
        >
          {confirmCancel ? (
            <div className="bg-danger/10 border border-danger/30 rounded p-2 text-xs">
              <p className="text-danger font-bold mb-1.5">
                {KANBAN_LABELS.CONFIRM_CANCEL_TITLE}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary flex-1 py-1 text-xs"
                  onClick={() => setConfirmCancel(false)}
                >
                  {KANBAN_LABELS.CANCEL_BUTTON}
                </button>
                <button
                  type="button"
                  className="btn-danger flex-1 py-1 text-xs bg-danger text-inverse-foreground rounded hover:bg-danger/90"
                  onClick={() =>
                    handleConfirmCancel(
                      transitions.includes('reject') ? 'reject' : 'cancel',
                    )
                  }
                >
                  {KANBAN_LABELS.CONFIRM_BUTTON}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {transitions
                .filter((t) => t === 'cancel' || t === 'reject')
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    title={ORDER_TRANSITION_LABELS[t]}
                    className="p-1.5 rounded border border-border text-muted-foreground hover:text-danger hover:border-danger/40 transition-colors"
                    disabled={isMoving}
                    onClick={() => handleTransitionClick(t)}
                  >
                    <Icon name={TRANSITION_ICONS[t]} size={14} />
                  </button>
                ))}

              {transitions
                .filter((t) => t !== 'cancel' && t !== 'reject')
                .map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="btn-primary flex-1 justify-center gap-1.5 text-xs py-1.5 px-2"
                    disabled={isMoving}
                    onClick={() => handleTransitionClick(t)}
                  >
                    {isMoving ? (
                      <Icon
                        name="Loader2"
                        size={14}
                        className="animate-spin text-inverse-foreground"
                      />
                    ) : (
                      <>
                        <Icon name={TRANSITION_ICONS[t]} size={14} />
                        <span>{ORDER_TRANSITION_LABELS[t]}</span>
                      </>
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
