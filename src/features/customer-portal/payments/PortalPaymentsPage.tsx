import { usePortalPayments } from '@/application/crm/portal';
import { formatCurrency } from '@/shared/utils/format';

const METHOD_LABEL: Record<string, string> = {
  cash: 'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  check: 'Séc',
  other: 'Khác',
};

export function PortalPaymentsPage() {
  const { payments, loading, error } = usePortalPayments();

  if (loading) return <p className="portal-loading">Đang tải…</p>;
  if (error) return <p className="portal-error">{error}</p>;

  return (
    <div className="portal-section">
      <h1 className="portal-page-title">Lịch sử thanh toán</h1>

      {payments.length === 0 ? (
        <p className="portal-empty">Chưa có phiếu thu nào.</p>
      ) : (
        <div className="portal-table-wrap">
          <div style={{ overflowX: 'auto' }}>
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
                    <td style={{ fontWeight: 500 }}>{p.payment_number}</td>
                    <td>{p.payment_date}</td>
                    <td className="right" style={{ fontWeight: 500 }}>
                      {formatCurrency(p.amount)} ₫
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
