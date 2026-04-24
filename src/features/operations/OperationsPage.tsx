import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useMemo, useEffect } from 'react';

import {
  useOperationsData,
  useUpdateTask,
} from '@/application/operations/useOperationsData';
import {
  Badge,
  KpiCardPremium,
  KpiGridPremium,
  Button,
  AdaptiveSheet,
  SearchInput,
  Combobox,
  type BadgeVariant,
} from '@/shared/components';

import { Card, CardContent, CardHeader, CardTitle } from './components/Card';
import { ActivityFeed } from './components/ActivityFeed';
import { ProgressList } from './components/ProgressList';
import { TaskForm } from './TaskForm';
import { Task, TaskStatus, Employee, Kpi } from './types';
import { TASK_STATUS_LABELS, OPERATIONS_MESSAGES } from './constants';

interface ColumnConfig {
  key: TaskStatus;
  label: string;
  tone: string;
  badgeVariant: BadgeVariant;
}

const COLUMNS: ColumnConfig[] = [
  {
    key: 'todo',
    label: TASK_STATUS_LABELS.todo,
    tone: 'bg-zinc-100 text-zinc-700',
    badgeVariant: 'gray',
  },
  {
    key: 'in_progress',
    label: TASK_STATUS_LABELS.in_progress,
    tone: 'bg-indigo-100 text-indigo-700',
    badgeVariant: 'info',
  },
  {
    key: 'review',
    label: TASK_STATUS_LABELS.review,
    tone: 'bg-violet-100 text-violet-700',
    badgeVariant: 'purple',
  },
  {
    key: 'blocked',
    label: TASK_STATUS_LABELS.blocked,
    tone: 'bg-red-100 text-red-700',
    badgeVariant: 'danger',
  },
  {
    key: 'done',
    label: TASK_STATUS_LABELS.done,
    tone: 'bg-emerald-100 text-emerald-700',
    badgeVariant: 'success',
  },
];

// --- Sub-components ---

interface SortableTaskCardProps {
  task: Task;
  employees: Employee[];
  kpis: Kpi[];
  onClick: () => void;
}

function SortableTaskCard({
  task,
  employees,
  kpis,
  onClick,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const assignee = employees.find((e) => e.id === task.assignee_id);
  const kpi = kpis.find((k) => k.id === task.linked_kpi_id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="rounded-lg bg-white border border-zinc-200 p-3 text-xs shadow-sm hover:border-indigo-300 transition-all cursor-grab active:cursor-grabbing group touch-none relative"
    >
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
    </div>
  );
}

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  employees: Employee[];
  kpis: Kpi[];
  tone: string;
  onTaskClick: (task: Task) => void;
  count: number;
}

function KanbanColumn({
  id,
  title,
  tasks,
  employees,
  kpis,
  tone,
  onTaskClick,
  count,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col min-w-[240px] h-full">
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
        className="flex-1 space-y-3 p-3 rounded-2xl bg-zinc-50/80 border border-zinc-100/50 min-h-[500px] transition-colors"
      >
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
            />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="h-24 flex items-center justify-center text-[11px] text-zinc-400 text-center border-2 border-dashed border-zinc-200/50 rounded-xl bg-white/30 italic">
            {OPERATIONS_MESSAGES.DRAG_HERE}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Main Page ---

export function OperationsPage() {
  const { tasks, employees, kpis, activities, workload, stats, isLoading } =
    useOperationsData();
  const updateTaskMutation = useUpdateTask();

  // Local state for smoother DnD transitions
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string | undefined>(
    undefined,
  );

  // Sync local tasks when server data changes
  useEffect(() => {
    if (tasks.length > 0) setLocalTasks(tasks);
  }, [tasks]);

  // Filters
  const filteredTasks = useMemo(() => {
    const list = localTasks.length > 0 ? localTasks : tasks;
    return list.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
      const matchAssignee = !assigneeFilter || t.assignee_id === assigneeFilter;
      return matchSearch && matchAssignee;
    });
  }, [localTasks, tasks, search, assigneeFilter]);

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId),
    [activeId, tasks],
  );

  if (isLoading && tasks.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500 font-medium">
        {OPERATIONS_MESSAGES.INIT_SPACE}
      </div>
    );
  }

  const workloadRows = workload.slice(0, 6);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    const aTask = localTasks.find((t) => t.id === activeTaskId);
    if (!aTask) return;

    // Determine if over a container or an item
    const overContainer = COLUMNS.find((c) => c.key === overId);
    const overTask = localTasks.find((t) => t.id === overId);

    const newStatus = overContainer ? (overId as TaskStatus) : overTask?.status;

    if (newStatus && aTask.status !== newStatus) {
      setLocalTasks((prev) =>
        prev.map((t) =>
          t.id === activeTaskId ? { ...t, status: newStatus } : t,
        ),
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const targetId = over.id as string;

    const task = localTasks.find((t) => t.id === taskId);
    if (!task) return;

    // Find new status from container ID or target task's status
    const overCol = COLUMNS.find((c) => c.key === targetId);
    const newStatus = overCol
      ? (targetId as TaskStatus)
      : localTasks.find((t) => t.id === targetId)?.status;

    if (newStatus) {
      try {
        await updateTaskMutation.mutateAsync({
          id: taskId,
          values: { status: newStatus },
        });
      } catch (err) {
        // Rollback local state if API fails
        setLocalTasks(tasks);
        console.error('Failed to update task status', err);
      }
    }
  };

  return (
    <div className="page-container p-4 md:p-6 space-y-6 bg-zinc-50/30 min-h-screen overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="fade-up">
          <h1 className="text-2xl md:text-3xl font-extrabold text-zinc-900 tracking-tight">
            {OPERATIONS_MESSAGES.TITLE}
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm mt-1">
            {OPERATIONS_MESSAGES.SUBTITLE}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-zinc-100 w-full md:w-auto overflow-hidden">
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder={OPERATIONS_MESSAGES.SEARCH_PLACEHOLDER}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none bg-zinc-50/50 w-full"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:w-48 min-w-0">
              <Combobox
                options={[
                  { value: '', label: OPERATIONS_MESSAGES.ALL_PERSONNEL },
                  ...employees.map((e) => ({ value: e.id, label: e.name })),
                ]}
                value={assigneeFilter ?? ''}
                onChange={(val) => setAssigneeFilter(val || undefined)}
                placeholder={OPERATIONS_MESSAGES.FILTER_ASSIGNEE}
                className="border-none bg-zinc-50/50 w-full min-w-0"
              />
            </div>
            <Button
              variant="primary"
              leftIcon="Plus"
              onClick={() => {
                setSelectedTask(null);
                setIsFormOpen(true);
              }}
              className="rounded-xl px-4 whitespace-nowrap"
            >
              <span className="hidden sm:inline">
                {OPERATIONS_MESSAGES.CREATE_TASK}
              </span>
              <span className="sm:hidden">Thêm</span>
            </Button>
          </div>
        </div>
      </div>

      <KpiGridPremium className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <KpiCardPremium
          label="Tổng task"
          value={tasks.length}
          icon="ListTodo"
          variant="secondary"
        />
        <KpiCardPremium
          label="Hoàn thành"
          value={stats.doneCount}
          icon="CircleCheck"
          variant="success"
          trendValue="+5"
          trendDirection="up"
        />
        <KpiCardPremium
          label="Quá hạn"
          value={stats.overdueCount}
          icon="TriangleAlert"
          variant={stats.overdueCount > 0 ? 'danger' : 'success'}
        />
        <KpiCardPremium
          label="Hiệu suất"
          value={`${stats.onTimeRate}%`}
          icon="Target"
          variant="primary"
        />
      </KpiGridPremium>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 overflow-x-auto pb-8 scrollbar-hide">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.key);
            return (
              <KanbanColumn
                key={col.key}
                id={col.key}
                title={col.label}
                tasks={colTasks}
                employees={employees}
                kpis={kpis}
                tone={col.tone}
                count={colTasks.length}
                onTaskClick={(t: Task) => {
                  setSelectedTask(t);
                  setIsFormOpen(true);
                }}
              />
            );
          })}
        </div>

        <DragOverlay adjustScale={true}>
          {activeId && activeTask ? (
            <div className="rounded-xl bg-white border-2 border-indigo-500 p-4 text-xs shadow-2xl rotate-2 opacity-95 w-[220px] cursor-grabbing scale-105 transition-transform">
              <div className="font-bold text-zinc-900 mb-2">
                {activeTask.title}
              </div>
              <div className="flex gap-2">
                <Badge variant="info" className="text-[8px]">
                  {activeTask.status}
                </Badge>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-7 border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="border-b border-zinc-100/50">
            <CardTitle className="text-zinc-800">Tải trọng đội ngũ</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ProgressList
              rows={workloadRows.map((r) => ({
                label: r.name,
                value: r.open_tasks,
                max: Math.max(8, ...workloadRows.map((x) => x.open_tasks)),
                right: `${r.open_tasks} task`,
                color:
                  r.open_tasks > 5
                    ? '#ef4444'
                    : r.open_tasks > 3
                      ? '#f59e0b'
                      : '#6366f1',
              }))}
            />
          </CardContent>
        </Card>
        <Card className="lg:col-span-5 border-none shadow-sm bg-white/50 backdrop-blur-sm">
          <CardHeader className="border-b border-zinc-100/50">
            <CardTitle className="text-zinc-800">Hoạt động tức thời</CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[400px]">
            <ActivityFeed items={activities} />
          </CardContent>
        </Card>
      </div>

      <AdaptiveSheet
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={
          selectedTask
            ? OPERATIONS_MESSAGES.TASK_DETAILS
            : OPERATIONS_MESSAGES.INIT_TASK
        }
        maxWidth={650}
      >
        <TaskForm task={selectedTask} onClose={() => setIsFormOpen(false)} />
      </AdaptiveSheet>
    </div>
  );
}
