import { usePortalPayments } from '@/application/crm/portal';
import { MoneyText } from '@/shared/value';
import { TableSkeleton, ErrorInline, EmptyState } from '@/shared/components';

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  check: 'Séc',
  other: 'Khác',
};

export function PortalPaymentsPage() {
  const { payments, loading, error } = usePortalPayments();

  if (loading) {
    return (
      <div className="portal-section space-y-4">
        <h1 className="portal-page-title">Lịch sử thanh toán</h1>
        <TableSkeleton rows={5} columns={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="portal-section">
        <h1 className="portal-page-title">Lịch sử thanh toán</h1>
        <ErrorInline>{error}</ErrorInline>
      </div>
    );
  }

  return (
    <div className="portal-section">
      <h1 className="portal-page-title">Lịch sử thanh toán</h1>

      {payments.length === 0 ? (
        <EmptyState icon="Receipt" description="Chưa có phiếu thu nào." />
      ) : (
        <div className="portal-table-wrap">
          <div className="overflow-x-auto">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Số phiếu</th>
                  <th>Ngày thu</th>
                  <th className="right">Số tiền</th>
                  <th>Phương thức</th>
                  <th>Đơn hàng</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.payment_number}</td>
                    <td>{p.payment_date}</td>
                    <td className="right font-medium">
                      <MoneyText value={p.amount} />
                    </td>
                    <td>
                      {METHOD_LABEL[p.payment_method] ?? p.payment_method}
                    </td>
                    <td>{p.order_number ?? '—'}</td>
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
