import { useState, useMemo } from 'react';

import { Icon, type IconName } from '@/shared/components';
import { useOrderKanban, useUpdateOrderStatus } from '@/application/orders';

import { KanbanColumn } from './OrderKanbanList';
import type { OrderKanbanStatus } from './types';

const COLUMNS: { status: OrderKanbanStatus; label: string; icon: IconName }[] =
  [
    {
      status: 'draft',
      label: 'Bản nháp',
      icon: 'Pencil',
    },
    {
      status: 'confirmed',
      label: 'Đã xác nhận',
      icon: 'CircleCheck',
    },
    {
      status: 'delivering',
      label: 'Đang giao',
      icon: 'Truck',
    },
    {
      status: 'completed',
      label: 'Hoàn thành',
      icon: 'PartyPopper',
    },
  ];

export function OrderKanbanPage() {
  const { data: orders = [], isLoading, error } = useOrderKanban();
  const { mutate: moveOrder } = useUpdateOrderStatus();
  const [movingId, setMovingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const filtered = useMemo(() => {
    let result = orders;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q),
      );
    }
    if (showOverdueOnly) {
      result = result.filter(
        (o) =>
          o.delivery_date &&
          new Date(o.delivery_date) < new Date() &&
          o.status !== 'completed',
      );
    }
    return result;
  }, [orders, search, showOverdueOnly]);

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
            <span className="bg-surface px-2.5 py-1.5 rounded border border-border">
              {totalOrders} đơn hàng
            </span>
            {overdueCount > 0 && (
              <button
                type="button"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-bold transition-colors ${
                  showOverdueOnly
                    ? 'bg-danger text-white border-danger'
                    : 'text-danger bg-danger/10 border-danger/20 hover:bg-danger/20'
                }`}
                onClick={() => setShowOverdueOnly((v) => !v)}
              >
                <Icon name="TriangleAlert" size={16} /> {overdueCount} quá hạn
              </button>
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
            Lỗi tải dữ liệu: {(error as Error).message}
          </p>
        </div>
      )}

      {/* Board — horizontal scroll with fade indicator */}
      <div className="relative">
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
        {/* Scroll indicator */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-surface to-transparent" />
      </div>
    </div>
  );
}
