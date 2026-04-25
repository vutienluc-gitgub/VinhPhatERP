import { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { useEffect, useMemo, useState } from 'react';

type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'blocked'
  | 'review'
  | 'done'
  | 'cancelled';

interface BoardTask {
  id: string;
  title: string;
  status: TaskStatus;
  assignee_id?: string | null;
}

interface TransitionValidation {
  ok: boolean;
  reason?: string;
}

interface BlockedTransition<TTask extends BoardTask> {
  taskId: TTask['id'];
  targetStatus: TaskStatus;
  reason: string;
}

interface BlockedTransitionTelemetry<TTask extends BoardTask> {
  taskId: TTask['id'];
  fromStatus: TaskStatus;
  targetStatus: TaskStatus;
  reason: string;
  source: 'preview' | 'commit';
}

interface UseTaskBoardInteractionsArgs<TTask extends BoardTask> {
  tasks: TTask[];
  search: string;
  assigneeFilter?: string;
  columnStatuses: TaskStatus[];
  persistTaskStatus: (taskId: string, nextStatus: TaskStatus) => Promise<void>;
  validateTransition?: (task: TTask, to: TaskStatus) => TransitionValidation;
  onBlockedTransition?: (payload: BlockedTransitionTelemetry<TTask>) => void;
}

function resolveTargetStatus(
  overId: string,
  taskList: BoardTask[],
  statusSet: ReadonlySet<TaskStatus>,
): TaskStatus | undefined {
  if (statusSet.has(overId as TaskStatus)) {
    return overId as TaskStatus;
  }
  return taskList.find((task) => task.id === overId)?.status;
}

function updateTaskStatus(
  taskList: BoardTask[],
  taskId: string,
  status: TaskStatus,
): BoardTask[] {
  return taskList.map((task) =>
    task.id === taskId ? { ...task, status } : task,
  );
}

export function useTaskBoardInteractions<TTask extends BoardTask>({
  tasks,
  search,
  assigneeFilter,
  columnStatuses,
  persistTaskStatus,
  validateTransition,
  onBlockedTransition,
}: UseTaskBoardInteractionsArgs<TTask>) {
  const [localTasks, setLocalTasks] = useState<TTask[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isPersistingDrag, setIsPersistingDrag] = useState(false);
  const [blockedTransition, setBlockedTransition] =
    useState<BlockedTransition<TTask> | null>(null);
  const [recoilTaskId, setRecoilTaskId] = useState<TTask['id'] | null>(null);

  const statusSet = useMemo(() => new Set(columnStatuses), [columnStatuses]);

  const taskPool: TTask[] = localTasks.length > 0 ? localTasks : tasks;

  useEffect(() => {
    if (activeId || isPersistingDrag) {
      return;
    }
    setLocalTasks(tasks);
  }, [tasks, activeId, isPersistingDrag]);

  useEffect(() => {
    if (!recoilTaskId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setRecoilTaskId(null);
    }, 320);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [recoilTaskId]);

  const filteredTasks = useMemo(
    () =>
      taskPool.filter((task) => {
        const matchSearch = task.title
          .toLowerCase()
          .includes(search.toLowerCase());
        const matchAssignee =
          !assigneeFilter || task.assignee_id === assigneeFilter;
        return matchSearch && matchAssignee;
      }),
    [taskPool, search, assigneeFilter],
  );

  const activeTask = useMemo(
    () => taskPool.find((task) => task.id === activeId),
    [taskPool, activeId],
  );

  const registerBlockedTransition = (
    task: TTask,
    targetStatus: TaskStatus,
    reason: string,
    source: 'preview' | 'commit',
  ) => {
    setBlockedTransition({
      taskId: task.id,
      targetStatus,
      reason,
    });
    setRecoilTaskId(task.id);
    onBlockedTransition?.({
      taskId: task.id,
      fromStatus: task.status,
      targetStatus,
      reason,
      source,
    });
  };

  const persistMove = async (taskId: string, nextStatus: TaskStatus) => {
    const currentTask = taskPool.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }

    const validation = validateTransition?.(currentTask, nextStatus);
    if (validation && !validation.ok) {
      const reason = validation.reason ?? 'Không thể chuyển trạng thái';
      registerBlockedTransition(currentTask, nextStatus, reason, 'commit');
      console.info(`[Operations] Transition blocked: ${reason}`);
      return;
    }

    setBlockedTransition(null);

    const previousTasks = taskPool;
    const nextTasks = updateTaskStatus(
      previousTasks,
      taskId,
      nextStatus,
    ) as TTask[];

    setLocalTasks(nextTasks);
    setIsPersistingDrag(true);

    try {
      await persistTaskStatus(taskId, nextStatus);
    } catch (error) {
      setLocalTasks(previousTasks);
      console.error('Failed to persist task status', error);
    } finally {
      setIsPersistingDrag(false);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setBlockedTransition(null);
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;
    const currentTask = taskPool.find((task) => task.id === taskId);
    if (!currentTask) {
      return;
    }

    const nextStatus = resolveTargetStatus(overId, taskPool, statusSet);
    if (!nextStatus || currentTask.status === nextStatus) {
      return;
    }

    const validation = validateTransition?.(currentTask, nextStatus);
    if (validation && !validation.ok) {
      const reason = validation.reason ?? 'Không thể chuyển trạng thái';
      registerBlockedTransition(currentTask, nextStatus, reason, 'preview');
      return;
    }

    setBlockedTransition(null);

    setLocalTasks((previous) => {
      const base = previous.length > 0 ? previous : tasks;
      return updateTaskStatus(base, taskId, nextStatus) as TTask[];
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) {
      return;
    }

    const taskId = active.id as string;
    const overId = over.id as string;
    const nextStatus = resolveTargetStatus(overId, taskPool, statusSet);

    if (!nextStatus) {
      return;
    }

    await persistMove(taskId, nextStatus);
  };

  const moveTaskToStatus = async (taskId: string, nextStatus: TaskStatus) => {
    await persistMove(taskId, nextStatus);
  };

  return {
    filteredTasks,
    activeId,
    activeTask,
    blockedTransition,
    recoilTaskId,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    moveTaskToStatus,
  };
}
