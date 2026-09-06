import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { PortalOrder, PortalOrderItem } from '@/domain/portal/types';
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_BADGE,
  TIMELINE_STEPS,
} from '@/features/customer-portal/constants';
import { Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';

import {
  getPaymentBadge,
  getStepStates,
  getMobileStatusLabel,
  calculateProgressPercent,
} from './order-utils';
import { PORTAL_ORDERS_TEXT, MAX_PREVIEW_ITEMS } from './orders.constants';

function CheckIcon() {
  return <Icon name="Check" strokeWidth={3} size={16} />;
}

function HorizontalStepper({ order }: { order: PortalOrder }) {
  const { steps } = getStepStates(order);
  if (steps.length === 0) return null;

  const progressPercent = calculateProgressPercent(steps);

  return (
    <div>
      <div className="portal-stepper-mobile-status">
        {PORTAL_ORDERS_TEXT.LABEL_PROGRESS} {getMobileStatusLabel(order)}
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
    <div className="flex flex-col gap-1.5">
      {visibleItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-2 text-xs sm:text-sm py-1.5 border-b border-dashed border-border last:border-none"
        >
          <div className="flex items-center gap-1.5 min-w-0 text-foreground">
            <span className="font-medium truncate max-w-[140px] sm:max-w-[200px]">
              {item.fabric_name}
            </span>
            {item.color && (
              <span className="text-muted-foreground shrink-0">
                - {item.color}
              </span>
            )}
          </div>
          <span className="font-semibold text-foreground whitespace-nowrap shrink-0">
            x{item.quantity}
          </span>
        </div>
      ))}
      {hiddenCount > 0 && (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 py-1 transition-colors cursor-pointer w-fit"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded
            ? PORTAL_ORDERS_TEXT.BTN_COLLAPSE
            : PORTAL_ORDERS_TEXT.BTN_EXPAND.replace(
                '{0}',
                hiddenCount.toString(),
              )}
          <Icon name={expanded ? 'ChevronUp' : 'ChevronDown'} size={14} />
        </button>
      )}
    </div>
  );
}

export interface OrderCardProps {
  order: PortalOrder;
  onReorder: (items: PortalOrderItem[]) => void;
}

export function OrderCard({ order, onReorder }: OrderCardProps) {
  const isCancelled = order.status === 'cancelled';
  const paymentBadge = getPaymentBadge(order);
  const items = order.items ?? [];

  return (
    <div
      className={
        isCancelled
          ? 'portal-card bg-surface-subtle/50 opacity-75'
          : 'portal-card transition-all duration-150 hover:shadow-md hover:-translate-y-0.5'
      }
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <Link
            to={`/portal/orders/${order.id}`}
            className="font-bold text-sm text-foreground hover:text-primary transition-colors"
          >
            #{order.order_number}
          </Link>
          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>{order.order_date}</span>
            <span>·</span>
            <span>
              {items.length} {PORTAL_ORDERS_TEXT.LBL_PRODUCTS}
            </span>
          </div>
        </div>
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 shrink-0 w-full sm:w-auto">
          <span className="font-bold text-base sm:text-lg text-foreground whitespace-nowrap">
            <MoneyText value={order.total_amount} suffix=" ₫" />
          </span>
          <div className="flex gap-1.5 flex-wrap justify-end">
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
      <div className="p-3.5 sm:p-5 flex flex-col gap-3.5">
        {/* Product list (collapsible) */}
        {items.length > 0 && <ProductList items={items} />}

        {/* Timeline or cancelled notice */}
        {isCancelled ? (
          <div className="portal-cancelled-notice">
            <Icon name="XCircle" size={18} />
            {PORTAL_ORDERS_TEXT.LABEL_CANCELLED}
          </div>
        ) : (
          <HorizontalStepper order={order} />
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 sm:px-5 border-t border-border flex items-center justify-end gap-2 bg-surface-subtle">
        {!isCancelled && items.length > 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer"
            onClick={() => onReorder(items)}
          >
            <Icon name="RefreshCw" size={14} />
            {PORTAL_ORDERS_TEXT.BTN_REORDER}
          </button>
        )}
        <Link
          to={`/portal/orders/${order.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
        >
          <Icon name="FileText" size={14} />
          {PORTAL_ORDERS_TEXT.BTN_DETAIL}
        </Link>
      </div>
    </div>
  );
}
