import { Link } from 'react-router-dom';

import { formatCurrency } from '@/shared/utils/format';
import { usePortalDebt } from '@/features/customer-portal/hooks/usePortalDebt';

export function PortalDebtPage() {
  const {
    totalAmount,
    paidAmount,
    remainingDebt,
    overdueOrders,
    loading,
    error,
  } = usePortalDebt();

  if (loading) return <p className="text-sm text-gray-500 p-4">Đang tải…</p>;
  if (error) return <p className="text-sm text-red-500 p-4">{error}</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">Công nợ</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Tổng tiền đơn hàng</p>
          <p className="text-xl font-semibold text-gray-900">
            {formatCurrency(totalAmount)} ₫
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Đã thanh toán</p>
          <p className="text-xl font-semibold text-green-600">
            {formatCurrency(paidAmount)} ₫
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Còn nợ</p>
          <p className="text-xl font-semibold text-red-600">
            {formatCurrency(remainingDebt)} ₫
          </p>
        </div>
      </div>

      {/* Overdue orders */}
      {overdueOrders.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <p className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-100">
            Đơn hàng còn nợ
          </p>
          <ul className="divide-y divide-gray-100">
            {overdueOrders.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/portal/orders/${o.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {o.order_number}
                    </p>
                    <p className="text-xs text-gray-500">
                      Giao: {o.due_date ?? '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-600 font-medium">
                      {formatCurrency(o.total_amount - o.paid_amount)} ₫
                    </p>
                    <p className="text-xs text-gray-400">còn nợ</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {overdueOrders.length === 0 && remainingDebt === 0 && (
        <p className="text-sm text-green-600">Không có công nợ.</p>
      )}
    </div>
  );
}
