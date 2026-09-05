import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';

import { Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import { useOrderKanban, useUpdateOrderStatus } from '@/application/orders';
import type { OrderKanbanStatus } from '@/domain/orders/kanban.types';
import {
  getAllowedOrderTransitions,
  applyOrderTransition,
} from '@/domain/orders/OrderDomain';

import { KanbanColumn } from './OrderKanbanList';
import {
  KANBAN_COLUMNS,
  KANBAN_LABELS,
  isOrderOverdue,
  calculateTotalAmount,
  type KanbanColumnDef,
} from './constants';

export function OrderKanbanPage() {
  const { data: orders = [], isLoading, error } = useOrderKanban();
  const { mutate: moveOrder } = useUpdateOrderStatus();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);

  const columns = useMemo<KanbanColumnDef[]>(() => {
    if (showCancelled) {
      return [
        ...KANBAN_COLUMNS,
        {
          status: 'cancelled',
          label: KANBAN_LABELS.CANCELLED_COLUMN_LABEL,
          icon: 'XCircle',
          accentClass: 'border-danger/40 text-danger',
        },
      ];
    }
    return KANBAN_COLUMNS;
  }, [showCancelled]);

  const filtered = useMemo(() => {
    let result = orders;
    if (!showCancelled) {
      result = result.filter((o) => o.status !== 'cancelled');
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          (o.customer_code && o.customer_code.toLowerCase().includes(q)),
      );
    }
    if (showOverdueOnly) {
      result = result.filter(isOrderOverdue);
    }
    return result;
  }, [orders, search, showOverdueOnly, showCancelled]);

  function handleMove(id: string, nextStatus: OrderKanbanStatus) {
    setMovingId(id);
    const targetOrder = orders.find((o) => o.id === id);
    moveOrder(
      { id, status: nextStatus },
      {
        onSuccess: () => {
          toast.success(
            KANBAN_LABELS.STATUS_UPDATE_SUCCESS.replace(
              '{orderNumber}',
              targetOrder?.order_number ?? '',
            ),
          );
        },
        onError: (err) => {
          toast.error(
            KANBAN_LABELS.STATUS_UPDATE_ERROR.replace(
              '{error}',
              err instanceof Error ? err.message : String(err),
            ),
          );
        },
        onSettled: () => setMovingId(null),
      },
    );
  }

  function handleDropOrder(id: string, targetStatus: OrderKanbanStatus) {
    const targetOrder = orders.find((o) => o.id === id);
    if (!targetOrder || targetOrder.status === targetStatus) return;

    const allowedTransitions = getAllowedOrderTransitions(targetOrder.status);
    const validTransition = allowedTransitions.find(
      (t) => applyOrderTransition(targetOrder.status, t) === targetStatus,
    );

    if (validTransition) {
      handleMove(id, targetStatus);
    }
  }

  const totalOrders = filtered.length;
  const overdueCount = filtered.filter(isOrderOverdue).length;
  const totalPipelineAmount = calculateTotalAmount(filtered);

  return (
    <div className="page-container">
      <div className="panel-card card-flush">
        {/* Header Area */}
        <div className="card-header-area">
          <div className="flex items-center justify-between gap-4 flex-wrap w-full">
            {/* KPI Metrics Badges */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-muted-foreground">
              <span className="bg-surface px-3 py-1.5 rounded-lg border border-border flex items-center gap-1.5 text-foreground">
                <Icon name="Package" size={14} className="text-primary" />
                {totalOrders} {KANBAN_LABELS.ORDER_COUNT_SUFFIX}
              </span>

              <span className="bg-surface px-3 py-1.5 rounded-lg border border-border flex items-center gap-1.5 text-foreground">
                <Icon name="Coins" size={14} className="text-success" />
                <span>{KANBAN_LABELS.TOTAL_PIPELINE}:</span>
                <span className="text-success font-black">
                  <MoneyText value={totalPipelineAmount} />
                </span>
              </span>

              {overdueCount > 0 && (
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    showOverdueOnly
                      ? 'bg-danger text-inverse-foreground border-danger'
                      : 'text-danger bg-danger/10 border-danger/20 hover:bg-danger/20'
                  }`}
                  onClick={() => setShowOverdueOnly((v) => !v)}
                >
                  <Icon name="TriangleAlert" size={14} />
                  <span>
                    {overdueCount} {KANBAN_LABELS.OVERDUE_SUFFIX}
                  </span>
                </button>
              )}

              <button
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  showCancelled
                    ? 'bg-surface-selected text-primary border-primary/40'
                    : 'bg-surface text-muted-foreground border-border hover:bg-surface-hover'
                }`}
                onClick={() => setShowCancelled((v) => !v)}
              >
                <Icon name={showCancelled ? 'Eye' : 'EyeOff'} size={14} />
                <span>
                  {showCancelled
                    ? KANBAN_LABELS.HIDE_CANCELLED
                    : KANBAN_LABELS.SHOW_CANCELLED}
                </span>
              </button>
            </div>

            {/* Search Box */}
            <div className="search-input-wrapper w-full sm:w-auto">
              <input
                className="field-input h-9 w-full sm:w-[280px] pl-8 text-xs"
                placeholder={KANBAN_LABELS.SEARCH_PLACEHOLDER}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Icon
                name="Search"
                size={14}
                className="search-input-icon text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-4">
            <p className="error-inline">
              {KANBAN_LABELS.ERROR_PREFIX}{' '}
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        )}

        {/* Board */}
        <div className="relative">
          <div className="kanban-board-premium">
            {isLoading
              ? columns.map((col) => (
                  <div key={col.status} className="kanban-column-premium">
                    <div className="kanban-column-header">
                      <div className="kanban-column-title flex items-center gap-2">
                        <Icon name={col.icon} size={16} />
                        <span>{col.label}</span>
                      </div>
                    </div>
                    <div className="kanban-column-body space-y-2 pt-2">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className="h-[120px] rounded-lg bg-surface-hover animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                ))
              : columns.map((col) => (
                  <KanbanColumn
                    key={col.status}
                    status={col.status}
                    label={col.label}
                    icon={col.icon}
                    accentClass={col.accentClass}
                    items={filtered.filter((o) => o.status === col.status)}
                    movingId={movingId}
                    onMove={handleMove}
                    onDropOrder={handleDropOrder}
                  />
                ))}
          </div>
          {/* Subtle scroll indicator */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-surface to-transparent" />
        </div>
      </div>
    </div>
  );
}
