import { formatCurrency } from '@/shared/utils/format';
import { usePortalPayments } from '@/features/customer-portal/hooks/usePortalPayments';

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  check: 'Séc',
  other: 'Khác',
};

export function PortalPaymentsPage() {
  const { payments, loading, error } = usePortalPayments();

  if (loading) return <p className="text-sm text-gray-500 p-4">Đang tải…</p>;
  if (error) return <p className="text-sm text-red-500 p-4">{error}</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">
        Lịch sử thanh toán
      </h1>

      {payments.length === 0 ? (
        <p className="text-sm text-gray-500">Chưa có phiếu thu nào.</p>
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
                    Ngày thu
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">
                    Số tiền
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Phương thức
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">
                    Đơn hàng
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {p.payment_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.payment_date}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 font-medium">
                      {formatCurrency(p.amount)} ₫
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {METHOD_LABEL[p.payment_method] ?? p.payment_method}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.order_number ?? '—'}
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
