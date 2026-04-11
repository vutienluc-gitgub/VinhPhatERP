import { Link } from 'react-router-dom';

import { usePortalOrders } from '@/features/customer-portal/hooks/usePortalOrders';
import { formatCurrency } from '@/shared/utils/format';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang sản xuất',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

const STATUS_BADGE: Record<string, string> = {
  draft: 'portal-badge portal-badge--draft',
  confirmed: 'portal-badge portal-badge--confirmed',
  in_progress: 'portal-badge portal-badge--in-progress',
  completed: 'portal-badge portal-badge--completed',
  cancelled: 'portal-badge portal-badge--cancelled',
};

export function PortalOrdersPage() {
  const { orders, loading, error, page, setPage, PAGE_SIZE } =
    usePortalOrders();

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
      <h1 className="portal-page-title">Đơn hàng</h1>

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
            <p>Chưa có đơn hàng nào.</p>
          </div>
        </div>
      ) : (
        <div className="portal-table-wrap">
          {/* Desktop table */}
          <div className="portal-table-desktop" style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Số đơn</th>
                  <th>Ngày đặt</th>
                  <th>Ngày giao</th>
                  <th className="right">Tổng tiền</th>
                  <th className="right">Đã thanh toán</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <Link
                        to={`/portal/orders/${o.id}`}
                        className="portal-link"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td
                      style={{
                        color: '#647284',
                        fontSize: '0.82rem',
                      }}
                    >
                      {o.order_date}
                    </td>
                    <td
                      style={{
                        color: '#647284',
                        fontSize: '0.82rem',
                      }}
                    >
                      {o.due_date ?? '—'}
                    </td>
                    <td className="right" style={{ fontWeight: 600 }}>
                      {formatCurrency(o.total_amount)} đ
                    </td>
                    <td className="right" style={{ color: '#647284' }}>
                      {formatCurrency(o.paid_amount)} đ
                    </td>
                    <td>
                      <span
                        className={STATUS_BADGE[o.status] ?? 'portal-badge'}
                      >
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="portal-order-cards" style={{ padding: '0.75rem' }}>
            {orders.map((o) => (
              <div key={o.id} className="portal-order-card">
                <div className="portal-order-card-row">
                  <Link
                    to={`/portal/orders/${o.id}`}
                    className="portal-link"
                    style={{ fontSize: '0.9rem' }}
                  >
                    {o.order_number}
                  </Link>
                  <span className={STATUS_BADGE[o.status] ?? 'portal-badge'}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </div>
                <div className="portal-order-card-row">
                  <span className="portal-order-card-meta">
                    {o.order_date}
                    {o.due_date && ` — Giao: ${o.due_date}`}
                  </span>
                  <span className="portal-order-card-amount">
                    {formatCurrency(o.total_amount)} đ
                  </span>
                </div>
                {o.paid_amount > 0 && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: '#647284',
                      textAlign: 'right',
                    }}
                  >
                    Đã TT: {formatCurrency(o.paid_amount)} đ
                  </div>
                )}
              </div>
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
        </div>
      )}
    </div>
  );
}
