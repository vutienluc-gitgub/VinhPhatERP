import { useState } from 'react'

import { PRODUCTION_STAGES, STAGE_LABELS, STAGE_STATUS_LABELS } from './order-progress.module'
import type { OrderProgressWithOrder, ProductionStage, StageStatus } from './types'
import { useProgressBoard, useUpdateStageStatus } from './useOrderProgress'

type GroupedByOrder = {
  orderId: string
  orderNumber: string
  customerName: string
  deliveryDate: string | null
  stages: OrderProgressWithOrder[]
}

function groupByOrder(rows: OrderProgressWithOrder[]): GroupedByOrder[] {
  const map = new Map<string, GroupedByOrder>()
  for (const row of rows) {
    let group = map.get(row.order_id)
    if (!group) {
      group = {
        orderId: row.order_id,
        orderNumber: row.orders?.order_number ?? '—',
        customerName: row.orders?.customers?.name ?? '—',
        deliveryDate: row.orders?.delivery_date ?? null,
        stages: [],
      }
      map.set(row.order_id, group)
    }
    group.stages.push(row)
  }
  return Array.from(map.values())
}

function isOverdue(deliveryDate: string | null): boolean {
  if (!deliveryDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return new Date(deliveryDate) < today
}

export function ProgressBoard() {
  const { data: allProgress = [], isLoading, error } = useProgressBoard()
  const updateMutation = useUpdateStageStatus()
  const [stageFilter, setStageFilter] = useState<ProductionStage | ''>('')
  const [statusFilter, setStatusFilter] = useState<StageStatus | ''>('')

  const grouped = groupByOrder(allProgress)

  // Filter orders based on selected stage+status
  const filtered = grouped.filter((group) => {
    if (!stageFilter && !statusFilter) return true
    return group.stages.some((s) => {
      if (stageFilter && s.stage !== stageFilter) return false
      if (statusFilter && s.status !== statusFilter) return false
      return true
    })
  })

  function handleQuickAdvance(row: OrderProgressWithOrder) {
    if (row.status === 'done' || row.status === 'skipped') return
    const nextStatus: StageStatus = row.status === 'pending' ? 'in_progress' : 'done'
    updateMutation.mutate({ progressId: row.id, status: nextStatus })
  }

  if (error) {
    return (
      <div className="panel-card">
        <p style={{ color: '#c0392b', padding: '1rem' }}>Lỗi: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Sản xuất</p>
            <h3>Tiến độ đơn hàng</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filter-bar card-filter-section">
        <div className="filter-field">
          <label htmlFor="stage-filter">Công đoạn</label>
          <select
            id="stage-filter"
            className="field-select"
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value as ProductionStage | '')}
          >
            <option value="">Tất cả</option>
            {PRODUCTION_STAGES.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="status-filter">Trạng thái</label>
          <select
            id="status-filter"
            className="field-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StageStatus | '')}
          >
            <option value="">Tất cả</option>
            <option value="pending">Chờ xử lý</option>
            <option value="in_progress">Đang làm</option>
            <option value="done">Hoàn thành</option>
            <option value="skipped">Bỏ qua</option>
          </select>
        </div>

        {(stageFilter || statusFilter) && (
          <button
            className="btn-secondary"
            type="button"
            onClick={() => { setStageFilter(''); setStatusFilter('') }}
            style={{ alignSelf: 'flex-end' }}
          >
            ✕ Xóa lọc
          </button>
        )}
      </div>

      {/* Board */}
      <div style={{ padding: '0 1.25rem 1.25rem' }}>
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="table-empty">
            {stageFilter || statusFilter
              ? 'Không tìm thấy đơn hàng phù hợp.'
              : 'Chưa có đơn hàng nào được xác nhận.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map((group) => {
              const overdue = isOverdue(group.deliveryDate)
              const doneCount = group.stages.filter((s) => s.status === 'done').length
              const totalCount = group.stages.filter((s) => s.status !== 'skipped').length
              const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0

              return (
                <div
                  key={group.orderId}
                  style={{
                    border: `1px solid ${overdue ? '#e74c3c44' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    background: overdue ? '#fef2f210' : 'var(--bg)',
                  }}
                >
                  {/* Order header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div>
                      <strong>{group.orderNumber}</strong>
                      <span className="td-muted" style={{ marginLeft: '0.5rem' }}>{group.customerName}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                      {group.deliveryDate && (
                        <span style={{ color: overdue ? '#c0392b' : 'var(--muted)' }}>
                          📅 {group.deliveryDate}
                          {overdue && ' ⚠️'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginBottom: '0.5rem' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${pct}%`,
                        background: pct === 100 ? '#0c8f68' : '#0b6bcb',
                        borderRadius: 2,
                        transition: 'width 300ms ease',
                      }}
                    />
                  </div>

                  {/* Stage chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {PRODUCTION_STAGES.map((stageKey) => {
                      const row = group.stages.find((s) => s.stage === stageKey)
                      if (!row) return null
                      const statusCls = row.status === 'done' ? 'in_stock' : row.status === 'in_progress' ? 'in_process' : row.status === 'skipped' ? 'damaged' : 'shipped'
                      const clickable = row.status !== 'done' && row.status !== 'skipped'

                      return (
                        <button
                          key={row.id}
                          type="button"
                          className={`roll-status ${statusCls}`}
                          disabled={updateMutation.isPending || !clickable}
                          onClick={() => clickable && handleQuickAdvance(row)}
                          style={{
                            cursor: clickable ? 'pointer' : 'default',
                            fontSize: '0.72rem',
                            border: 'none',
                          }}
                          title={`${STAGE_LABELS[stageKey]}: ${STAGE_STATUS_LABELS[row.status]}${clickable ? ' — Nhấn để chuyển trạng thái' : ''}`}
                        >
                          {STAGE_LABELS[stageKey]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {updateMutation.error && (
        <p style={{ color: '#c0392b', fontSize: '0.85rem', padding: '0 1.25rem 1rem' }}>
          Lỗi cập nhật: {(updateMutation.error as Error).message}
        </p>
      )}
    </div>
  )
}
