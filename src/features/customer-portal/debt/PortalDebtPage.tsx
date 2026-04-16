import { Link } from 'react-router-dom';

import { usePortalDebt } from '@/application/crm/portal';
import { formatCurrency } from '@/shared/utils/format';

export function PortalDebtPage() {
  const {
    totalAmount,
    paidAmount,
    remainingDebt,
    overdueOrders,
    loading,
    error,
  } = usePortalDebt();

  if (loading) return <p className="portal-loading">Đang tải…</p>;
  if (error) return <p className="portal-error">{error}</p>;

  return (
    <div className="portal-section">
      <h1 className="portal-page-title">Công nợ</h1>

      <div className="portal-summary-grid">
        <div className="portal-stat-card">
          <p className="portal-stat-label">Tổng tiền đơn hàng</p>
          <p className="portal-stat-value">{formatCurrency(totalAmount)} ₫</p>
        </div>
        <div className="portal-stat-card">
          <p className="portal-stat-label">Đã thanh toán</p>
          <p className="portal-stat-value portal-stat-value--success">
            {formatCurrency(paidAmount)} ₫
          </p>
        </div>
        <div className="portal-stat-card">
          <p className="portal-stat-label">Còn nợ</p>
          <p className="portal-stat-value portal-stat-value--danger">
            {formatCurrency(remainingDebt)} ₫
          </p>
        </div>
      </div>

      {overdueOrders.length > 0 && (
        <div className="portal-table-wrap">
          <div className="portal-card-header">Đơn hàng còn nợ</div>
          <table className="portal-table">
            <tbody>
              {overdueOrders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <Link to={`/portal/orders/${o.id}`} className="portal-link">
                      {o.order_number}
                    </Link>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted)',
                      }}
                    >
                      Giao: {o.due_date ?? '—'}
                    </div>
                  </td>
                  <td className="right">
                    <div
                      style={{
                        fontWeight: 500,
                        color: 'var(--danger)',
                      }}
                    >
                      {formatCurrency(o.total_amount - o.paid_amount)} ₫
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted)',
                      }}
                    >
                      còn nợ
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {overdueOrders.length === 0 && remainingDebt === 0 && (
        <p className="portal-empty">Không có công nợ.</p>
      )}
    </div>
  );
}
