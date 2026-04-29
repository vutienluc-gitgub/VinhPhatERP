import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useRef } from 'react';

import { Badge } from '@/shared/components';

type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'done'
  | 'cancelled';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  task_type: 'growth' | 'maintenance' | 'admin' | 'urgent';
  assignee_id?: string | null;
  reviewer_id?: string | null;
  linked_kpi_id?: string | null;
  due_date?: string | null;
  description?: string | null;
  order_id?: string | null;
  work_order_id?: string | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  tenant_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Employee {
  id: string;
  name: string;
}

interface Kpi {
  id: string;
  code: string;
}

interface SortableTaskCardProps {
  task: Task;
  employees: Employee[];
  kpis: Kpi[];
  onClick: () => void;
  onTapMove: (task: Task) => void;
  blockedReason?: string;
  shouldRecoil?: boolean;
}

export function SortableTaskCard({
  task,
  employees,
  kpis,
  onClick,
  onTapMove,
  blockedReason,
  shouldRecoil,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const cardRef = useRef<HTMLDivElement | null>(null);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  useEffect(() => {
    if (!shouldRecoil || !cardRef.current) {
      return;
    }

    cardRef.current.animate(
      [
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(6px)' },
        { transform: 'translateX(-4px)' },
        { transform: 'translateX(0)' },
      ],
      {
        duration: 320,
        easing: 'ease-out',
      },
    );
  }, [shouldRecoil]);

  const assignee = employees.find((e) => e.id === task.assignee_id);
  const kpi = kpis.find((k) => k.id === task.linked_kpi_id);

  return (
    <div
      ref={(node) => {
        cardRef.current = node;
        setNodeRef(node);
      }}
      style={style}
      data-testid={`kanban-task-${task.id}`}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded-lg bg-white border border-zinc-200 p-3 text-xs shadow-sm hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing group touch-none relative"
    >
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
}
