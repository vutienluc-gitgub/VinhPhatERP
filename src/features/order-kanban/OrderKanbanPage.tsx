import { useState, useMemo } from 'react';

import { Icon, type IconName } from '@/shared/components';

import { KanbanColumn } from './OrderKanbanList';
import type { OrderKanbanStatus } from './types';
import { useOrderKanban, useUpdateOrderStatus } from './useOrderKanban';

const COLUMNS: { status: OrderKanbanStatus; label: string; icon: IconName }[] =
  [
    {
      status: 'draft',
      label: 'Ban nhap',
      icon: 'Pencil',
    },
    {
      status: 'confirmed',
      label: 'Da xac nhan',
      icon: 'CheckCircle',
    },
    {
      status: 'delivering',
      label: 'Dang giao',
      icon: 'Truck',
    },
    {
      status: 'completed',
      label: 'Hoan thanh',
      icon: 'PartyPopper',
    },
  ];

export function OrderKanbanPage() {
  const { data: orders = [], isLoading, error } = useOrderKanban();
  const { mutate: moveOrder } = useUpdateOrderStatus();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.trim().toLowerCase();
    return orders.filter(
      (o) =>
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name.toLowerCase().includes(q),
    );
  }, [orders, search]);

  function handleMove(id: string, status: OrderKanbanStatus) {
    setMovingId(id);
    moveOrder(
      {
        id,
        status,
      },
      {
        onSettled: () => setMovingId(null),
      },
    );
  }

  const totalOrders = filtered.length;
  const overdueCount = filtered.filter(
    (o) =>
      o.delivery_date &&
      new Date(o.delivery_date) < new Date() &&
      o.status !== 'completed',
  ).length;

  return (
    <div className="panel-card card-flush">
      {/* Premium Header Area */}
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">BÁN HÀNG</p>
          <h3 className="title-premium">Tiến độ Đơn hàng</h3>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-muted mr-2">
            <span className="bg-surface px-2.5 py-1.5 rounded-md border border-border">
              {totalOrders} đơn hàng
            </span>
            {overdueCount > 0 && (
              <span className="text-danger flex items-center gap-1.5 bg-danger/10 px-2.5 py-1.5 rounded-md border border-danger/20">
                <Icon name="AlertTriangle" size={14} /> {overdueCount} quá hạn
              </span>
            )}
          </div>
          <div className="search-input-wrapper">
            <input
              className="field-input h-10 w-[260px]"
              placeholder="Tìm mã đơn, tên khách..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Icon name="Search" size={16} className="search-input-icon" />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4">
          <p className="error-inline">
            Loi tai du lieu: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Board — needs horizontal scroll */}
      <div className="kanban-board-premium">
        {isLoading
          ? COLUMNS.map((col) => (
              <div key={col.status} className="kanban-column-premium">
                <div className="kanban-column-header">
                  <div className="kanban-column-title">
                    <Icon name={col.icon} size={16} /> {col.label}
                  </div>
                </div>
                <div className="kanban-column-body">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-[100px] rounded-lg bg-surface-hover animate-pulse"
                    />
                  ))}
                </div>
              </div>
            ))
          : COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                icon={col.icon}
                items={filtered.filter((o) => o.status === col.status)}
                movingId={movingId}
                onMove={handleMove}
              />
            ))}
      </div>
    </div>
  );
}
