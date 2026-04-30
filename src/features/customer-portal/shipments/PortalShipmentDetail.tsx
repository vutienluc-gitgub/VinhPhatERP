import { useParams, Link } from 'react-router-dom';

import { usePortalShipments } from '@/application/crm/portal';
// eslint-disable-next-line boundaries/dependencies
import { ChatWidget } from '@/features/chat/ChatWidget';

const STATUS_LABEL: Record<string, string> = {
  preparing: 'Đang chuẩn bị',
  shipped: 'Đã giao',
  delivered: 'Đã nhận',
  partially_returned: 'Trả một phần',
  returned: 'Đã trả',
};

export function PortalShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { shipment, loading, error } = usePortalShipments(id);

  if (loading) return <p className="portal-loading">Đang tải…</p>;
  if (error) return <p className="portal-error">{error}</p>;
  if (!shipment)
    return <p className="portal-empty">Không tìm thấy phiếu giao.</p>;

  return (
    <div className="portal-section">
      <div className="portal-breadcrumb">
        <Link to="/portal/shipments">← Giao hàng</Link>
        <span>/</span>
        <span>{shipment.shipment_number}</span>
      </div>

      <div className="portal-table-wrap">
        <div className="portal-card-header">
          <span>{shipment.shipment_number}</span>
          <span className="portal-badge">
            {STATUS_LABEL[shipment.status] ?? shipment.status}
          </span>
        </div>
        <div className="portal-card-body">
          <div className="portal-detail-grid">
            <div className="portal-detail-item">
              <label>Ngày giao</label>
              <p>{shipment.shipment_date ?? '—'}</p>
            </div>
            <div className="portal-detail-item">
              <label>Đơn hàng</label>
              <p>{shipment.order_number ?? '—'}</p>
            </div>
            <div className="portal-detail-item">
              <label>Địa chỉ giao</label>
              <p>{shipment.delivery_address ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {shipment.items && shipment.items.length > 0 && (
        <div className="portal-table-wrap">
          <div className="portal-card-header">Danh sách cuộn vải</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Mã cuộn</th>
                  <th>Loại vải</th>
                  <th className="right">Số lượng (m)</th>
                  <th className="right">Trọng lượng (kg)</th>
                </tr>
              </thead>
              <tbody>
                {shipment.items.map((item) => (
                  <tr key={item.roll_number || JSON.stringify(item)}>
                    <td
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                      }}
                    >
                      {item.roll_number}
                    </td>
                    <td>{item.fabric_type}</td>
                    <td className="right">{item.length_m ?? '—'}</td>
                    <td className="right">{item.weight_kg ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chat — Floating widget for customer to contact operations */}
      {shipment.status !== 'preparing' && (
        <ChatWidget
          entityType="shipment"
          entityId={shipment.id}
          title={`Chat - ${shipment.shipment_number}`}
          subtitle="Liên hệ Vĩnh Phát"
        />
      )}
    </div>
  );
}
