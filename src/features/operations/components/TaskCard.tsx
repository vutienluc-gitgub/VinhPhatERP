import { type Ref, forwardRef } from 'react';

import { Badge } from '@/shared/components';
import type { Task, Employee, Kpi } from '@/domain/operations/types';

interface TaskCardProps {
  task: Task;
  employees: Pick<Employee, 'id' | 'name'>[];
  kpis: Pick<Kpi, 'id' | 'code'>[];
  onClick: () => void;
  onTapMove?: (task: Task) => void;
  blockedReason?: string;
  /** Extra className appended to card wrapper */
  className?: string;
  /** Inline styles (used by sortable wrapper for transform/transition) */
  style?: React.CSSProperties;
  /** Spread attributes from dnd-kit */
  dragAttributes?: React.HTMLAttributes<HTMLDivElement>;
  /** Spread listeners from dnd-kit */
  dragListeners?: Record<string, unknown>;
}

export const TaskCard = forwardRef(function TaskCard(
  {
    task,
    employees,
    kpis,
    onClick,
    onTapMove,
    blockedReason,
    className = '',
    style,
    dragAttributes,
    dragListeners,
  }: TaskCardProps,
  ref: Ref<HTMLDivElement>,
) {
  const assignee = employees.find((e) => e.id === task.assignee_id);
  const kpi = kpis.find((k) => k.id === task.linked_kpi_id);

  return (
    <div
      ref={ref}
      style={style}
      data-testid={`kanban-task-${task.id}`}
      {...dragAttributes}
      {...(dragListeners as React.HTMLAttributes<HTMLDivElement>)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-lg bg-white border border-zinc-200 p-3 text-xs shadow-sm hover:border-indigo-300 transition-all group relative ${className}`}
    >
      {onTapMove && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onTapMove(task);
          }}
          className="absolute top-2 right-2 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 opacity-60 hover:opacity-100 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all"
          aria-label="Chuyển trạng thái nhanh"
        >
          →
        </button>
      )}
      <div className="font-semibold text-zinc-900 leading-snug group-hover:text-indigo-600 mb-2">
        {task.title}
      </div>
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {task.priority !== 'normal' && (
          <Badge
            variant={task.priority === 'urgent' ? 'danger' : 'warning'}
            className="text-[9px] py-0 px-1.5 h-4 uppercase"
          >
            {task.priority}
          </Badge>
        )}
        {kpi && (
          <Badge variant="purple" className="text-[9px] py-0 px-1.5 h-4">
            {kpi.code}
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] text-zinc-500">
        <div className="flex items-center gap-1.5">
          {assignee && (
            <div className="flex items-center gap-1">
              <span className="h-4 w-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px] font-bold">
                {assignee.name.slice(0, 1)}
              </span>
              <span className="truncate max-w-[70px] font-medium">
                {assignee.name}
              </span>
            </div>
          )}
        </div>
        <span className="font-medium text-zinc-400 bg-zinc-50 px-1 rounded">
          {task.due_date?.slice(5) ?? '—'}
        </span>
      </div>
      {blockedReason && (
        <div className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-700">
          {blockedReason}
        </div>
      )}
    </div>
  );
});
