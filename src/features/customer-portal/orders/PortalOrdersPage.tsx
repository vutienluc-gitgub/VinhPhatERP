import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { usePortalOrders } from '@/application/crm/portal';
import { MoneyText } from '@/shared/value';
import {
  Button,
  Icon,
  EmptyState,
  ErrorInline,
  FilterChips,
} from '@/shared/components';
import type { PortalOrder, PortalOrderItem } from '@/domain/portal/types';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE,
  TIMELINE_STEPS,
} from '@/features/customer-portal/constants';

import { OrderRequestModal } from './OrderRequestModal';
import {
  getPaymentBadge,
  getStepStates,
  getMobileStatusLabel,
} from './order-utils';

const TEXT = {
  PAGE_TITLE: 'Đơn hàng',
  BTN_CREATE: 'Tạo yêu cầu',
  EMPTY_DESC: 'Chưa có đơn hàng nào.',
  BTN_FIRST_ORDER: 'Tạo yêu cầu đầu tiên',
  ERR_LOAD: 'Lỗi tải dữ liệu',
  BTN_PREV: '« Trước',
  BTN_NEXT: 'Tiếp »',
  BTN_REORDER: 'Đặt lại',
  BTN_DETAIL: 'Chi tiết',
  LABEL_CANCELLED: 'Đơn hàng đã bị hủy',
  LABEL_PROGRESS: 'Tiến độ:',
  BTN_EXPAND: '+ {0} sản phẩm khác',
  BTN_COLLAPSE: 'Thu gọn',
  LBL_PRODUCTS: 'sản phẩm',
};

const MAX_PREVIEW_ITEMS = 2;

type FilterStatus =
  | 'ALL'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

/* ── Sub-components ── */

function CheckIcon() {
  return <Icon name="Check" strokeWidth={3} size={16} />;
}

function HorizontalStepper({ order }: { order: PortalOrder }) {
  const { steps } = getStepStates(order);
  if (steps.length === 0) return null;

  // Calculate progress line width
  const lastCompleted = steps.lastIndexOf('completed');
  const activeIdx = steps.indexOf('active');
  const furthest = activeIdx >= 0 ? activeIdx : lastCompleted;
  const progressPercent =
    furthest >= 0 ? (furthest / (steps.length - 1)) * 100 : 0;

  return (
    <div>
      <div className="portal-stepper-mobile-status">
        {TEXT.LABEL_PROGRESS} {getMobileStatusLabel(order)}
      </div>
      <div className="portal-stepper">
        <div
          className="portal-stepper-progress"
          style={{
            width: `${progressPercent * 0.8}%`,
          }}
        />
        {TIMELINE_STEPS.map((step, idx) => {
          const state = steps[idx];
          const stepClass = [
            'portal-stepper-step',
            state === 'completed' ? 'portal-stepper-step--completed' : '',
            state === 'active' ? 'portal-stepper-step--active' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const dotClass = [
            'portal-stepper-dot',
            state === 'completed' ? 'portal-stepper-dot--completed' : '',
            state === 'active' ? 'portal-stepper-dot--active' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={step.key} className={stepClass}>
              <div className={dotClass}>
                {state === 'completed' && <CheckIcon />}
                {state === 'active' && (
                  <Icon name="Circle" size={12} fill="currentColor" />
                )}
              </div>
              <span className="portal-stepper-label">{step.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProductList({ items }: { items: PortalOrderItem[] }) {
  const [expanded, setExpanded] = useState(false);

  if (items.length === 0) return null;

  const visibleItems = expanded ? items : items.slice(0, MAX_PREVIEW_ITEMS);
  const hiddenCount = items.length - MAX_PREVIEW_ITEMS;

  return (
    <div className="portal-product-list">
      {visibleItems.map((item) => (
        <div key={item.id} className="portal-product-item">
          <div className="portal-product-info">
            <span className="portal-product-fabric">{item.fabric_name}</span>
            {item.color && (
              <span className="portal-product-color">- {item.color}</span>
            )}
          </div>
          <span className="portal-product-qty">x{item.quantity}</span>
        </div>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          className="portal-items-toggle"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded
            ? TEXT.BTN_COLLAPSE
            : TEXT.BTN_EXPAND.replace('{0}', hiddenCount.toString())}
          <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={14} />
        </button>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onReorder,
}: {
  order: PortalOrder;
  onReorder: (items: PortalOrderItem[]) => void;
}) {
  const isCancelled = order.status === 'cancelled';
  const paymentBadge = getPaymentBadge(order);
  const items = order.items ?? [];

  const cardClass = [
    'portal-order-card-premium',
    isCancelled ? 'portal-order-card-premium--cancelled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClass}>
      {/* Header */}
      <div className="portal-card-premium-header">
        <div className="portal-card-premium-header-left">
          <Link
            to={`/portal/orders/${order.id}`}
            className="portal-card-premium-order-number"
          >
            #{order.order_number}
          </Link>
          <div className="portal-card-premium-meta">
            <span>{order.order_date}</span>
            <span>·</span>
            <span>
              {items.length} {TEXT.LBL_PRODUCTS}
            </span>
          </div>
        </div>
        <div className="portal-card-premium-header-right">
          <span className="portal-card-premium-amount">
            <MoneyText value={order.total_amount} suffix=" ₫" />
          </span>
          <div className="portal-card-premium-badges">
            <span
              className={ORDER_STATUS_BADGE[order.status] ?? 'portal-badge'}
            >
              {ORDER_STATUS_LABELS[order.status] ?? order.status}
            </span>
            {!isCancelled && (
              <span className={paymentBadge.className}>
                {paymentBadge.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="portal-card-premium-body">
        {/* Product list (collapsible) */}
        {items.length > 0 && <ProductList items={items} />}

        {/* Timeline or cancelled notice */}
        {isCancelled ? (
          <div className="portal-cancelled-notice">
            <Icon name="XCircle" size={18} />
            {TEXT.LABEL_CANCELLED}
          </div>
        ) : (
          <HorizontalStepper order={order} />
        )}
      </div>

      {/* Footer */}
      <div className="portal-card-premium-footer">
        {!isCancelled && items.length > 0 && (
          <button
            type="button"
            className="portal-btn-reorder"
            onClick={() => onReorder(items)}
          >
            <Icon name="RefreshCw" size={14} />
            {TEXT.BTN_REORDER}
          </button>
        )}
        <Link to={`/portal/orders/${order.id}`} className="portal-btn-detail">
          <Icon name="FileText" size={14} />
          {TEXT.BTN_DETAIL}
        </Link>
      </div>
    </div>
  );
}

/* ── Main page ── */

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

  const filteredOrders = orders.filter((o) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'CONFIRMED') return o.status === 'confirmed';
    if (activeFilter === 'IN_PROGRESS') return o.status === 'in_progress';
    if (activeFilter === 'COMPLETED') return o.status === 'completed';
    if (activeFilter === 'CANCELLED') return o.status === 'cancelled';
    return true;
  });

  const filterOptions: Array<{ id: FilterStatus; label: string }> = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'CONFIRMED', label: ORDER_STATUS_LABELS.confirmed },
    { id: 'IN_PROGRESS', label: ORDER_STATUS_LABELS.in_progress },
    { id: 'COMPLETED', label: ORDER_STATUS_LABELS.completed },
    { id: 'CANCELLED', label: ORDER_STATUS_LABELS.cancelled },
  ];

  if (loading)
    return (
      <div className="portal-section space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-surface animate-pulse rounded-lg border border-default"
          />
        ))}
      </div>
    );

  if (error)
    return (
      <ErrorInline>
        {TEXT.ERR_LOAD}: {String(error)}
      </ErrorInline>
    );

  return (
    <div className="portal-section">
      <div className="flex items-center justify-between mb-4">
        <h1 className="portal-page-title mb-0">{TEXT.PAGE_TITLE}</h1>
        <Button variant="primary" onClick={() => setShowRequestModal(true)}>
          <Icon name="Plus" size={16} className="mr-1.5" />
          {TEXT.BTN_CREATE}
        </Button>
      </div>

      <FilterChips
        options={filterOptions}
        activeValue={activeFilter}
        onChange={(val) => setActiveFilter(val as FilterStatus)}
      />

      {filteredOrders.length === 0 ? (
        <EmptyState
          description={TEXT.EMPTY_DESC}
          icon="PackageOpen"
          actionLabel={TEXT.BTN_FIRST_ORDER}
          actionClick={() => setShowRequestModal(true)}
        />
      ) : (
        <>
          <div className="portal-order-card-list">
            {filteredOrders.map((o) => (
              <OrderCard key={o.id} order={o} onReorder={handleReorder} />
            ))}
          </div>

          <div className="portal-pagination">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              {TEXT.BTN_PREV}
            </button>
            <span>Trang {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={orders.length < PAGE_SIZE}
            >
              {TEXT.BTN_NEXT}
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
