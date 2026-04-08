import styles from './kanban.module.css';
import { KanbanCard } from './OrderKanbanForm';
import type { OrderKanbanItem, OrderKanbanStatus } from './types';

type KanbanColumnProps = {
  status: OrderKanbanStatus;
  label: string;
  emoji: string;
  items: OrderKanbanItem[];
  movingId: string | null;
  onMove: (id: string, status: OrderKanbanStatus) => void;
};

export function KanbanColumn({
  status,
  label,
  emoji,
  items,
  movingId,
  onMove,
}: KanbanColumnProps) {
  return (
    <div className={`${styles['kanban-col']} ${styles[`col-${status}`]}`}>
      <div className={styles['kanban-col-header']}>
        <div className={styles['kanban-col-title']}>
          <span>{emoji}</span>
          <span>{label}</span>
        </div>
        <span className={styles['kanban-col-badge']}>{items.length}</span>
      </div>

      <div className={styles['kanban-col-body']}>
        {items.length === 0 ? (
          <div className={styles['kanban-empty']}>
            <p>Không có đơn hàng</p>
          </div>
        ) : (
          items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              onMove={onMove}
              isMoving={movingId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}
