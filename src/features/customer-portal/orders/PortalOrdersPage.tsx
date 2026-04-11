import { Link } from 'react-router-dom';

import { formatCurrency } from '@/shared/utils/format';
import { usePortalOrders } from '@/features/customer-portal/hooks/usePortalOrders';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Nháp',
  confirmed: 'Đã xác nhận',
  in_progress: 'Đang sản xuất',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export function PortalOrdersPage() {
  const { orders, loading, error, page, setPage, PAGE_SIZE } =
    usePortalOrders();

  if (loading) return <p className="text-sm text-gray-500 p-4">Đang tải…</p>;
  if (error) return <p className="text-sm text-red-500 p-4">{error}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Đơn hàng</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Số đơn
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Ngày đặt
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Ngày giao
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    Tổng tiền
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    Đã thanh toán
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        to={`/portal/orders/${o.id}`}
                        className="text-blue-600 hover:underline font-medium"
                      >
                        {o.order_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{o.order_date}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {o.due_date ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900">
                      {formatCurrency(o.total_amount)} ₫
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">
                      {formatCurrency(o.paid_amount)} ₫
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        {STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="text-sm text-gray-600 disabled:opacity-40 hover:text-gray-900"
            >
              ← Trước
            </button>
            <span className="text-xs text-gray-500">Trang {page + 1}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={orders.length < PAGE_SIZE}
              className="text-sm text-gray-600 disabled:opacity-40 hover:text-gray-900"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
