import type { DebtByCustomerRow } from '@/api/reports.api'
import { KpiCard, KpiGrid } from '@/shared/components/KpiCard'

type DebtSectionProps = {
  data: DebtByCustomerRow[]
  isLoading: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function DebtSection({ data, isLoading }: DebtSectionProps) {
  const totalDebt = data.reduce((sum, r) => sum + r.balance_due, 0)
  const customerCount = data.length

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Báo cáo</p>
            <h3>Công nợ theo khách hàng</h3>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ padding: '0 1.25rem 1rem' }}>
        <KpiGrid>
          <KpiCard
            label="Tổng công nợ"
            value={`${formatCurrency(totalDebt)} đ`}
            color={totalDebt > 0 ? '#c0392b' : '#0c8f68'}
          />
          <KpiCard label="Khách còn nợ" value={String(customerCount)} color="#d97706" />
        </KpiGrid>
      </div>

      {/* Table */}
      <div className="data-table-wrap card-table-section">
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : data.length === 0 ? (
          <p className="table-empty">Không có khách hàng nào còn công nợ.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th className="hide-mobile">Mã KH</th>
                <th className="text-right hide-mobile">Số đơn</th>
                <th className="text-right hide-mobile">Tổng tiền</th>
                <th className="text-right hide-mobile">Đã thu</th>
                <th className="text-right">Còn nợ</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.customer_id}>
                  <td><strong>{row.customer_name}</strong></td>
                  <td className="td-muted hide-mobile">{row.customer_code || '—'}</td>
                  <td className="numeric-cell hide-mobile">{row.total_orders}</td>
                  <td className="numeric-cell hide-mobile">{formatCurrency(row.total_amount)}</td>
                  <td className="numeric-cell hide-mobile">{formatCurrency(row.paid_amount)}</td>
                  <td className="numeric-debt">{formatCurrency(row.balance_due)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}><strong>Tổng cộng ({customerCount} KH)</strong></td>
                <td className="numeric-cell hide-mobile">
                  <strong>{formatCurrency(data.reduce((s, r) => s + r.total_amount, 0))}</strong>
                </td>
                <td className="numeric-cell hide-mobile">
                  <strong>{formatCurrency(data.reduce((s, r) => s + r.paid_amount, 0))}</strong>
                </td>
                <td className="numeric-debt">
                  <strong>{formatCurrency(totalDebt)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
