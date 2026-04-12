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
  confirmed: 'Chờ SX',
  in_progress: 'Đang SX',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
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
      <div className="card-header-area card-header-premium">
        <div>
          <p className="eyebrow-premium">GIAO DỊCH</p>
          <h3 className="title-premium">Đơn hàng mới</h3>
        </div>
        <Link to="/orders" className="card-action-link flex items-center gap-1">
          Tất cả <Icon name="ChevronRight" size={16} />
        </Link>
      </div>

      <div className="card-table-section mt-1">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-block h-10 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="table-empty py-10">Chưa có đơn hàng nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th className="hide-mobile">Khách hàng</th>
                  <th className="text-right">Tổng tiền</th>
                  <th className="text-right">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold">{order.order_number}</span>
                        <span className="text-[11px] text-muted">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="td-muted hide-mobile">
                      {order.customer_name ?? '—'}
                    </td>
                    <td className="numeric-cell font-medium">
                      {formatCurrency(order.total_amount)}đ
                    </td>
                    <td className="text-right">
                      <span
                        className={`roll-status ${STATUS_CSS[order.status] ?? 'in_stock'}`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
