import type { MonthlyRevenueRow, RevenueByFabricRow, PaymentCollectionRow } from '@/api/reports.api'

import { KpiCard, KpiGrid } from '@/shared/components/KpiCard'

type RevenueTrendSectionProps = {
  monthlyData: MonthlyRevenueRow[]
  fabricData: RevenueByFabricRow[]
  paymentData: PaymentCollectionRow[]
  isLoading: boolean
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatShortCurrency(value: number): string {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}T`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Tr`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

function computeGrowth(data: MonthlyRevenueRow[]): { pct: number; label: string } | null {
  if (data.length < 2) return null
  const current = data[0]!.total_revenue
  const previous = data[1]!.total_revenue
  if (previous === 0) return null
  const pct = Math.round(((current - previous) / previous) * 100)
  return { pct, label: pct >= 0 ? `+${pct}%` : `${pct}%` }
}

/** Simple inline bar chart using CSS standard tokens */
function MiniBarChart({ data, maxValue }: { data: { label: string; value: number; color?: string }[]; maxValue: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="td-muted" style={{ fontSize: '0.7rem', minWidth: '5rem', textAlign: 'right', fontWeight: 600 }}>
            {d.label}
          </span>
          <div style={{ flex: 1, height: '1.2rem', background: 'var(--border)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{
              width: maxValue > 0 ? `${Math.max((d.value / maxValue) * 100, 1)}%` : '0%',
              height: '100%',
              background: d.color ?? 'var(--primary)',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              paddingLeft: '0.35rem',
              transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: 0.9,
            }}>
              {d.value / maxValue > 0.2 && (
                <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>
                  {formatShortCurrency(d.value)}
                </span>
              )}
            </div>
          </div>
          {d.value / maxValue <= 0.2 && (
            <span className="td-muted" style={{ fontSize: '0.7rem' }}>{formatShortCurrency(d.value)}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export function RevenueTrendSection({ monthlyData, fabricData, paymentData, isLoading }: RevenueTrendSectionProps) {
  const totalRevenue = monthlyData.reduce((s, r) => s + r.total_revenue, 0)
  const totalCollected = monthlyData.reduce((s, r) => s + r.total_collected, 0)
  const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0
  const growth = computeGrowth(monthlyData)

  // Aggregate payment by method
  const methodMap = new Map<string, number>()
  for (const row of paymentData) {
    methodMap.set(row.payment_method, (methodMap.get(row.payment_method) ?? 0) + row.total_collected)
  }
  const paymentMethods = Array.from(methodMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([method, total]) => ({ label: method, value: total }))

  const maxMonthlyRevenue = monthlyData.length > 0 ? Math.max(...monthlyData.map((r) => r.total_revenue)) : 0
  const maxFabricRevenue = fabricData.length > 0 ? Math.max(...fabricData.map((r) => r.total_revenue)) : 0

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Xu hướng</p>
            <h3>Doanh thu & Thu tiền</h3>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="table-empty">Đang tải...</p>
      ) : monthlyData.length === 0 ? (
        <p className="table-empty">Chưa có dữ liệu doanh thu.</p>
      ) : (
        <>
          {/* KPIs */}
          <KpiGrid>
            <KpiCard
              label="Tổng doanh thu"
              value={`${formatCurrency(totalRevenue)} đ`}
              icon="💰"
            />
            <KpiCard
              label="Đã thu"
              value={`${formatCurrency(totalCollected)} đ`}
              color="var(--success)"
              icon={`${collectionRate}%`}
            />
            {growth && (
              <KpiCard
                label="Tăng trưởng"
                value={growth.label}
                color={growth.pct >= 0 ? 'var(--success)' : 'var(--danger)'}
                icon="📈"
              />
            )}
            <KpiCard
              label="Còn phải thu"
              value={`${formatCurrency(totalRevenue - totalCollected)} đ`}
              color="var(--warning)"
              icon="⏳"
            />
          </KpiGrid>

          {/* Monthly revenue trend */}
          <div style={{ padding: '0 1.25rem 1rem' }}>
            <div className="td-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem' }}>
              Doanh thu theo tháng
            </div>
            <MiniBarChart
              data={[...monthlyData].reverse().map((r) => ({
                label: r.month,
                value: r.total_revenue,
                color: 'var(--primary)',
              }))}
              maxValue={maxMonthlyRevenue}
            />
          </div>

          {/* Revenue by fabric type */}
          {fabricData.length > 0 && (
            <div style={{ padding: '0 1.25rem 1.5rem' }}>
              <div className="td-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '1rem' }}>
                Doanh thu theo loại vải (Top 10)
              </div>
              <MiniBarChart
                data={fabricData.slice(0, 10).map((r) => ({
                  label: `${r.fabric_type}${r.color_name ? ` (${r.color_name})` : ''}`,
                  value: r.total_revenue,
                  color: 'var(--accent)',
                }))}
                maxValue={maxFabricRevenue}
              />
            </div>
          )}

          {/* Payment method breakdown */}
          {paymentMethods.length > 0 && (
            <div className="data-table-wrap card-table-section">
              <div style={{ padding: '0.5rem 1.25rem 0' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--fg-muted)' }}>Phân bổ phương thức thanh toán</strong>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Phương thức</th>
                    <th className="text-right">Số tiền thu</th>
                    <th className="text-right">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentMethods.map(({ label, value }) => (
                    <tr key={label}>
                      <td><strong>{label}</strong></td>
                      <td className="numeric-cell">{formatCurrency(value)} đ</td>
                      <td className="numeric-cell">
                        {totalCollected > 0 ? Math.round((value / totalCollected) * 100) : 0}%
                      </td>
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
