import { useRawFabricInventory, useFinishedFabricInventory, useYarnInventory } from './useInventory'
import type { InventoryBreakdownRow } from './useInventory'

function fmt(val: number, decimals = 1): string {
  return val.toLocaleString('vi-VN', { maximumFractionDigits: decimals })
}

function fmtCurrency(val: number): string {
  return new Intl.NumberFormat('vi-VN').format(val)
}

function BreakdownTable({ rows, title }: { rows: InventoryBreakdownRow[]; title: string }) {
  if (rows.length === 0) {
    return (
      <div className="table-empty" style={{ padding: '1.5rem 1rem', fontSize: '0.88rem' }}>
        Chưa có dữ liệu {title.toLowerCase()}.
      </div>
    )
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Loại vải</th>
            <th>Màu</th>
            <th>Chất lượng</th>
            <th style={{ textAlign: 'right' }}>Cuộn</th>
            <th style={{ textAlign: 'right' }}>Dài (m)</th>
            <th style={{ textAlign: 'right' }}>Nặng (kg)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{row.fabric_type ?? '—'}</td>
              <td className="td-muted">{row.color_name ?? '—'}</td>
              <td>
                {row.quality_grade ? (
                  <span className={`grade-badge grade-${row.quality_grade}`}>
                    {row.quality_grade}
                  </span>
                ) : '—'}
              </td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.roll_count ?? 0}</td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.total_length_m ?? 0)}</td>
              <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(row.total_weight_kg ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function InventoryPage() {
  const rawQuery = useRawFabricInventory()
  const finishedQuery = useFinishedFabricInventory()
  const yarnQuery = useYarnInventory()

  const isLoading = rawQuery.isLoading || finishedQuery.isLoading || yarnQuery.isLoading
  const hasError = rawQuery.error || finishedQuery.error || yarnQuery.error

  const rawStats = rawQuery.data?.stats
  const finishedStats = finishedQuery.data?.stats
  const yarnStats = yarnQuery.data

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Tồn kho</p>
            <h3>Dashboard tồn kho tổng hợp</h3>
          </div>
        </div>
      </div>

      {isLoading && (
        <p style={{ padding: '2rem 1.25rem', color: 'var(--muted)', textAlign: 'center' }}>
          Đang tải dữ liệu tồn kho…
        </p>
      )}

      {hasError && (
        <p className="error-inline">
          Lỗi tải dữ liệu: {((rawQuery.error ?? finishedQuery.error ?? yarnQuery.error) as Error)?.message}
        </p>
      )}

      {!isLoading && !hasError && (
        <>
          {/* ── KPI Cards ── */}
          <div className="stats-bar" style={{ padding: '0 1.25rem' }}>
            <div className="stat-card stat-primary">
              <span className="stat-label">Sợi — Phiếu nhập</span>
              <span className="stat-value">{yarnStats?.totalReceipts ?? 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Sợi — Giá trị</span>
              <span className="stat-value">
                {fmtCurrency(yarnStats?.totalAmount ?? 0)}
                <span className="stat-unit">đ</span>
              </span>
            </div>
            <div className="stat-card stat-primary">
              <span className="stat-label">Vải mộc — Cuộn</span>
              <span className="stat-value">{rawStats?.totalRolls ?? 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Vải mộc — Tổng dài</span>
              <span className="stat-value">
                {fmt(rawStats?.totalLengthM ?? 0)}
                <span className="stat-unit">m</span>
              </span>
            </div>
            <div className="stat-card stat-primary">
              <span className="stat-label">Thành phẩm — Cuộn</span>
              <span className="stat-value">{finishedStats?.totalRolls ?? 0}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Thành phẩm — Tổng dài</span>
              <span className="stat-value">
                {fmt(finishedStats?.totalLengthM ?? 0)}
                <span className="stat-unit">m</span>
              </span>
            </div>
          </div>

          {/* ── Raw Fabric Breakdown ── */}
          <div className="panel-card card-flush">
            <div className="card-header-area" style={{ paddingBottom: 0 }}>
              <div className="page-header">
                <div>
                  <p className="eyebrow">Vải mộc</p>
                  <h3>Chi tiết tồn kho vải mộc</h3>
                </div>
              </div>
            </div>
            <div style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
              <BreakdownTable rows={rawQuery.data?.breakdown ?? []} title="vải mộc" />
            </div>
          </div>

          {/* ── Finished Fabric Breakdown ── */}
          <div className="panel-card card-flush">
            <div className="card-header-area" style={{ paddingBottom: 0 }}>
              <div className="page-header">
                <div>
                  <p className="eyebrow">Vải thành phẩm</p>
                  <h3>Chi tiết tồn kho thành phẩm</h3>
                </div>
              </div>
            </div>
            <div style={{ padding: '0.75rem 1.25rem 1.25rem' }}>
              <BreakdownTable rows={finishedQuery.data?.breakdown ?? []} title="vải thành phẩm" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}