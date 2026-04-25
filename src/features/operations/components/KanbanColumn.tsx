import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { SortableTaskCard } from './SortableTaskCard';

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

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  employees: Employee[];
  kpis: Kpi[];
  tone: string;
  onTaskClick: (task: Task) => void;
  onTapMove: (task: Task) => void;
  blockedReason?: string;
  blockedTaskId?: string;
  recoilTaskId?: string | null;
  count: number;
  emptyLabel: string;
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
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

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
        <span className="text-xs text-zinc-400 font-bold bg-white px-2 py-0.5 rounded-full border border-zinc-100 shadow-sm">
          {count}
        </span>
      </div>

      <div
        ref={setNodeRef}
        data-testid={`kanban-dropzone-${id}`}
        className={`flex-1 space-y-3 p-3 rounded-2xl min-h-[500px] transition-colors ${
          blockedReason
            ? 'bg-rose-50/70 border border-rose-200/80'
            : 'bg-zinc-50/80 border border-zinc-100/50'
        }`}
      >
        {blockedReason && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-[11px] font-medium text-rose-700">
            {blockedReason}
          </div>
        )}
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
        {tasks.length === 0 && (
          <div className="h-24 flex items-center justify-center text-[11px] text-zinc-400 text-center border-2 border-dashed border-zinc-200/50 rounded-xl bg-white/30 italic">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}
