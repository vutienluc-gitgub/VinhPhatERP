import { useState, useMemo } from 'react';

import { SearchInput } from '@/shared/components/SearchInput';

import styles from './kanban.module.css';
import { KanbanColumn } from './OrderKanbanList';
import type { OrderKanbanStatus } from './types';
import { useOrderKanban, useUpdateOrderStatus } from './useOrderKanban';

const COLUMNS: { status: OrderKanbanStatus; label: string; emoji: string }[] = [
  {
    status: 'draft',
    label: 'Bản nháp',
    emoji: '📝',
  },
  {
    status: 'confirmed',
    label: 'Đã xác nhận',
    emoji: '✅',
  },
  {
    status: 'delivering',
    label: 'Đang giao',
    emoji: '🚚',
  },
  {
    status: 'completed',
    label: 'Hoàn thành',
    emoji: '🎉',
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
    <div className={styles['kanban-page']}>
      {/* Header bar */}
      <div className={styles['kanban-header']}>
        <div className={styles['kanban-filter-group']}>
          <SearchInput
            className={styles['kanban-search']}
            placeholder="Tìm mã đơn, tên khách..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className={styles['kanban-stat']}>
            {totalOrders} đơn hàng
            {overdueCount > 0 && (
              <span
                style={{
                  color: 'var(--danger)',
                  marginLeft: '0.5rem',
                }}
              >
                · ⚠ {overdueCount} quá hạn
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p
          style={{
            color: 'var(--danger)',
            padding: '1rem',
          }}
        >
          Lỗi tải dữ liệu: {(error as Error).message}
        </p>
      )}

      {/* Board — needs horizontal scroll, cannot be inside overflow:clip */}
      <div className={styles['kanban-board']}>
        {isLoading
          ? COLUMNS.map((col) => (
              <div key={col.status} className={styles['kanban-col']}>
                <div className={styles['kanban-col-header']}>
                  <div className={styles['kanban-col-title']}>
                    {col.emoji} {col.label}
                  </div>
                </div>
                <div className={styles['kanban-col-body']}>
                  {[1, 2, 3].map((n) => (
                    <div key={n} className={styles['kanban-skeleton']} />
                  ))}
                </div>
              </div>
            ))
          : COLUMNS.map((col) => (
              <KanbanColumn
                key={col.status}
                status={col.status}
                label={col.label}
                emoji={col.emoji}
                items={filtered.filter((o) => o.status === col.status)}
                movingId={movingId}
                onMove={handleMove}
              />
            ))}
      </div>
    </div>
  );
}
