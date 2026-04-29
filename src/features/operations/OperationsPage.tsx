import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useState } from 'react';

import {
  useOperationsData,
  useUpdateTask,
} from '@/application/operations/useOperationsData';
import {
  Badge,
  Button,
  AdaptiveSheet,
  SearchInput,
  Combobox,
} from '@/shared/components';

import { BlockedTransitionsWidget } from './components/BlockedTransitionsWidget';
import { OperationsDashboard } from './components/OperationsDashboard';
import { OperationsKpiGrid } from './components/OperationsKpiGrid';
import { KanbanColumn } from './components/KanbanColumn';
import { TaskForm } from './TaskForm';
import { useBlockedTransitionSession } from './hooks/useBlockedTransitionSession';
import { useBlockedTransitionTelemetry } from './hooks/useBlockedTransitionTelemetry';
import { useOperationsCommander } from './hooks/useOperationsCommander';
import { useTaskBoardInteractions } from './hooks/useTaskBoardInteractions';
import { KANBAN_COLUMNS, getTapMoveTargetStatus } from './kanbanColumns';
import { Task, TaskStatus } from './types';
import { OPERATIONS_MESSAGES } from './constants';

export function OperationsPage() {
  const { tasks, employees, kpis, activities, workload, stats, isLoading } =
    useOperationsData();
  const updateTaskMutation = useUpdateTask();
  const { validateTransition } = useOperationsCommander();
  const logBlockedTransition = useBlockedTransitionTelemetry();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string | undefined>(
    undefined,
  );

  const {
    recentEvents: recentBlockedEvents,
    sessionEvents: blockedEventsSession,
    sessionCount: blockedTransitionsSessionCount,
    reset: handleResetBlockedTransitionsCounter,
  } = useBlockedTransitionSession();

  const {
    filteredTasks,
    activeId,
    activeTask,
    blockedTransition,
    recoilTaskId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    moveTaskToStatus,
  } = useTaskBoardInteractions({
    tasks,
    search,
    assigneeFilter,
    columnStatuses: KANBAN_COLUMNS.map((column) => column.key),
    persistTaskStatus: async (taskId, nextStatus) => {
      const currentTask = tasks.find((t) => t.id === taskId);
      await updateTaskMutation.mutateAsync({
        id: taskId,
        values: {
          status: nextStatus,
          version: currentTask?.version,
        },
      });
    },
    validateTransition,
    onBlockedTransition: logBlockedTransition,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (isLoading && tasks.length === 0) {
    return (
      <div className="p-12 text-center text-zinc-500 font-medium">
        {OPERATIONS_MESSAGES.INIT_SPACE}
      </div>
    );
  }

  return (
    <div className="page-container space-y-6 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="fade-up">
          <h1 className="text-2xl md:text-3xl font-extrabold text-text tracking-tight">
            {OPERATIONS_MESSAGES.TITLE}
          </h1>
          <p className="text-muted text-xs md:text-sm mt-1">
            {OPERATIONS_MESSAGES.SUBTITLE}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-surface p-2 rounded-2xl shadow-sm border border-border w-full md:w-auto overflow-hidden">
          <div className="w-full sm:w-64">
            <SearchInput
              placeholder={OPERATIONS_MESSAGES.SEARCH_PLACEHOLDER}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-none bg-surface-hover w-full"
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
                className="border-none bg-surface-hover w-full min-w-0"
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

      <OperationsKpiGrid
        totalTasks={tasks.length}
        doneCount={stats.doneCount}
        overdueCount={stats.overdueCount}
        onTimeRate={stats.onTimeRate}
      />

      <BlockedTransitionsWidget
        recentEvents={recentBlockedEvents}
        sessionEvents={blockedEventsSession}
        sessionCount={blockedTransitionsSessionCount}
        onReset={handleResetBlockedTransitionsCounter}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {blockedTransition && (
          <div className="mb-3 rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-xs font-medium text-danger">
            {OPERATIONS_MESSAGES.CANNOT_MOVE_TASK} {blockedTransition.reason}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 overflow-x-auto pb-8 scrollbar-hide overscroll-x-contain">
          {KANBAN_COLUMNS.map((col) => {
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
                emptyLabel={OPERATIONS_MESSAGES.DRAG_HERE}
                blockedReason={
                  blockedTransition?.targetStatus === col.key
                    ? blockedTransition.reason
                    : undefined
                }
                blockedTaskId={blockedTransition?.taskId}
                recoilTaskId={recoilTaskId}
                onTaskClick={(t: Task) => {
                  setSelectedTask(t);
                  setIsFormOpen(true);
                }}
                onTapMove={(t: Task) => {
                  const targetStatus = getTapMoveTargetStatus(
                    t.status as TaskStatus,
                  );
                  if (!targetStatus) {
                    return;
                  }
                  void moveTaskToStatus(t.id, targetStatus);
                }}
              />
            );
          })}
        </div>

        <DragOverlay adjustScale={true}>
          {activeId && activeTask ? (
            <div className="rounded-xl bg-surface border-2 border-primary p-4 text-xs shadow-2xl rotate-2 opacity-95 w-[220px] cursor-grabbing scale-105 transition-transform">
              <div className="font-bold text-text mb-2">{activeTask.title}</div>
              <div className="flex gap-2">
                <Badge variant="info" className="text-[8px]">
                  {activeTask.status}
                </Badge>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <OperationsDashboard workload={workload} activities={activities} />

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
