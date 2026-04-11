import { Link } from 'react-router-dom';

import { usePortalShipments } from '@/features/customer-portal/hooks/usePortalShipments';

const STATUS_LABEL: Record<string, string> = {
  preparing: 'Đang chuẩn bị',
  shipped: 'Đã giao',
  delivered: 'Đã nhận',
  partially_returned: 'Trả một phần',
  returned: 'Đã trả',
};

export function PortalShipmentsPage() {
  const { shipments, loading, error } = usePortalShipments();

  if (loading) return <p className="portal-loading">Đang tải…</p>;
  if (error) return <p className="portal-error">{error}</p>;

  return (
    <div className="portal-section">
      <h1 className="portal-page-title">Giao hàng</h1>

      {shipments.length === 0 ? (
        <p className="portal-empty">Chưa có phiếu giao hàng nào.</p>
      ) : (
        <div className="portal-table-wrap">
          <div style={{ overflowX: 'auto' }}>
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Số phiếu</th>
                  <th>Ngày giao</th>
                  <th>Đơn hàng</th>
                  <th>Trạng thái</th>
                  <th>Địa chỉ</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <Link
                        to={`/portal/shipments/${s.id}`}
                        className="portal-link"
                      >
                        {s.shipment_number}
                      </Link>
                    </td>
                    <td>{s.shipment_date ?? '—'}</td>
                    <td>{s.order_number ?? '—'}</td>
                    <td>
                      <span className="portal-badge">
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                    <td
                      style={{
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {s.delivery_address ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
