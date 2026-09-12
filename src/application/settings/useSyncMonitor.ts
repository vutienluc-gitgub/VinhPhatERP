import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchGoogleSheetsConnection,
  fetchSyncStats,
  fetchSyncJobs,
  fetchSyncLogs,
  retryFailedSyncJobs,
  retrySingleSyncJob,
  triggerTestConnection,
  triggerInboundImport,
  triggerReconciliation,
  type IntegrationConnection,
  type SyncStats,
  type SyncJobRow,
  type SyncLog,
} from '@/api/sync.api';

export const SYNC_QUERY_KEYS = {
  connection: ['integration-connection', 'google_sheets'] as const,
  stats: ['integration-sync-stats'] as const,
  jobs: (limit: number) => ['integration-sync-jobs', limit] as const,
  logs: (jobId: string | null) => ['integration-sync-logs', jobId] as const,
};

export function useGoogleSheetsConnection() {
  return useQuery<IntegrationConnection | null>({
    queryKey: SYNC_QUERY_KEYS.connection,
    queryFn: fetchGoogleSheetsConnection,
    staleTime: 60 * 1000,
  });
}

export function useSyncStats() {
  return useQuery<SyncStats>({
    queryKey: SYNC_QUERY_KEYS.stats,
    queryFn: fetchSyncStats,
    refetchInterval: 30 * 1000,
  });
}

export function useSyncJobs(limit = 20) {
  return useQuery<SyncJobRow[]>({
    queryKey: SYNC_QUERY_KEYS.jobs(limit),
    queryFn: () => fetchSyncJobs(limit),
    refetchInterval: 30 * 1000,
  });
}

export function useSyncLogs(jobId: string | null) {
  return useQuery<SyncLog[]>({
    queryKey: SYNC_QUERY_KEYS.logs(jobId),
    queryFn: () => (jobId ? fetchSyncLogs(jobId) : Promise.resolve([])),
    enabled: Boolean(jobId),
    staleTime: 10 * 1000,
  });
}

export function useRetryFailedSyncJobs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: retryFailedSyncJobs,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['integration-sync-jobs'],
      });
      void queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEYS.stats });
    },
  });
}

export function useRetrySingleSyncJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => retrySingleSyncJob(jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['integration-sync-jobs'],
      });
      void queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEYS.stats });
    },
  });
}

export function useTestConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerTestConnection,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SYNC_QUERY_KEYS.connection,
      });
    },
  });
}

export function useTriggerInboundImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerInboundImport,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['integration-sync-jobs'],
      });
      void queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEYS.stats });
      void queryClient.invalidateQueries({
        queryKey: SYNC_QUERY_KEYS.connection,
      });
    },
  });
}

export function useTriggerReconciliation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: triggerReconciliation,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['integration-sync-jobs'],
      });
      void queryClient.invalidateQueries({ queryKey: SYNC_QUERY_KEYS.stats });
      void queryClient.invalidateQueries({
        queryKey: SYNC_QUERY_KEYS.connection,
      });
    },
  });
}
