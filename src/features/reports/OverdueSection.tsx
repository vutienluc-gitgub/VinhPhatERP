import type { OverdueOrderRow } from '@/api/reports.api'

import { KpiCard, KpiGrid } from '@/shared/components/KpiCard'

type OverdueSectionProps = {
  data: OverdueOrderRow[]
  isLoading: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function OverdueSection({ data, isLoading }: OverdueSectionProps) {
  const severeCount = data.filter((r) => r.days_overdue > 7).length

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Báo cáo</p>
            <h3>Đơn hàng trễ hạn</h3>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <KpiGrid>
        <KpiCard
          label="Tổng đơn trễ"
          value={String(data.length)}
          color={data.length > 0 ? 'var(--danger)' : 'var(--success)'}
        />
        <KpiCard
          label="Trễ > 7 ngày"
          value={String(severeCount)}
          color={severeCount > 0 ? 'var(--danger)' : 'var(--success)'}
        />
        <KpiCard
          label="Tổng nợ đơn trễ"
          value={`${formatCurrency(data.reduce((s, r) => s + r.balance_due, 0))} đ`}
          color="var(--warning-strong)"
        />
      </KpiGrid>

      {/* Table */}
      <div className="data-table-wrap card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : data.length === 0 ? (
          <p className="table-empty">Không có đơn hàng nào trễ hạn. 🎉</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Đơn hàng</th>
                <th className="hide-mobile">Khách hàng</th>
                <th>Hạn giao</th>
                <th className="text-right">Trễ</th>
                <th className="text-right hide-mobile">Tổng tiền</th>
                <th className="text-right">Còn nợ</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.order_id}>
                  <td><strong>{row.order_number}</strong></td>
                  <td className="hide-mobile">{row.customer_name}</td>
                  <td className="td-muted">{row.delivery_date}</td>
                  <td className="numeric-cell" style={{
                    color: row.days_overdue > 7 ? 'var(--danger)' : 'var(--warning-strong)',
                    fontWeight: row.days_overdue > 7 ? 700 : 600,
                  }}>
                    {row.days_overdue} ngày
                  </td>
                  <td className="numeric-cell hide-mobile">{formatCurrency(row.total_amount)}</td>
                  <td className={row.balance_due > 0 ? 'numeric-debt' : 'numeric-paid'}>
                    {formatCurrency(row.balance_due)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
