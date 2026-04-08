import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchOrderProgressByOrder,
  fetchProgressBoard,
  updateStageStatus,
  updatePlannedDate,
  fetchProgressAuditLog,
  fetchRecentAuditLog,
  fetchProgressDashboard,
} from '@/api/order-progress.api';
import type { OrderProgress, OrderProgressWithOrder } from '@/models';

import type {
  ProgressAuditLog,
  ProgressAuditLogWithOrder,
  StageStatus,
} from './types';

export type {
  OrderProgress,
  OrderProgressWithOrder,
  ProgressAuditLog,
  ProgressAuditLogWithOrder,
  StageStatus,
};

const QUERY_KEY = ['order-progress'] as const;
const AUDIT_KEY = ['progress-audit'] as const;

export function useOrderProgress(orderId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, orderId],
    enabled: !!orderId,
    queryFn: () => fetchOrderProgressByOrder(orderId!),
  });
}

export function useProgressBoard() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'board'],
    queryFn: fetchProgressBoard,
  });
}

export function useUpdateStageStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      progressId,
      status,
      notes,
    }: {
      progressId: string;
      status: StageStatus;
      notes?: string;
    }) => updateStageStatus(progressId, status, notes),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: AUDIT_KEY });
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdatePlannedDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      progressId,
      plannedDate,
    }: {
      progressId: string;
      plannedDate: string | null;
    }) => updatePlannedDate(progressId, plannedDate),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useProgressAuditLog(orderId: string | undefined) {
  return useQuery({
    queryKey: [...AUDIT_KEY, orderId],
    enabled: !!orderId,
    queryFn: () => fetchProgressAuditLog(orderId!),
  });
}

export function useRecentAuditLog(limit = 50) {
  return useQuery({
    queryKey: [...AUDIT_KEY, 'recent', limit],
    queryFn: () => fetchRecentAuditLog(limit),
  });
}

export function useProgressDashboard() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'dashboard'],
    queryFn: fetchProgressDashboard,
  });
}
