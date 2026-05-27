import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';

import { usePortalOrders } from '@/application/crm/portal';
import { formatCurrency } from '@/shared/utils/format';
import { Button, Icon } from '@/shared/components';
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

const MAX_PREVIEW_ITEMS = 2;

/* ── Sub-components ── */

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
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
        Tiến độ: {getMobileStatusLabel(order)}
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
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="5" />
                  </svg>
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
          {expanded ? 'Thu gọn' : `+ ${hiddenCount} sản phẩm khác`}
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
            <span>{items.length} sản phẩm</span>
          </div>
        </div>
        <div className="portal-card-premium-header-right">
          <span className="portal-card-premium-amount">
            {formatCurrency(order.total_amount)} ₫
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
            Đơn hàng đã bị hủy
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
            Đặt lại
          </button>
        )}
        <Link to={`/portal/orders/${order.id}`} className="portal-btn-detail">
          <Icon name="FileText" size={14} />
          Chi tiết
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

  const handleReorder = useCallback((items: PortalOrderItem[]) => {
    setReorderItems(items);
    setShowRequestModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowRequestModal(false);
    setReorderItems(null);
  }, []);

  if (loading)
    return (
      <div className="portal-loading">
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ animation: 'spin 1s linear infinite' }}
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        Đang tải…
      </div>
    );

  if (error) return <div className="portal-error">{error}</div>;

  return (
    <div className="portal-section">
      <div className="flex items-center justify-between mb-4">
        <h1 className="portal-page-title mb-0">Đơn hàng</h1>
        <Button variant="primary" onClick={() => setShowRequestModal(true)}>
          <Icon name="Plus" size={16} className="mr-1.5" />
          Tạo yêu cầu
        </Button>
      </div>

      {orders.length === 0 ? (
        <div className="portal-table-wrap">
          <div className="portal-empty">
            <div className="portal-empty-icon">
              <svg
                width="40"
                height="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="mb-4">Chưa có đơn hàng nào.</p>
            <Button variant="outline" onClick={() => setShowRequestModal(true)}>
              Tạo yêu cầu đầu tiên
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="portal-order-card-list">
            {orders.map((o) => (
              <OrderCard key={o.id} order={o} onReorder={handleReorder} />
            ))}
          </div>

          <div className="portal-pagination">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              &laquo; Trước
            </button>
            <span>Trang {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={orders.length < PAGE_SIZE}
            >
              Tiếp &raquo;
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
