import { useNavigate } from 'react-router-dom'
import { formatCurrency } from '@/shared/utils/format'
import type { OrderKanbanItem, OrderKanbanStatus } from './types'
import styles from './kanban.module.css'

const NEXT_STATUS: Partial<Record<OrderKanbanStatus, { label: string; next: OrderKanbanStatus }>> = {
  draft: { label: '✓ Xác nhận', next: 'confirmed' },
  confirmed: { label: '🚚 Xuất kho', next: 'delivering' },
  delivering: { label: '✅ Hoàn thành', next: 'completed' },
}

const PREV_STATUS: Partial<Record<OrderKanbanStatus, { label: string; prev: OrderKanbanStatus }>> = {
  confirmed: { label: '← Draft', prev: 'draft' },
  delivering: { label: '← Confirmed', prev: 'confirmed' },
}

type KanbanCardProps = {
  item: OrderKanbanItem
  onMove: (id: string, status: OrderKanbanStatus) => void
  isMoving: boolean
}

export function KanbanCard({ item, onMove, isMoving }: KanbanCardProps) {
  const navigate = useNavigate()

  const isOverdue =
    item.delivery_date &&
    new Date(item.delivery_date) < new Date() &&
    item.status !== 'completed'

  const next = NEXT_STATUS[item.status]
  const prev = PREV_STATUS[item.status]

  const deliveryLabel = item.delivery_date
    ? new Date(item.delivery_date).toLocaleDateString('vi-VN')
    : '—'

  return (
    <div
      className={`${styles['kanban-card']} ${isOverdue ? styles['overdue'] : ''}`}
      onClick={() => navigate(`/orders/${item.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders/${item.id}`)}
    >
      {/* Header */}
      <div className={styles['kanban-card-header']}>
        <span className={styles['kanban-card-order']}>{item.order_number}</span>
        {isOverdue && <span className={styles['kanban-card-warning']}>⚠ Quá hạn</span>}
      </div>

      {/* Customer */}
      <div className={styles['kanban-card-customer']}>{item.customer_name}</div>

      {/* Amount */}
      <div className={styles['kanban-card-amount']}>{formatCurrency(item.total_amount)} đ</div>

      {/* Meta */}
      <div className={styles['kanban-card-meta']}>
        <span>📅 {deliveryLabel}</span>
      </div>

      {/* Actions */}
      {(next || prev) && (
        <div
          className={styles['kanban-card-actions']}
          onClick={(e) => e.stopPropagation()}
        >
          {prev && (
            <button
              type="button"
              className={`${styles['kanban-action-btn']} ${styles['danger']}`}
              disabled={isMoving}
              onClick={() => onMove(item.id, prev.prev)}
            >
              {prev.label}
            </button>
          )}
          {next && (
            <button
              type="button"
              className={`${styles['kanban-action-btn']} ${styles['primary']}`}
              disabled={isMoving}
              onClick={() => onMove(item.id, next.next)}
            >
              {isMoving ? '...' : next.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
