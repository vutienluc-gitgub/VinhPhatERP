import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import {
  fetchTasks,
  fetchEmployees,
  fetchKpis,
  fetchActivities,
  fetchWorkload,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  logBlockedTransitionEvent,
  type BlockedTransitionTelemetryEvent,
} from '@/api/operations.api';
import { Task } from '@/features/operations/types';

export function useTasks() {
  return useQuery({
    queryKey: ['operations-tasks'],
    queryFn: fetchTasks,
  });
}

// ... (other query hooks)

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<Task>) => createTask(values),
    onSuccess: () => {
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['operations-workload'] });
      queryClient.invalidateQueries({ queryKey: ['operations-activities'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['operations-workload'] });
      queryClient.invalidateQueries({ queryKey: ['operations-activities'] });
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
  const tasksQuery = useTasks();
  const employeesQuery = useEmployees();
  const kpisQuery = useKpis();
  const activitiesQuery = useActivities();
  const workloadQuery = useWorkload();

  const isLoading =
    tasksQuery.isLoading ||
    employeesQuery.isLoading ||
    kpisQuery.isLoading ||
    activitiesQuery.isLoading ||
    workloadQuery.isLoading;

  const isError =
    tasksQuery.isError ||
    employeesQuery.isError ||
    kpisQuery.isError ||
    activitiesQuery.isError ||
    workloadQuery.isError;

  const tasks = useMemo(() => tasksQuery.data ?? [], [tasksQuery.data]);

  /**
   * Memoize derived stats — these involve .filter() and Date comparisons
   * over potentially large arrays. Without memoization, they recomputed
   * on every render even when unrelated queries refetched.
   */
  const stats = useMemo(() => {
    const doneCount = tasks.filter((t) => t.status === 'done').length;
    const openTasksList = tasks.filter(
      (t) => t.status !== 'done' && t.status !== 'cancelled',
    );
    const overdueCount = openTasksList.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date(),
    ).length;
    const onTimeRate = tasks.length
      ? Math.round(((tasks.length - overdueCount) / tasks.length) * 100)
      : 100;

    return { doneCount, overdueCount, onTimeRate };
  }, [tasks]);

  return {
    tasks,
    employees: employeesQuery.data ?? [],
    kpis: kpisQuery.data ?? [],
    activities: activitiesQuery.data ?? [],
    workload: workloadQuery.data ?? [],
    stats,
    isLoading,
    isError,
  };
}
