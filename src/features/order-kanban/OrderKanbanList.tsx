import { Icon, type IconName } from '@/shared/components';
import type {
  OrderKanbanItem,
  OrderKanbanStatus,
} from '@/domain/orders/kanban.types';

import { KanbanCard } from './OrderKanbanForm';
import { KANBAN_LABELS } from './constants';

type KanbanColumnProps = {
  status: OrderKanbanStatus;
  label: string;
  icon: IconName;
  items: OrderKanbanItem[];
  movingId: string | null;
  onMove: (id: string, status: OrderKanbanStatus) => void;
};

export function KanbanColumn({
  status,
  label,
  icon,
  items,
  movingId,
  onMove,
}: KanbanColumnProps) {
  return (
    <div className={`kanban-column-premium col-accent-${status}`}>
      <div className="kanban-column-header">
        <div className="kanban-column-title">
          <Icon name={icon} size={16} />
          <span>{label}</span>
        </div>
        <span className="kanban-column-badge">{items.length}</span>
      </div>

      <div className="kanban-column-body">
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs font-medium">
            <p>{KANBAN_LABELS.EMPTY_COLUMN}</p>
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
