import { useParams, Link } from 'react-router-dom';

import { formatCurrency } from '@/shared/utils/format';
import { usePortalOrders } from '@/features/customer-portal/hooks/usePortalOrders';

import { PortalProgressTimeline } from './PortalProgressTimeline';

export function PortalOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { order, stages, loading, error } = usePortalOrders(id);

  if (loading) return <p className="text-sm text-gray-500 p-4">Đang tải…</p>;
  if (error) return <p className="text-sm text-red-500 p-4">{error}</p>;
  if (!order)
    return (
      <p className="text-sm text-gray-500 p-4">Không tìm thấy đơn hàng.</p>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/portal/orders"
          className="text-sm text-blue-600 hover:underline"
        >
          ← Đơn hàng
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700">{order.order_number}</span>
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-gray-900">
            {order.order_number}
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {order.status}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Ngày đặt</p>
            <p className="text-gray-900">{order.order_date}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Ngày giao</p>
            <p className="text-gray-900">{order.due_date ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tổng tiền</p>
            <p className="text-gray-900 font-medium">
              {formatCurrency(order.total_amount)} ₫
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Đã thanh toán</p>
            <p className="text-gray-900">
              {formatCurrency(order.paid_amount)} ₫
            </p>
          </div>
        </div>
      </div>

      {/* Order items */}
      {order.items && order.items.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <p className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-100">
            Sản phẩm
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Loại vải
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600">
                    Màu
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">
                    SL
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">
                    Đơn giá
                  </th>
                  <th className="text-right px-4 py-2 font-medium text-gray-600">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 text-gray-900">
                      {item.fabric_name}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {item.color ?? '—'}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-600">
                      {formatCurrency(item.unit_price)} ₫
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900 font-medium">
                      {formatCurrency(item.amount)} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Progress timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm font-medium text-gray-900 mb-4">
          Tiến độ sản xuất
        </p>
        <PortalProgressTimeline stages={stages} />
      </div>
    </div>
  );
}
