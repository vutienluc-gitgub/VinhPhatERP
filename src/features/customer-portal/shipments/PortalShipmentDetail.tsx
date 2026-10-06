import { useParams, Link } from 'react-router-dom';

import { usePortalShipments } from '@/application/crm/portal';
import { ChatWidget } from '@/features/chat/ChatWidget';
import { SHIPMENT_STATUS_LABELS } from '@/features/customer-portal/constants';
import { TableSkeleton, ErrorInline, EmptyState } from '@/shared/components';

export function PortalShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { shipment, loading, error } = usePortalShipments(id);

  if (loading) {
    return (
      <div className="portal-section space-y-4">
        <TableSkeleton rows={4} columns={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-section">
        <ErrorInline>{error}</ErrorInline>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="portal-section">
        <EmptyState
          icon="PackageX"
          description="Không tìm thấy phiếu giao hàng."
        />
      </div>
    );
  }

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
            {SHIPMENT_STATUS_LABELS[shipment.status] ?? shipment.status}
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
          <div className="overflow-x-auto">
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
                {shipment.items.map((item, index) => (
                  <tr
                    key={
                      item.roll_number ??
                      `${item.fabric_type}-${item.length_m ?? index}`
                    }
                  >
                    <td className="font-mono text-xs">{item.roll_number}</td>
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
