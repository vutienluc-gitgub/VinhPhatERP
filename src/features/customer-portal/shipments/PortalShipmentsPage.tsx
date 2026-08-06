import { useState } from 'react';
import { Link } from 'react-router-dom';

import { usePortalShipments } from '@/application/crm/portal';
import { SHIPMENT_STATUS_LABELS } from '@/features/customer-portal/constants';
import { EmptyState, FilterChips } from '@/shared/components';

type FilterStatus = 'ALL' | 'PREPARING' | 'SHIPPED' | 'DELIVERED';

export function PortalShipmentsPage() {
  const { shipments, loading, error } = usePortalShipments();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('ALL');

  if (loading) return <p className="portal-loading">Đang tải…</p>;
  if (error) return <p className="portal-error">{error}</p>;

  const filteredShipments = shipments.filter((s) => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'PREPARING') return s.status === 'preparing';
    if (activeFilter === 'SHIPPED') return s.status === 'shipped';
    if (activeFilter === 'DELIVERED') return s.status === 'delivered';
    return true;
  });

  const filterOptions: Array<{ id: FilterStatus; label: string }> = [
    { id: 'ALL', label: 'Tất cả' },
    { id: 'PREPARING', label: SHIPMENT_STATUS_LABELS.preparing },
    { id: 'SHIPPED', label: SHIPMENT_STATUS_LABELS.shipped },
    { id: 'DELIVERED', label: SHIPMENT_STATUS_LABELS.delivered },
  ];

  return (
    <div className="portal-section">
      <h1 className="portal-page-title">Giao hàng</h1>

      <FilterChips
        options={filterOptions}
        activeValue={activeFilter}
        onChange={(val) => setActiveFilter(val as FilterStatus)}
      />

      {filteredShipments.length === 0 ? (
        <EmptyState icon="Truck" description="Chưa có phiếu giao hàng nào." />
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
                {filteredShipments.map((s) => (
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
                        {SHIPMENT_STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate">
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
