import { Link } from 'react-router-dom';

import { Icon } from '@/shared/components';
import { formatCurrency } from '@/shared/utils/format';
import type { RecentOrder } from '@/application/analytics';

type RecentOrdersCardProps = {
  orders: RecentOrder[];
  isLoading: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  confirmed: 'Chợ SX',
  in_progress: 'Đang SX',
  completed: 'Xong',
  cancelled: 'Hủy',
};

const STATUS_CSS: Record<string, string> = {
  draft: 'draft',
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
          <div>
            <p className="eyebrow">Giao dịch</p>
            <h3 className="m-0 text-base font-bold">Đơn hàng mới</h3>
          </div>
          <Link to="/orders" className="card-action-link">
            Tất cả <Icon name="ChevronRight" size={16} />
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
          <p className="task-empty">Chưa có đơn hàng nào.</p>
        ) : (
          <div className="task-list">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="task-item flex-col items-stretch gap-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sm text-primary">
                    {order.order_number}
                  </span>
                  <span
                    className={`roll-status ${STATUS_CSS[order.status] ?? 'in_stock'}`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="td-muted text-[0.8rem] overflow-hidden text-ellipsis whitespace-nowrap">
                    {order.customer_name ?? '—'} ·{' '}
                    {formatDate(order.created_at)}
                  </span>
                  <span className="font-bold text-[0.85rem] shrink-0 tabular-nums">
                    {formatCurrency(order.total_amount)}đ
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
