import { type Ref, forwardRef } from 'react';

import { Badge, Icon } from '@/shared/components';
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

  const getCardClasses = () => {
    switch (task.status) {
      case 'todo':
        return 'border-zinc-200 hover:border-zinc-400 bg-surface';
      case 'in_progress':
        return 'border-info hover:border-info bg-indigo-50/40';
      case 'review':
        return 'border-violet-200 hover:border-violet-400 bg-violet-50/40';
      case 'blocked':
        return 'border-danger hover:border-danger bg-red-50/40';
      case 'done':
        return 'border-success hover:border-success bg-emerald-50/40';
      default:
        return 'border-zinc-200 hover:border-info bg-surface';
    }
  };

  const getPriorityBadge = () => {
    switch (task.priority) {
      case 'urgent':
        return (
          <span className="flex items-center gap-1 text-danger bg-danger-soft px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">
            <Icon name="AlertCircle" size={12} /> URGENT
          </span>
        );
      case 'high':
        return (
          <span className="flex items-center gap-1 text-warning bg-warning-soft px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">
            <Icon name="ArrowUpCircle" size={12} /> HIGH
          </span>
        );
      case 'low':
        return (
          <span className="flex items-center gap-1 text-success bg-success-soft px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">
            <Icon name="ArrowDownCircle" size={12} /> LOW
          </span>
        );
      default:
        return null;
    }
  };

  const progressPercent =
    task.estimated_hours && task.actual_hours
      ? Math.min(
          100,
          Math.round((task.actual_hours / task.estimated_hours) * 100),
        )
      : 0;

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
      className={`rounded-lg border p-3 text-xs shadow-sm transition-all group relative cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 ${getCardClasses()} ${className}`}
    >
      {/* Quick Action Hover Menu */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity z-10 bg-surface/80 backdrop-blur-sm rounded-md px-1 border border-zinc-100 shadow-sm">
        {onTapMove && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onTapMove(task);
            }}
            className="p-1 text-zinc-400 hover:text-info transition-colors"
            aria-label="Chuyển trạng thái"
          >
            →
          </button>
        )}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClick();
          }}
          className="p-1 text-zinc-400 hover:text-foreground transition-colors font-bold"
          title="Thao tác"
        >
          ⋯
        </button>
      </div>

      <div className="font-semibold text-zinc-900 leading-snug group-hover:text-info mb-2 pr-10">
        {task.title}
      </div>

      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {getPriorityBadge()}
        {kpi && (
          <Badge variant="purple" className="text-[9px] py-0 px-1.5 h-4">
            {kpi.code}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-2">
        <div className="flex items-center gap-1.5">
          {assignee ? (
            <div className="flex items-center gap-1">
              <span className="h-4 w-4 rounded-full bg-info-soft text-inverse-foreground flex items-center justify-center text-[8px] font-bold">
                {assignee.name.slice(0, 1)}
              </span>
              <span className="truncate max-w-[70px] font-medium">
                {assignee.name}
              </span>
            </div>
          ) : (
            <span className="text-zinc-400 font-medium italic">Chưa giao</span>
          )}
        </div>
        <span className="font-medium text-zinc-400 bg-zinc-50 px-1.5 rounded">
          {task.due_date?.slice(5) ?? '—'}
        </span>
      </div>

      {/* Progress Bar */}
      {task.estimated_hours || task.actual_hours ? (
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-zinc-100/60">
          <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${progressPercent >= 100 ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[9px] font-medium text-zinc-400 w-6 text-right">
            {progressPercent}%
          </span>
        </div>
      ) : null}

      {blockedReason && (
        <div className="mt-2 rounded-md border border-danger bg-rose-50 px-2 py-1 text-[10px] font-medium text-danger">
          {blockedReason}
        </div>
      )}
    </div>
  );
});
