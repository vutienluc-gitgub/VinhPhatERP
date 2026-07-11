import { Link } from 'react-router-dom';

import { Icon } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import {
  DASHBOARD_LABELS,
  ORDER_STATUS_LABELS,
} from '@/shared/constants/ui.constants';
import type { RecentOrder } from '@/application/analytics';

type RecentOrdersCardProps = {
  orders: RecentOrder[];
  isLoading: boolean;
};

const STATUS_CSS: Record<string, string> = {
  draft: 'draft',
  pending_review: 'reserved',
  sent: 'reserved',
  confirmed: 'reserved',
  in_progress: 'in_process',
  completed: 'completed',
  cancelled: 'cancelled',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
}

export function RecentOrdersCard({ orders, isLoading }: RecentOrdersCardProps) {
  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="card-header-row">
          <h3 className="text-lg font-bold m-0">
            {DASHBOARD_LABELS.RECENT_ORDERS_TITLE}
          </h3>
          <Link to="/orders" className="card-action-link">
            {DASHBOARD_LABELS.VIEW_ALL} <Icon name="ChevronRight" size={16} />
          </Link>
        </div>
      </div>

      <div className="pt-2">
        {isLoading ? (
          <div className="px-5 py-3 flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-block h-[56px] rounded-lg" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="px-2 py-6 text-center text-muted text-sm">
            {DASHBOARD_LABELS.RECENT_ORDERS_EMPTY}
          </p>
        ) : (
          <div className="flex flex-col">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex flex-col items-stretch gap-1 px-5 py-[0.7rem] border-b border-border text-sm text-text no-underline transition-colors hover:bg-brand/5 last:border-none rounded-sm"
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="font-bold text-sm text-primary truncate min-w-0">
                    {order.order_number}
                  </span>
                  <span
                    className={`roll-status ${STATUS_CSS[order.status] ?? 'in_stock'}`}
                    style={{ flexShrink: 0 }}
                  >
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-muted text-sm text-[0.8rem] overflow-hidden text-ellipsis whitespace-nowrap">
                    {order.customer_name ?? '—'} ·{' '}
                    {formatDate(order.created_at)}
                  </span>
                  <span className="font-bold text-[0.85rem] shrink-0 tabular-nums">
                    <MoneyText value={order.total_amount} />đ
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
