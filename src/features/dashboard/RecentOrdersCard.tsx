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
  cancelled: 'Huỷ',
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
            <h3
              style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: 700,
              }}
            >
              Đơn hàng mới
            </h3>
          </div>
          <Link to="/orders" className="card-action-link">
            Tất cả <Icon name="ChevronRight" size={16} />
          </Link>
        </div>
      </div>

      <div style={{ paddingTop: '0.5rem' }}>
        {isLoading ? (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton-block"
                style={{
                  height: '56px',
                  borderRadius: '8px',
                }}
              />
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
                className="task-item"
                style={{
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: '0.25rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      color: 'var(--primary)',
                    }}
                  >
                    {order.order_number}
                  </span>
                  <span
                    className={`roll-status ${STATUS_CSS[order.status] ?? 'in_stock'}`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <span
                    className="td-muted"
                    style={{
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {order.customer_name ?? '—'} ·{' '}
                    {formatDate(order.created_at)}
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      flexShrink: 0,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
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
