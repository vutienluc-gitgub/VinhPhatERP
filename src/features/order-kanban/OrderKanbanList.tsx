import { useState } from 'react';

import { Icon, type IconName } from '@/shared/components';
import { MoneyText } from '@/shared/value';
import type {
  OrderKanbanItem,
  OrderKanbanStatus,
} from '@/domain/orders/kanban.types';

import { KanbanCard } from './OrderKanbanForm';
import { KANBAN_LABELS, calculateTotalAmount } from './constants';

type KanbanColumnProps = {
  status: OrderKanbanStatus;
  label: string;
  icon: IconName;
  accentClass: string;
  items: OrderKanbanItem[];
  movingId: string | null;
  onMove: (id: string, status: OrderKanbanStatus) => void;
  onDropOrder?: (id: string, status: OrderKanbanStatus) => void;
};

export function KanbanColumn({
  status,
  label,
  icon,
  accentClass,
  items,
  movingId,
  onMove,
  onDropOrder,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const columnTotal = calculateTotalAmount(items);

  return (
    <div
      className={`kanban-column-premium col-accent-${status} transition-all ${
        isDragOver ? 'ring-2 ring-primary/50 bg-surface-hover/50' : ''
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const orderId = e.dataTransfer.getData('text/plain');
        if (orderId && onDropOrder) {
          onDropOrder(orderId, status);
        }
      }}
    >
      {/* Column Header */}
      <div className="kanban-column-header flex flex-col gap-1 pb-2">
        <div className="flex items-center justify-between w-full">
          <div
            className={`kanban-column-title flex items-center gap-2 ${accentClass}`}
          >
            <Icon name={icon} size={16} />
            <span className="font-bold text-sm text-foreground">{label}</span>
          </div>
          <span className="kanban-column-badge px-2 py-0.5 rounded-full text-xs font-bold bg-surface-secondary text-foreground border border-border">
            {items.length}
          </span>
        </div>

        {/* Column Total */}
        <div className="flex items-center justify-between text-[0.72rem] text-muted-foreground pt-1 border-t border-border/40">
          <span>{KANBAN_LABELS.TOTAL_AMOUNT_LABEL}</span>
          <span className="font-semibold text-foreground">
            <MoneyText value={columnTotal} />
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="kanban-column-body flex-1 overflow-y-auto space-y-2.5 pt-1">
        {items.length === 0 ? (
          <div className="text-center py-10 px-4 text-muted-foreground text-xs flex flex-col items-center gap-2 border border-dashed border-border/60 rounded-lg">
            <Icon name="Inbox" size={24} className="text-muted-foreground/60" />
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
