import { useParams, Link } from 'react-router-dom';

import { usePortalShipments } from '@/features/customer-portal/hooks/usePortalShipments';

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

  if (loading) return <p className="text-sm text-gray-500 p-4">Đang tải…</p>;
  if (error) return <p className="text-sm text-red-500 p-4">{error}</p>;
  if (!shipment)
    return (
      <p className="text-sm text-gray-500 p-4">Không tìm thấy phiếu giao.</p>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/portal/shipments"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Giao hàng
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700">
          {shipment.shipment_number}
        </span>
      </div>

      {/* Shipment summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-900">
            {shipment.shipment_number}
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {STATUS_LABEL[shipment.status] ?? shipment.status}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Ngày giao</p>
            <p className="text-gray-900">{shipment.shipment_date ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Đơn hàng</p>
            <p className="text-gray-900">{shipment.order_number ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Địa chỉ giao</p>
            <p className="text-gray-900">{shipment.delivery_address ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Shipment items */}
      {shipment.items && shipment.items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <p className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-100">
            Danh sách cuộn vải
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Mã cuộn
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Loại vải
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">
                    Số lượng (m)
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">
                    Trọng lượng (kg)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shipment.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-2 text-gray-900 font-mono text-xs">
                      {item.roll_number}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {item.fabric_type}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      {item.length_m != null ? item.length_m : '—'}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      {item.weight_kg != null ? item.weight_kg : '—'}
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
