import type { ProductionEfficiencyRow, OnTimeDeliveryRow } from '@/api/reports.api'

type ProductionSectionProps = {
  efficiencyData: ProductionEfficiencyRow[]
  onTimeData: OnTimeDeliveryRow[]
  isLoading: boolean
}

function formatNum(n: number, decimals = 1): string {
  return n.toFixed(decimals).replace(/\.0$/, '')
}

type StageSummary = {
  stage: string
  totalOrders: number
  lateCount: number
  onTimeCount: number
  avgDeviation: number
  latePct: number
}

const STAGE_LABELS: Record<string, string> = {
  weaving: 'Dệt',
  dyeing: 'Nhuộm',
  finishing: 'Hoàn tất',
  quality_check: 'KCS',
  delivery: 'Giao hàng',
}

function computeStages(data: ProductionEfficiencyRow[]): StageSummary[] {
  const stageMap = new Map<string, ProductionEfficiencyRow[]>()
  for (const row of data) {
    const rows = stageMap.get(row.stage) ?? []
    rows.push(row)
    stageMap.set(row.stage, rows)
  }

  return Array.from(stageMap.entries()).map(([stage, rows]) => {
    const withDeviation = rows.filter((r) => r.deviation_days !== null)
    const lateCount = rows.filter((r) => r.is_late === true).length
    const onTimeCount = rows.filter((r) => r.is_late === false).length
    const avgDeviation =
      withDeviation.length > 0
        ? withDeviation.reduce((s, r) => s + (r.deviation_days ?? 0), 0) / withDeviation.length
        : 0

    return {
      stage,
      totalOrders: rows.length,
      lateCount,
      onTimeCount,
      avgDeviation,
      latePct: rows.length > 0 ? Math.round((lateCount / rows.length) * 100) : 0,
    }
  })
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-sm)',
      padding: '0.75rem 1rem',
    }}>
      <div className="td-muted" style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: '1.3rem', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color }}>
        {value}
      </div>
      {sub && <div className="td-muted" style={{ fontSize: '0.75rem' }}>{sub}</div>}
    </div>
  )
}

export function ProductionSection({ efficiencyData, onTimeData, isLoading }: ProductionSectionProps) {
  const stages = computeStages(efficiencyData)

  const totalDeliveries = onTimeData.length
  const onTimeCount = onTimeData.filter((r) => r.is_on_time === true).length
  const onTimePct = totalDeliveries > 0 ? Math.round((onTimeCount / totalDeliveries) * 100) : 0
  const worstStage = stages.length > 0 ? stages.reduce((a, b) => (a.latePct > b.latePct ? a : b)) : null
  const avgOverallDeviation =
    stages.length > 0
      ? stages.reduce((s, st) => s + st.avgDeviation, 0) / stages.length
      : 0

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Hiệu suất</p>
            <h3>Sản xuất & Giao hàng</h3>
          </div>
        </div>
      </div>

      {isLoading ? (
        <p className="table-empty">Đang tải...</p>
      ) : efficiencyData.length === 0 ? (
        <p className="table-empty">Chưa có dữ liệu tiến độ.</p>
      ) : (
        <>
          {/* KPI row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '0.75rem',
            padding: '0 1.25rem 1rem',
          }}>
            <KpiCard
              label="Giao đúng hạn"
              value={`${onTimePct}%`}
              sub={`${onTimeCount}/${totalDeliveries} đơn`}
              color={onTimePct >= 80 ? '#0c8f68' : onTimePct >= 60 ? '#d97706' : '#c0392b'}
            />
            <KpiCard
              label="Trung bình trễ"
              value={`${formatNum(avgOverallDeviation)} ngày`}
              sub="trung bình tất cả công đoạn"
              color={avgOverallDeviation <= 2 ? '#0c8f68' : '#c0392b'}
            />
            {worstStage && worstStage.latePct > 0 && (
              <KpiCard
                label="Công đoạn yếu nhất"
                value={STAGE_LABELS[worstStage.stage] ?? worstStage.stage}
                sub={`${worstStage.latePct}% trễ (${worstStage.lateCount}/${worstStage.totalOrders})`}
                color="#c0392b"
              />
            )}
            <KpiCard label="Tổng đơn theo dõi" value={String(totalDeliveries)} />
          </div>

          {/* Stage breakdown table */}
          <div className="data-table-wrap card-table-section">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Công đoạn</th>
                  <th className="text-right">Đơn</th>
                  <th className="text-right">Đúng hạn</th>
                  <th className="text-right">Trễ</th>
                  <th className="text-right">% Trễ</th>
                  <th className="text-right hide-mobile">TB trễ (ngày)</th>
                </tr>
              </thead>
              <tbody>
                {stages.map((st) => (
                  <tr key={st.stage}>
                    <td><strong>{STAGE_LABELS[st.stage] ?? st.stage}</strong></td>
                    <td className="numeric-cell">{st.totalOrders}</td>
                    <td className="numeric-cell" style={{ color: '#0c8f68' }}>{st.onTimeCount}</td>
                    <td className="numeric-cell" style={{ color: st.lateCount > 0 ? '#c0392b' : undefined }}>
                      {st.lateCount}
                    </td>
                    <td className="numeric-cell">
                      <span style={{
                        display: 'inline-block',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: st.latePct > 30 ? '#fdecea' : st.latePct > 10 ? '#fff3cd' : '#e8f5e9',
                        color: st.latePct > 30 ? '#c0392b' : st.latePct > 10 ? '#856404' : '#0c8f68',
                      }}>
                        {st.latePct}%
                      </span>
                    </td>
                    <td className="numeric-cell hide-mobile">{formatNum(st.avgDeviation)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
