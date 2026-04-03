import type { OverdueOrderRow } from '@/api/reports.api'

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
      <div style={{ padding: '0 1.25rem 1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.75rem',
        }}>
          <KpiCard
            label="Tổng đơn trễ"
            value={String(data.length)}
            color={data.length > 0 ? '#c0392b' : '#0c8f68'}
          />
          <KpiCard
            label="Trễ > 7 ngày"
            value={String(severeCount)}
            color={severeCount > 0 ? '#c0392b' : '#0c8f68'}
          />
          <KpiCard
            label="Tổng nợ đơn trễ"
            value={`${formatCurrency(data.reduce((s, r) => s + r.balance_due, 0))} đ`}
            color="#d97706"
          />
        </div>
      </div>

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
                    color: row.days_overdue > 7 ? '#c0392b' : '#d97706',
                    fontWeight: row.days_overdue > 7 ? 700 : 400,
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

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '1rem',
      background: 'var(--bg)',
    }}>
      <div className="td-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color }}>
        {value}
      </div>
    </div>
  )
}
