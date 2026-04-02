import { STAGE_LABELS, STAGE_STATUS_LABELS } from './order-progress.module'
import type { ProgressAuditLog, ProgressAuditLogWithOrder } from './types'
import { useRecentAuditLog, useProgressAuditLog } from './useOrderProgress'

type AuditLogProps = {
  orderId?: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) +
    ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

export function ProgressAuditLogView({ orderId }: AuditLogProps) {
  const orderLog = useProgressAuditLog(orderId)
  const recentLog = useRecentAuditLog(orderId ? 0 : 30)
  const { data: logs = [], isLoading, error } = orderId ? orderLog : recentLog

  if (error) {
    return (
      <div className="panel-card">
        <p style={{ color: '#c0392b', padding: '1rem' }}>Lỗi: {(error as Error).message}</p>
      </div>
    )
  }

  return (
    <div className="panel-card card-flush">
      <div className="card-header-area">
        <div className="page-header">
          <div>
            <p className="eyebrow">Lịch sử</p>
            <h3>{orderId ? 'Nhật ký thay đổi' : 'Cập nhật gần đây'}</h3>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 1.25rem 1.25rem' }}>
        {isLoading ? (
          <p className="table-empty">Đang tải...</p>
        ) : logs.length === 0 ? (
          <p className="table-empty">Chưa có lịch sử thay đổi.</p>
        ) : (
          <div className="audit-log-list">
            {logs.map((log) => (
              <AuditLogEntry key={log.id} log={log} showOrder={!orderId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AuditLogEntry({ log, showOrder }: { log: ProgressAuditLog | ProgressAuditLogWithOrder; showOrder: boolean }) {
  const orders = 'orders' in log ? log.orders : undefined
  return (
    <div className="audit-log-entry">
      <div className="audit-log-time">{formatTime(log.created_at)}</div>
      <div className="audit-log-content">
        {showOrder && orders && (
          <span className="audit-log-order">
            {orders.order_number}
            {orders.customers?.name && <span className="td-muted"> — {orders.customers.name}</span>}
          </span>
        )}
        <span className="audit-log-stage">{STAGE_LABELS[log.stage]}</span>
        <span className="audit-log-transition">
          {log.old_status && (
            <>
              <span className={`roll-status ${statusClass(log.old_status)}` } style={{ fontSize: '0.7rem' }}>
                {STAGE_STATUS_LABELS[log.old_status]}
              </span>
              <span className="audit-log-arrow">→</span>
            </>
          )}
          <span className={`roll-status ${statusClass(log.new_status)}`} style={{ fontSize: '0.7rem' }}>
            {STAGE_STATUS_LABELS[log.new_status]}
          </span>
        </span>
        {log.notes && <span className="audit-log-notes">{log.notes}</span>}
      </div>
    </div>
  )
}

function statusClass(status: string): string {
  switch (status) {
    case 'done': return 'in_stock'
    case 'in_progress': return 'in_process'
    case 'skipped': return 'damaged'
    default: return 'shipped'
  }
}
