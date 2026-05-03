import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import {
  fetchTasks,
  fetchEmployees,
  fetchKpis,
  fetchActivities,
  fetchWorkload,
  fetchKanbanDashboard,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  logBlockedTransitionEvent,
  type BlockedTransitionTelemetryEvent,
} from '@/api/operations.api';
import { Task } from '@/domain/operations/types';

export function useKanbanDashboard() {
  return useQuery({
    queryKey: ['operations-dashboard'],
    queryFn: fetchKanbanDashboard,
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ['operations-tasks'],
    queryFn: fetchTasks,
  });
}

// ... (other query hooks)

export function useCreateTask() {
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<Task>) => {
      const reqPayload = { id: clientId, ...values };
      return createTask(reqPayload);
    },
    onSuccess: () => {
      setClientId(crypto.randomUUID());
      queryClient.invalidateQueries({ queryKey: ['operations-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['operations-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['operations-workload'] });
      queryClient.invalidateQueries({ queryKey: ['operations-activities'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<Task> }) =>
      updateTask(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['operations-dashboard'],
      });
      await queryClient.invalidateQueries({ queryKey: ['operations-tasks'] });
      await queryClient.invalidateQueries({
        queryKey: ['operations-workload'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['operations-activities'],
      });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['operations-dashboard'],
      });
      await queryClient.invalidateQueries({ queryKey: ['operations-tasks'] });
      await queryClient.invalidateQueries({
        queryKey: ['operations-workload'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['operations-activities'],
      });
    },
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      actualHours,
    }: {
      taskId: string;
      actualHours?: number;
    }) => completeTask(taskId, actualHours),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['operations-dashboard'],
      });
      await queryClient.invalidateQueries({ queryKey: ['operations-tasks'] });
      await queryClient.invalidateQueries({
        queryKey: ['operations-workload'],
      });
      await queryClient.invalidateQueries({
        queryKey: ['operations-activities'],
      });
    },
  });
}

export function useLogBlockedTransitionEvent() {
  return useMutation({
    mutationFn: (event: BlockedTransitionTelemetryEvent) =>
      logBlockedTransitionEvent(event),
  });
}

export function useEmployees() {
  return useQuery({
    queryKey: ['operations-employees'],
    queryFn: fetchEmployees,
  });
}

export function useKpis() {
  return useQuery({
    queryKey: ['operations-kpis'],
    queryFn: fetchKpis,
  });
}

export function useActivities() {
  return useQuery({
    queryKey: ['operations-activities'],
    queryFn: fetchActivities,
  });
}

export function useWorkload() {
  return useQuery({
    queryKey: ['operations-workload'],
    queryFn: fetchWorkload,
  });
}

export function useOperationsData() {
  const dashboardQuery = useKanbanDashboard();

  const isLoading = dashboardQuery.isLoading;
  const isError = dashboardQuery.isError;

  const tasks = useMemo(
    () => dashboardQuery.data?.tasks ?? [],
    [dashboardQuery.data?.tasks],
  );

  /**
   * Memoize derived stats — these involve .filter() and Date comparisons
   * over potentially large arrays. Without memoization, they recomputed
   * on every render even when unrelated queries refetched.
   */
  const stats = useMemo(() => {
    const activeTasks = tasks.filter((t) => t.status !== 'cancelled');
    const totalActive = activeTasks.length;
    const doneCount = activeTasks.filter((t) => t.status === 'done').length;
    const openTasksList = activeTasks.filter((t) => t.status !== 'done');
    const overdueCount = openTasksList.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date(),
    ).length;

    // Completion rate: done / total active tasks (excluding cancelled)
    // 0 tasks = 0%, not 100% — avoids misleading "100% done" on empty board
    const completionRate =
      totalActive > 0 ? Math.round((doneCount / totalActive) * 100) : 0;

    return { doneCount, overdueCount, completionRate };
  }, [tasks]);

  return {
    tasks,
    employees: dashboardQuery.data?.employees ?? [],
    kpis: dashboardQuery.data?.kpis ?? [],
    activities: dashboardQuery.data?.activities ?? [],
    workload: dashboardQuery.data?.workload ?? [],
    stats,
    isLoading,
    isError,
  };
}
