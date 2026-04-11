import { Link } from 'react-router-dom';

import { usePortalOrders } from '@/features/customer-portal/hooks/usePortalOrders';
import { usePortalDebt } from '@/features/customer-portal/hooks/usePortalDebt';
import { usePortalShipments } from '@/features/customer-portal/hooks/usePortalShipments';
import { formatCurrency } from '@/shared/utils/format';

export function PortalDashboardPage() {
  const { orders, loading: ordersLoading } = usePortalOrders();
  const { remainingDebt, loading: debtLoading } = usePortalDebt();
  const { shipments, loading: shipmentsLoading } = usePortalShipments();

  const latestShipment = shipments[0];

  return (
    <div className="portal-section">
      <h1 className="portal-page-title">Tổng quan</h1>

      <div className="portal-summary-grid">
        <div className="portal-stat-card">
          <p className="portal-stat-label">Đơn hàng</p>
          <p className="portal-stat-value">
            {ordersLoading ? '…' : orders.length}
          </p>
          <Link to="/portal/orders" className="portal-stat-link">
            Xem tất cả →
          </Link>
        </div>

        <div className="portal-stat-card">
          <p className="portal-stat-label">Công nợ còn lại</p>
          <p className="portal-stat-value portal-stat-value--danger">
            {debtLoading ? '…' : `${formatCurrency(remainingDebt)} ₫`}
          </p>
          <Link to="/portal/debt" className="portal-stat-link">
            Chi tiết →
          </Link>
        </div>

        <div className="portal-stat-card">
          <p className="portal-stat-label">Giao hàng gần nhất</p>
          {shipmentsLoading ? (
            <p className="portal-stat-value">…</p>
          ) : latestShipment ? (
            <>
              <p className="portal-stat-value" style={{ fontSize: '1rem' }}>
                {latestShipment.shipment_number}
              </p>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  margin: '0.25rem 0 0',
                }}
              >
                {latestShipment.shipment_date}
              </p>
            </>
          ) : (
            <p
              className="portal-stat-value"
              style={{
                fontSize: '1rem',
                color: 'var(--muted)',
              }}
            >
              Chưa có
            </p>
          )}
          <Link to="/portal/shipments" className="portal-stat-link">
            Xem tất cả →
          </Link>
        </div>
      </div>

      {!ordersLoading && orders.length > 0 && (
        <div className="portal-table-wrap">
          <div className="portal-card-header">
            <span>Đơn hàng gần đây</span>
            <Link to="/portal/orders" className="portal-stat-link">
              Xem tất cả
            </Link>
          </div>
          <table className="portal-table">
            <tbody>
              {orders.slice(0, 5).map((o) => (
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
                      {o.order_date}
                    </div>
                  </td>
                  <td className="right">
                    <div>{formatCurrency(o.total_amount)} ₫</div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--muted)',
                      }}
                    >
                      {o.status}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
