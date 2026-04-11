import { useParams, Link } from 'react-router-dom';

import { usePortalOrders } from '@/features/customer-portal/hooks/usePortalOrders';
import { formatCurrency } from '@/shared/utils/format';

import { PortalProgressTimeline } from './PortalProgressTimeline';

export function PortalOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { order, stages, loading, error } = usePortalOrders(id);

  if (loading) return <p className="portal-loading">Đang tải…</p>;
  if (error) return <p className="portal-error">{error}</p>;
  if (!order) return <p className="portal-empty">Không tìm thấy đơn hàng.</p>;

  return (
    <div className="portal-section">
      <div className="portal-breadcrumb">
        <Link to="/portal/orders">← Đơn hàng</Link>
        <span>/</span>
        <span>{order.order_number}</span>
      </div>

      {/* Summary */}
      <div className="portal-table-wrap">
        <div className="portal-card-header">
          <span>{order.order_number}</span>
          <span className="portal-badge">{order.status}</span>
        </div>
        <div className="portal-card-body">
          <div className="portal-detail-grid">
            <div className="portal-detail-item">
              <label>Ngày đặt</label>
              <p>{order.order_date}</p>
            </div>
            <div className="portal-detail-item">
              <label>Ngày giao</label>
              <p>{order.due_date ?? '—'}</p>
            </div>
            <div className="portal-detail-item">
              <label>Tổng tiền</label>
              <p style={{ fontWeight: 600 }}>
                {formatCurrency(order.total_amount)} ₫
              </p>
            </div>
            <div className="portal-detail-item">
              <label>Đã thanh toán</label>
              <p>{formatCurrency(order.paid_amount)} ₫</p>
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <div className="portal-table-wrap">
          <div className="portal-card-header">Sản phẩm</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Loại vải</th>
                  <th>Màu</th>
                  <th className="right">SL</th>
                  <th className="right">Đơn giá</th>
                  <th className="right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.fabric_name}</td>
                    <td>{item.color ?? '—'}</td>
                    <td className="right">{item.quantity}</td>
                    <td className="right">
                      {formatCurrency(item.unit_price)} ₫
                    </td>
                    <td className="right" style={{ fontWeight: 500 }}>
                      {formatCurrency(item.amount)} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="portal-table-wrap">
        <div className="portal-card-header">Tiến độ sản xuất</div>
        <div className="portal-card-body">
          <PortalProgressTimeline stages={stages} />
        </div>
      </div>
    </div>
  );
}
