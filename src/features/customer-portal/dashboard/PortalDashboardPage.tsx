import { Link } from 'react-router-dom';

import { usePortalOrders } from '@/features/customer-portal/hooks/usePortalOrders';
import { usePortalDebt } from '@/features/customer-portal/hooks/usePortalDebt';
import { usePortalShipments } from '@/features/customer-portal/hooks/usePortalShipments';
import { useAuth } from '@/features/auth/AuthProvider';
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

export function PortalDashboardPage() {
  const { profile } = useAuth();
  const { orders, loading: ordersLoading } = usePortalOrders();
  const { remainingDebt, loading: debtLoading } = usePortalDebt();
  const { shipments, loading: shipmentsLoading } = usePortalShipments();

  const latestShipment = shipments[0];

  return (
    <div className="portal-section">
      {/* Welcome Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f1f3d 0%, #1a3a6e 100%)',
          borderRadius: '14px',
          padding: '1.25rem 1.5rem',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.55)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 600,
            }}
          >
            Chào mừng
          </p>
          <p
            style={{
              margin: '0.2rem 0 0',
              fontSize: '1.15rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}
          >
            {profile?.full_name ?? 'Khách hàng'}
          </p>
        </div>
        <div
          style={{
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.5)',
            textAlign: 'right',
          }}
        >
          <p style={{ margin: 0 }}>Cổng khách hàng</p>
          <p
            style={{
              margin: '0.2rem 0 0',
              color: 'rgba(255,255,255,0.3)',
            }}
          >
            Vĩnh Phát ERP
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="portal-summary-grid">
        {/* Don hang */}
        <div className="portal-stat-card">
          <div className="portal-stat-icon">
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <p className="portal-stat-label">Đơn hàng</p>
          <p className="portal-stat-value">
            {ordersLoading ? '…' : orders.length}
          </p>
          <Link to="/portal/orders" className="portal-stat-link">
            Xem tất cả &rarr;
          </Link>
        </div>

        {/* Cong no */}
        <div className="portal-stat-card portal-stat-card--danger">
          <div className="portal-stat-icon portal-stat-icon--danger">
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="portal-stat-label">Công nợ còn lại</p>
          <p className="portal-stat-value portal-stat-value--danger">
            {debtLoading ? '…' : `${formatCurrency(remainingDebt)} đ`}
          </p>
          <Link to="/portal/debt" className="portal-stat-link">
            Chi tiết &rarr;
          </Link>
        </div>

        {/* Giao hang */}
        <div
          className={`portal-stat-card${latestShipment ? ' portal-stat-card--success' : ''}`}
        >
          <div
            className={`portal-stat-icon${latestShipment ? ' portal-stat-icon--success' : ''}`}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 10l-8-6m8 6l8-6"
              />
            </svg>
          </div>
          <p className="portal-stat-label">Giao hàng gần nhất</p>
          {shipmentsLoading ? (
            <p className="portal-stat-value">…</p>
          ) : latestShipment ? (
            <>
              <p
                className="portal-stat-value"
                style={{
                  fontSize: '1rem',
                  marginBottom: '0.125rem',
                }}
              >
                {latestShipment.shipment_number}
              </p>
              <p
                style={{
                  fontSize: '0.75rem',
                  color: '#647284',
                  margin: 0,
                }}
              >
                {latestShipment.shipment_date}
              </p>
            </>
          ) : (
            <p
              className="portal-stat-value"
              style={{
                fontSize: '0.95rem',
                color: '#647284',
              }}
            >
              Chưa có
            </p>
          )}
          <Link to="/portal/shipments" className="portal-stat-link">
            Xem tất cả &rarr;
          </Link>
        </div>
      </div>

      {/* Don hang gan day */}
      {!ordersLoading && orders.length > 0 && (
        <div className="portal-table-wrap">
          <div className="portal-card-header">
            <span>Đơn hàng gần đây</span>
            <Link to="/portal/orders" className="portal-stat-link">
              Xem tất cả
            </Link>
          </div>

          {/* Desktop table */}
          <div className="portal-table-desktop" style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Số đơn</th>
                  <th>Ngày đặt</th>
                  <th className="right">Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
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
                    <td className="right" style={{ fontWeight: 600 }}>
                      {formatCurrency(o.total_amount)} đ
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
            {orders.slice(0, 5).map((o) => (
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
                  <span className="portal-order-card-meta">{o.order_date}</span>
                  <span className="portal-order-card-amount">
                    {formatCurrency(o.total_amount)} đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!ordersLoading && orders.length === 0 && (
        <div className="portal-table-wrap">
          <div className="portal-card-header">
            <span>Đơn hàng gần đây</span>
          </div>
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
      )}
    </div>
  );
}
