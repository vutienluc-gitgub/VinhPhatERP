import { Link } from 'react-router-dom'

import type { RecentOrder } from './useDashboardData'

type RecentOrdersCardProps = {
  orders: RecentOrder[]
  isLoading: boolean
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Nháp',
  confirmed: 'Chờ SX',
  in_progress: 'Đang SX',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
}

const STATUS_CSS: Record<string, string> = {
  draft: 'in_stock',
  confirmed: 'reserved',
  in_progress: 'in_process',
  completed: 'shipped',
  cancelled: 'damaged',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

export function RecentOrdersCard({ orders, isLoading }: RecentOrdersCardProps) {
  return (
    <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '1.25rem 1.25rem 0' }}>
        <div className="card-header-row">
          <div>
            <p className="eyebrow">Đơn hàng</p>
            <h3 style={{ margin: 0 }}>Gần đây</h3>
          </div>
          <Link to="/orders" className="card-action-link">
            Xem tất cả →
          </Link>
        </div>
      </div>

      <div style={{ padding: '0.75rem 0 0' }}>
        {isLoading ? (
          <div style={{ padding: '0 1.25rem 1.25rem' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton-block" style={{ height: '2.5rem', marginBottom: '0.5rem' }} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <p className="table-empty">Chưa có đơn hàng nào.</p>
        ) : (
          <div className="data-table-wrap" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th className="hide-mobile">KH</th>
                  <th className="text-right">Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.order_number}</strong>
                      <div className="td-muted" style={{ fontSize: '0.76rem' }}>{formatDate(order.created_at)}</div>
                    </td>
                    <td className="td-muted hide-mobile">{order.customer_name ?? '—'}</td>
                    <td className="numeric-cell">{formatCurrency(order.total_amount)}</td>
                    <td>
                      <span className={`roll-status ${STATUS_CSS[order.status] ?? 'in_stock'}`}>
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
  )
}
