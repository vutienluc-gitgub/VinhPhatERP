import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import type {
  Task,
  TaskStatus,
  Employee,
  Kpi,
} from '@/domain/operations/types';
import { Icon } from '@/shared/components';

import { SortableTaskCard } from './SortableTaskCard';
import { TaskCard } from './TaskCard';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  employees: Pick<Employee, 'id' | 'name'>[];
  kpis: Pick<Kpi, 'id' | 'code'>[];
  tone: string;
  onTaskClick: (task: Task) => void;
  onTapMove: (task: Task) => void;
  blockedReason?: string;
  blockedTaskId?: string;
  recoilTaskId?: string | null;
  count: number;
  emptyLabel: string;
  /**
   * When true, cards in this column are NOT sortable via drag.
   * The column still accepts drops from other columns (droppable),
   * but intra-column reordering is disabled.
   * Use for "Done" column where chronological order is enforced.
   */
  disableReorder?: boolean;
  hasMore?: boolean;
  onShowMore?: () => void;
  wipLimit?: number;
}

export function KanbanColumn({
  id,
  title,
  tasks,
  employees,
  kpis,
  tone,
  onTaskClick,
  onTapMove,
  blockedReason,
  blockedTaskId,
  recoilTaskId,
  count,
  emptyLabel,
  disableReorder = false,
  hasMore,
  onShowMore,
  wipLimit,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  const renderCards = () => {
    if (disableReorder) {
      return tasks.map((t) => (
        <TaskCard
          key={t.id}
          task={t}
          employees={employees}
          kpis={kpis}
          onClick={() => onTaskClick(t)}
          blockedReason={blockedTaskId === t.id ? blockedReason : undefined}
          className="cursor-pointer"
        />
      ));
    }

    return (
      <SortableContext
        id={id}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {tasks.map((t) => (
          <SortableTaskCard
            key={t.id}
            task={t}
            employees={employees}
            kpis={kpis}
            onClick={() => onTaskClick(t)}
            onTapMove={onTapMove}
            blockedReason={blockedTaskId === t.id ? blockedReason : undefined}
            shouldRecoil={recoilTaskId === t.id}
          />
        ))}
      </SortableContext>
    );
  };

  const getColumnClasses = () => {
    if (blockedReason) return 'bg-rose-100/70 border border-danger/80';

    switch (id) {
      case 'todo':
        return 'bg-zinc-100/80 border border-zinc-200/50';
      case 'in_progress':
        return 'bg-indigo-100/60 border border-info';
      case 'review':
        return 'bg-violet-100/60 border border-violet-100';
      case 'blocked':
        return 'bg-red-100/60 border border-danger';
      case 'done':
        return 'bg-emerald-100/60 border border-success';
      default:
        return 'bg-zinc-100/80 border border-zinc-100/50';
    }
  };

  return (
    <div
      className="flex flex-col min-w-[240px] h-full"
      data-testid={`kanban-column-${id}`}
    >
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${tone.split(' ')[0]}`} />
          <span className="text-sm font-bold text-zinc-700">{title}</span>
        </div>
        <div
          className={`text-xs font-bold px-2 py-0.5 rounded-full border shadow-sm flex items-center gap-1 ${
            wipLimit && count > wipLimit
              ? 'bg-danger text-inverse-foreground border-danger'
              : 'text-zinc-400 bg-surface border-zinc-100'
          }`}
        >
          {wipLimit && count > wipLimit && (
            <span className="text-[10px]">⚠</span>
          )}
          <span>{wipLimit ? `${count}/${wipLimit}` : count}</span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        data-testid={`kanban-dropzone-${id}`}
        className={`flex-1 space-y-3 p-3 rounded-2xl min-h-[500px] transition-colors ${getColumnClasses()}`}
      >
        {blockedReason && (
          <div className="rounded-lg border border-danger bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-danger">
            {blockedReason}
          </div>
        )}
        {renderCards()}
        {tasks.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center text-center rounded-xl bg-surface/50 border border-dashed border-border/60">
            <Icon
              name="Inbox"
              className="h-8 w-8 text-zinc-400 mb-2 opacity-80"
            />
            <span className="text-xs font-bold text-zinc-500 mb-0.5">
              No task
            </span>
            <span className="text-[11px] text-zinc-400 italic">
              {emptyLabel}
            </span>
          </div>
        )}
        {hasMore && onShowMore && (
          <button
            onClick={onShowMore}
            className="w-full py-2 text-xs font-semibold text-foreground bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors mt-2"
          >
            Show more...
          </button>
        )}
      </div>
    </div>
  );
}
