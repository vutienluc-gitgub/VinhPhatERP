import type { PostgrestError } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchWorkOrders,
  fetchWorkOrderById,
  fetchWorkOrderRequirements,
  createWorkOrder,
  updateWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  cancelWorkOrder,
  issueYarn,
  fetchUnitOptions,
  fetchAvailableYarnLots,
  issueYarnLots,
  fetchYarnIssuesForWorkOrder,
} from '@/api/work-orders.api';
import type {
  WorkOrder,
  WorkOrderWithRelations,
  WorkOrderFilter,
  IssueYarnLotItem,
} from '@/domain/production/work-orders.types';
import type {
  CreateWorkOrderInput,
  CompleteWorkOrderInput,
} from '@/features/work-orders/work-orders.module';

export function useWorkOrders(
  filter?: WorkOrderFilter,
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: ['work_orders', filter, page, pageSize],
    queryFn: () => fetchWorkOrders(filter, page, pageSize),
  });
}

export function useWorkOrderDetail(id: string) {
  return useQuery({
    queryKey: ['work_order', id],
    queryFn: () => fetchWorkOrderById(id),
    enabled: !!id,
  });
}

export function useWorkOrderRequirements(workOrderId: string) {
  return useQuery({
    queryKey: ['work_order_requirements', workOrderId],
    queryFn: () => fetchWorkOrderRequirements(workOrderId),
    enabled: !!workOrderId,
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, PostgrestError, CreateWorkOrderInput>({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation<
    WorkOrder,
    PostgrestError,
    {
      id: string;
      input: Partial<CreateWorkOrderInput>;
      expectedUpdatedAt?: string;
    }
  >({
    mutationFn: ({ id, input, expectedUpdatedAt }) =>
      updateWorkOrder(id, input, expectedUpdatedAt),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['work_order', data.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useStartWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation<void, PostgrestError, string>({
    mutationFn: startWorkOrder,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['work_order', variables] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useIssueYarnWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, PostgrestError, string>({
    mutationFn: issueYarn,
    onSuccess: (data: WorkOrder) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['work_order', data.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCompleteWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    PostgrestError,
    { id: string; input: CompleteWorkOrderInput }
  >({
    mutationFn: ({ id, input }) => completeWorkOrder(id, input.actual_yield_m),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['work_order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCancelWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation<WorkOrder, PostgrestError, string>({
    mutationFn: cancelWorkOrder,
    onSuccess: (data: WorkOrderWithRelations) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['work_order', data.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUnitOptions() {
  return useQuery({
    queryKey: ['available_units'],
    queryFn: fetchUnitOptions,
    staleTime: 1000 * 60 * 60,
  });
}

/* ── Yarn Issue Tracking hooks ── */

export function useAvailableYarnLots(catalogIds: string[]) {
  return useQuery({
    queryKey: ['available_yarn_lots', catalogIds],
    queryFn: () => fetchAvailableYarnLots(catalogIds),
    enabled: catalogIds.length > 0,
  });
}

export function useIssueYarnLots() {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    Error,
    { workOrderId: string; lots: IssueYarnLotItem[] }
  >({
    mutationFn: ({ workOrderId, lots }) => issueYarnLots(workOrderId, lots),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({
        queryKey: ['work_order', variables.workOrderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['work_order_requirements', variables.workOrderId],
      });
      queryClient.invalidateQueries({
        queryKey: ['work_order_yarn_issues', variables.workOrderId],
      });
      queryClient.invalidateQueries({ queryKey: ['available_yarn_lots'] });
    },
  });
}

export function useYarnIssuesForWorkOrder(workOrderId: string) {
  return useQuery({
    queryKey: ['work_order_yarn_issues', workOrderId],
    queryFn: () => fetchYarnIssuesForWorkOrder(workOrderId),
    enabled: !!workOrderId,
  });
}
