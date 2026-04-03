import type { InventorySummary } from '@/api/reports.api'

type InventorySectionProps = {
  data: InventorySummary | undefined
  isLoading: boolean
}

export function InventorySection({ data, isLoading }: InventorySectionProps) {
  const rawRolls = data?.raw.reduce((s, r) => s + r.roll_count, 0) ?? 0
  const rawLength = data?.raw.reduce((s, r) => s + r.total_length_m, 0) ?? 0
  const finishedRolls = data?.finished.reduce((s, r) => s + r.roll_count, 0) ?? 0
  const finishedLength = data?.finished.reduce((s, r) => s + r.total_length_m, 0) ?? 0

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Báo cáo</p>
            <h3>Tồn kho</h3>
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
          <KpiCard label="Cuộn vải mộc" value={String(rawRolls)} color="#0b6bcb" />
          <KpiCard label="Mét vải mộc" value={formatNumber(rawLength)} color="#0b6bcb" />
          <KpiCard label="Cuộn thành phẩm" value={String(finishedRolls)} color="#0c8f68" />
          <KpiCard label="Mét thành phẩm" value={formatNumber(finishedLength)} color="#0c8f68" />
        </div>
      </div>

      {isLoading ? (
        <p className="table-empty">Đang tải...</p>
      ) : (
        <>
          <InventoryTable title="Vải mộc (Raw)" rows={data?.raw ?? []} />
          <InventoryTable title="Vải thành phẩm (Finished)" rows={data?.finished ?? []} />
        </>
      )}
    </div>
  )
}

type InventoryRow = {
  fabric_type: string
  color_name: string | null
  color_code: string | null
  quality_grade: string | null
  roll_count: number
  total_length_m: number
  total_weight_kg: number
}

function InventoryTable({ title, rows }: { title: string; rows: InventoryRow[] }) {
  return (
    <div className="data-table-wrap card-table-section">
      <div style={{ padding: '0.5rem 1.25rem 0' }}>
        <strong style={{ fontSize: '0.85rem' }}>{title}</strong>
      </div>
      {rows.length === 0 ? (
        <p className="table-empty">Không có tồn kho.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Loại vải</th>
              <th className="hide-mobile">Màu</th>
              <th className="hide-mobile">Phân loại</th>
              <th className="text-right">Cuộn</th>
              <th className="text-right">Mét</th>
              <th className="text-right hide-mobile">Kg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.fabric_type}-${row.color_name}-${row.quality_grade}-${i}`}>
                <td><strong>{row.fabric_type}</strong></td>
                <td className="hide-mobile">
                  {row.color_name ?? '—'}
                  {row.color_code && (
                    <span className="td-muted" style={{ fontSize: '0.8rem', marginLeft: '0.3rem' }}>
                      ({row.color_code})
                    </span>
                  )}
                </td>
                <td className="td-muted hide-mobile">{row.quality_grade ?? '—'}</td>
                <td className="numeric-cell">{row.roll_count}</td>
                <td className="numeric-cell">{formatNumber(row.total_length_m)}</td>
                <td className="numeric-cell hide-mobile">{formatNumber(row.total_weight_kg)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}><strong>Tổng</strong></td>
              <td className="numeric-cell">
                <strong>{rows.reduce((s, r) => s + r.roll_count, 0)}</strong>
              </td>
              <td className="numeric-cell">
                <strong>{formatNumber(rows.reduce((s, r) => s + r.total_length_m, 0))}</strong>
              </td>
              <td className="numeric-cell hide-mobile">
                <strong>{formatNumber(rows.reduce((s, r) => s + r.total_weight_kg, 0))}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  )
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value)
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
