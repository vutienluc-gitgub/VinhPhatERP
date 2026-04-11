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

  if (loading) return <p className="text-sm text-gray-500 p-4">Đang tải…</p>;
  if (error) return <p className="text-sm text-red-500 p-4">{error}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Giao hàng</h1>

      {shipments.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có phiếu giao hàng nào.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Số phiếu
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Ngày giao
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Đơn hàng
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Trạng thái
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Địa chỉ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/portal/shipments/${s.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {s.shipment_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.shipment_date ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.order_number ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
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
