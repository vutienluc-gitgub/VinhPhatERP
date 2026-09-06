import { useState, useCallback, useMemo } from 'react';

import { usePortalOrders } from '@/application/crm/portal';
import type { PortalOrderItem } from '@/domain/portal/types';
import { ORDER_STATUS_LABELS } from '@/features/customer-portal/constants';
import {
  Button,
  Icon,
  EmptyState,
  ErrorInline,
  FilterChips,
} from '@/shared/components';

import { OrderCard } from './OrderCard';
import { OrderRequestModal } from './OrderRequestModal';
import { PORTAL_ORDERS_TEXT } from './orders.constants';

type FilterStatus =
  | 'ALL'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

const FILTER_OPTIONS: Array<{ id: FilterStatus; label: string }> = [
  { id: 'ALL', label: PORTAL_ORDERS_TEXT.LBL_ALL },
  { id: 'CONFIRMED', label: ORDER_STATUS_LABELS.confirmed },
  { id: 'IN_PROGRESS', label: ORDER_STATUS_LABELS.in_progress },
  { id: 'COMPLETED', label: ORDER_STATUS_LABELS.completed },
  { id: 'CANCELLED', label: ORDER_STATUS_LABELS.cancelled },
];

export function PortalOrdersPage() {
  const { orders, loading, error, page, setPage, PAGE_SIZE } =
    usePortalOrders();
  const [reorderItems, setReorderItems] = useState<PortalOrderItem[] | null>(
    null,
  );
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');

  const handleReorder = useCallback((items: PortalOrderItem[]) => {
    setReorderItems(items);
    setShowRequestModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowRequestModal(false);
    setReorderItems(null);
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'CONFIRMED') return order.status === 'confirmed';
      if (activeFilter === 'IN_PROGRESS') return order.status === 'in_progress';
      if (activeFilter === 'COMPLETED') return order.status === 'completed';
      if (activeFilter === 'CANCELLED') return order.status === 'cancelled';
      return true;
    });
  }, [orders, activeFilter]);

  if (loading)
    return (
      <div className="portal-section space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={`order-skeleton-${i}`}
            className="h-32 bg-surface animate-pulse rounded-lg border border-default"
          />
        ))}
      </div>
    );

  if (error)
    return (
      <ErrorInline>
        {PORTAL_ORDERS_TEXT.ERR_LOAD}: {error}
      </ErrorInline>
    );

  return (
    <div className="portal-section">
      <div className="flex items-center justify-between mb-4">
        <h1 className="portal-page-title mb-0">
          {PORTAL_ORDERS_TEXT.PAGE_TITLE}
        </h1>
        <Button variant="primary" onClick={() => setShowRequestModal(true)}>
          <Icon name="Plus" size={16} className="mr-1.5" />
          {PORTAL_ORDERS_TEXT.BTN_CREATE}
        </Button>
      </div>

      <FilterChips
        options={FILTER_OPTIONS}
        activeValue={activeFilter}
        onChange={(val) => setActiveFilter(val as FilterStatus)}
      />

      {filteredOrders.length === 0 ? (
        <EmptyState
          description={PORTAL_ORDERS_TEXT.EMPTY_DESC}
          icon="PackageOpen"
          actionLabel={PORTAL_ORDERS_TEXT.BTN_FIRST_ORDER}
          actionClick={() => setShowRequestModal(true)}
        />
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onReorder={handleReorder}
              />
            ))}
          </div>

          <div className="portal-pagination">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              {PORTAL_ORDERS_TEXT.BTN_PREV}
            </button>
            <span>
              {PORTAL_ORDERS_TEXT.LBL_PAGE_PREFIX} {page + 1}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={orders.length < PAGE_SIZE}
            >
              {PORTAL_ORDERS_TEXT.BTN_NEXT}
            </button>
          </div>
        </>
      )}

      {showRequestModal && (
        <OrderRequestModal
          onClose={handleCloseModal}
          initialItems={reorderItems ?? undefined}
        />
      )}
    </div>
  );
}
