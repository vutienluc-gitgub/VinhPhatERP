import type { PostgrestError } from '@supabase/supabase-js'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import {
  fetchWorkOrders,
  fetchWorkOrderById,
  fetchWorkOrderRequirements,
  createWorkOrder,
  updateWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  cancelWorkOrder,
  fetchUnitOptions,
} from '@/api/work-orders.api'

import type {
  WorkOrder,
  WorkOrderWithRelations,
  WorkOrderFilter,
} from './types'
import type { CreateWorkOrderInput, CompleteWorkOrderInput } from './work-orders.module'

export function useWorkOrders(filter?: WorkOrderFilter, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ['work_orders', filter, page, pageSize],
    queryFn: () => fetchWorkOrders(filter, page, pageSize),
  })
}

export function useWorkOrderDetail(id: string) {
  return useQuery({
    queryKey: ['work_order', id],
    queryFn: () => fetchWorkOrderById(id),
    enabled: !!id,
  })
}

export function useWorkOrderRequirements(workOrderId: string) {
  return useQuery({
    queryKey: ['work_order_requirements', workOrderId],
    queryFn: () => fetchWorkOrderRequirements(workOrderId),
    enabled: !!workOrderId,
  })
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation<WorkOrder, PostgrestError, CreateWorkOrderInput>({
    mutationFn: createWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] })
    },
  })
}

export function useUpdateWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation<WorkOrder, PostgrestError, { id: string; input: Partial<CreateWorkOrderInput> }>({
    mutationFn: ({ id, input }) => updateWorkOrder(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] })
      queryClient.invalidateQueries({ queryKey: ['work_order', data.id] })
    },
  })
}

export function useStartWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation<WorkOrder, PostgrestError, string>({
    mutationFn: startWorkOrder,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] })
      queryClient.invalidateQueries({ queryKey: ['work_order', data.id] })
    },
  })
}

export function useCompleteWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation<WorkOrder, PostgrestError, { id: string; input: CompleteWorkOrderInput }>({
    mutationFn: ({ id, input }) => completeWorkOrder(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] })
      queryClient.invalidateQueries({ queryKey: ['work_order', data.id] })
    },
  })
}

export function useCancelWorkOrder() {
  const queryClient = useQueryClient()

  return useMutation<WorkOrder, PostgrestError, string>({
    mutationFn: cancelWorkOrder,
    onSuccess: (data: WorkOrderWithRelations) => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] })
      queryClient.invalidateQueries({ queryKey: ['work_order', data.id] })
    },
  })
}

export function useUnitOptions() {
  return useQuery({
    queryKey: ['available_units'],
    queryFn: fetchUnitOptions,
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}
