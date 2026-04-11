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

export function PortalOrdersPage() {
  const { orders, loading, error, page, setPage, PAGE_SIZE } =
    usePortalOrders();

  if (loading) return <p className="portal-loading">Đang tải…</p>;
  if (error) return <p className="portal-error">{error}</p>;

  return (
    <div className="portal-section">
      <h1 className="portal-page-title">Đơn hàng</h1>

      {orders.length === 0 ? (
        <p className="portal-empty">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="portal-table-wrap">
          <div style={{ overflowX: 'auto' }}>
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
                    <td>{o.order_date}</td>
                    <td>{o.due_date ?? '—'}</td>
                    <td className="right">
                      {formatCurrency(o.total_amount)} ₫
                    </td>
                    <td className="right">{formatCurrency(o.paid_amount)} ₫</td>
                    <td>
                      <span className="portal-badge">
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="portal-pagination">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
            >
              ← Trước
            </button>
            <span>Trang {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={orders.length < PAGE_SIZE}
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
