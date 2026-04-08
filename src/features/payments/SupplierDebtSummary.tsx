import { useSupplierDebt } from './useCashFlow';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function SupplierDebtSummary() {
  const { data: debts = [], isLoading, error } = useSupplierDebt();

  const totalDebt = debts.reduce((sum, d) => sum + d.balance_due, 0);

  if (error) {
    return (
      <div className="panel-card">
        <p className="error-inline">Lỗi: {(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Tài chính</p>
            <h3>Công nợ nhà cung cấp</h3>
          </div>
          {debts.length > 0 && (
            <div className="text-right">
              <div className="td-muted summary-label">Tổng phải trả</div>
              <div className="summary-value summary-value--danger">
                {formatCurrency(totalDebt)} đ
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="data-table-wrap card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : debts.length === 0 ? (
          <p className="table-empty">Không có công nợ nhà cung cấp.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Nhà cung cấp</th>
                <th className="text-right">Số phiếu nhập</th>
                <th className="text-right">Tổng mua</th>
                <th className="text-right">Đã trả</th>
                <th className="text-right">Còn nợ</th>
              </tr>
            </thead>
            <tbody>
              {debts.map((d) => (
                <tr key={d.supplier_id}>
                  <td>
                    <strong>{d.supplier_name}</strong>
                    {d.supplier_code && (
                      <div className="td-muted" style={{ fontSize: '0.8rem' }}>
                        {d.supplier_code}
                      </div>
                    )}
                  </td>
                  <td className="numeric-cell">{d.document_count}</td>
                  <td className="numeric-cell">
                    {formatCurrency(d.total_purchased)} đ
                  </td>
                  <td className="numeric-paid">
                    {formatCurrency(d.total_paid)} đ
                  </td>
                  <td className="numeric-debt">
                    {formatCurrency(d.balance_due)} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
