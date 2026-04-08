import type { RevenueRow } from '@/api/reports.api';
import { KpiCard, KpiGrid } from '@/shared/components/KpiCard';

type RevenueSectionProps = {
  data: RevenueRow[];
  isLoading: boolean;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function RevenueSection({ data, isLoading }: RevenueSectionProps) {
  const totalRevenue = data.reduce((sum, r) => sum + r.total_amount, 0);
  const totalPaid = data.reduce((sum, r) => sum + r.paid_amount, 0);
  const totalBalance = data.reduce((sum, r) => sum + r.balance_due, 0);

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Báo cáo</p>
            <h3>Doanh thu</h3>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <KpiGrid>
        <KpiCard
          label="Tổng doanh thu"
          value={`${formatCurrency(totalRevenue)} đ`}
          color="var(--primary)"
        />
        <KpiCard
          label="Đã thu"
          value={`${formatCurrency(totalPaid)} đ`}
          color="var(--success)"
        />
        <KpiCard
          label="Còn nợ"
          value={`${formatCurrency(totalBalance)} đ`}
          color={totalBalance > 0 ? 'var(--warning)' : 'var(--success)'}
        />
        <KpiCard label="Số đơn hàng" value={String(data.length)} />
      </KpiGrid>

      {/* Table */}
      <div className="data-table-wrap card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : data.length === 0 ? (
          <p className="table-empty">Không có dữ liệu doanh thu trong kỳ.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Đơn hàng</th>
                <th className="hide-mobile">Khách hàng</th>
                <th>Ngày đặt</th>
                <th className="text-right">Tổng tiền</th>
                <th className="text-right">Đã thu</th>
                <th className="text-right">Còn nợ</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.order_number}</strong>
                  </td>
                  <td className="hide-mobile">{row.customer_name}</td>
                  <td className="td-muted">{row.order_date}</td>
                  <td className="numeric-cell">
                    {formatCurrency(row.total_amount)}
                  </td>
                  <td className="numeric-cell">
                    {formatCurrency(row.paid_amount)}
                  </td>
                  <td
                    className={
                      row.balance_due > 0 ? 'numeric-debt' : 'numeric-paid'
                    }
                  >
                    {formatCurrency(row.balance_due)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>
                  <strong>Tổng cộng</strong>
                </td>
                <td className="numeric-cell">
                  <strong>{formatCurrency(totalRevenue)}</strong>
                </td>
                <td className="numeric-cell">
                  <strong>{formatCurrency(totalPaid)}</strong>
                </td>
                <td
                  className={totalBalance > 0 ? 'numeric-debt' : 'numeric-paid'}
                >
                  <strong>{formatCurrency(totalBalance)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
