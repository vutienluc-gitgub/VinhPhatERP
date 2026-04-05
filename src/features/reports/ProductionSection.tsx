import type { ProductionEfficiencyRow, OnTimeDeliveryRow } from '@/api/reports.api'
import { KpiCard, KpiGrid } from '@/shared/components/KpiCard'

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
          {/* KPI columns */}
          <KpiGrid>
            <KpiCard
              label="Giao đúng hạn"
              value={`${onTimePct}%`}
              icon="✅"
              color={onTimePct >= 80 ? 'var(--success)' : onTimePct >= 60 ? 'var(--warning)' : 'var(--danger)'}
            />
            <KpiCard
              label="TB trễ (ngày)"
              value={formatNum(avgOverallDeviation)}
              color={avgOverallDeviation <= 2 ? 'var(--success)' : 'var(--danger)'}
            />
            {worstStage && worstStage.latePct > 0 && (
              <KpiCard
                label="Mắc xích yếu"
                value={STAGE_LABELS[worstStage.stage] ?? worstStage.stage}
                color="var(--danger)"
              />
            )}
            <KpiCard label="Đơn theo dõi" value={String(totalDeliveries)} />
          </KpiGrid>

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
                    <td className="numeric-cell" style={{ color: 'var(--success)' }}>{st.onTimeCount}</td>
                    <td className="numeric-cell" style={{ color: st.lateCount > 0 ? 'var(--danger)' : undefined }}>
                      {st.lateCount}
                    </td>
                    <td className="numeric-cell">
                      <span style={{
                        display: 'inline-block',
                        padding: '0.1rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: st.latePct > 30 ? 'var(--surface-danger)' : st.latePct > 10 ? 'var(--surface-warning)' : 'var(--surface-success)',
                        color: st.latePct > 30 ? 'var(--danger)' : st.latePct > 10 ? 'var(--warning-strong)' : 'var(--success)',
                        border: '1px solid currentColor',
                        opacity: 0.8,
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
