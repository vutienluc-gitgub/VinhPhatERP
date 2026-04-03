import type { DebtAgingRow } from '@/api/reports.api'

type DebtAgingSectionProps = {
  data: DebtAgingRow[]
  isLoading: boolean
}

const BUCKET_ORDER = ['0-30', '31-60', '61-90', '90+'] as const
const BUCKET_LABELS: Record<string, string> = {
  '0-30': '0–30 ngày',
  '31-60': '31–60 ngày',
  '61-90': '61–90 ngày',
  '90+': 'Trên 90 ngày',
}
const BUCKET_COLORS: Record<string, string> = {
  '0-30': '#0c8f68',
  '31-60': '#d97706',
  '61-90': '#e67e22',
  '90+': '#c0392b',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

type BucketSummary = {
  bucket: string
  label: string
  color: string
  count: number
  total: number
  percent: number
}

function computeBuckets(data: DebtAgingRow[]): BucketSummary[] {
  const grandTotal = data.reduce((s, r) => s + r.balance_due, 0)
  return BUCKET_ORDER.map((bucket) => {
    const rows = data.filter((r) => r.aging_bucket === bucket)
    const total = rows.reduce((s, r) => s + r.balance_due, 0)
    return {
      bucket,
      label: BUCKET_LABELS[bucket] ?? bucket,
      color: BUCKET_COLORS[bucket] ?? '#888',
      count: rows.length,
      total,
      percent: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
    }
  })
}

export function DebtAgingSection({ data, isLoading }: DebtAgingSectionProps) {
  const totalDebt = data.reduce((s, r) => s + r.balance_due, 0)
  const buckets = computeBuckets(data)
  const criticalRows = data.filter((r) => r.aging_bucket === '90+')

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Phân tích chuyên sâu</p>
            <h3>Tuổi nợ (Debt Aging)</h3>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="table-empty">Đang tải...</p>
      ) : data.length === 0 ? (
        <p className="table-empty">Không có công nợ nào.</p>
      ) : (
        <>
          {/* Aging bar visual */}
          <div style={{ padding: '0 1.25rem 1rem' }}>
            <div style={{ marginBottom: '0.75rem' }}>
              <span className="td-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Phân bổ công nợ: {formatCurrency(totalDebt)} đ
              </span>
            </div>
            <div style={{
              display: 'flex',
              height: '2rem',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              border: '1px solid var(--border)',
            }}>
              {buckets.filter(b => b.percent > 0).map((b) => (
                <div
                  key={b.bucket}
                  title={`${b.label}: ${formatCurrency(b.total)} đ (${b.percent}%)`}
                  style={{
                    width: `${b.percent}%`,
                    background: b.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    minWidth: b.percent > 5 ? undefined : '0',
                  }}
                >
                  {b.percent >= 10 ? `${b.percent}%` : ''}
                </div>
              ))}
            </div>

            {/* Bucket legend cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.75rem',
              marginTop: '0.75rem',
            }}>
              {buckets.map((b) => (
                <div key={b.bucket} style={{
                  border: `2px solid ${b.color}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  background: 'var(--bg)',
                }}>
                  <div className="td-muted" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    {b.label}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: b.color, fontVariantNumeric: 'tabular-nums' }}>
                    {formatCurrency(b.total)} đ
                  </div>
                  <div className="td-muted" style={{ fontSize: '0.75rem' }}>
                    {b.count} đơn · {b.percent}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Critical debts table (>90 days) */}
          {criticalRows.length > 0 && (
            <div className="data-table-wrap card-table-section">
              <div style={{ padding: '0.5rem 1.25rem 0' }}>
                <strong style={{ fontSize: '0.85rem', color: '#c0392b' }}>
                  ⚠ Nợ trên 90 ngày — cần hành động ngay ({criticalRows.length} đơn)
                </strong>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Đơn hàng</th>
                    <th className="hide-mobile">Khách hàng</th>
                    <th>Ngày đặt</th>
                    <th className="text-right">Ngày nợ</th>
                    <th className="text-right">Còn nợ</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalRows.map((row) => (
                    <tr key={row.order_id}>
                      <td><strong>{row.order_number}</strong></td>
                      <td className="hide-mobile">{row.customer_name}</td>
                      <td className="td-muted">{row.order_date}</td>
                      <td className="numeric-cell" style={{ color: '#c0392b', fontWeight: 700 }}>
                        {row.days_since_order} ngày
                      </td>
                      <td className="numeric-debt">{formatCurrency(row.balance_due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
