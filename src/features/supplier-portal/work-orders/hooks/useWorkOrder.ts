import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchSupplierWorkOrderById,
  startWorkOrder,
  pauseWorkOrder,
  resumeWorkOrder,
  completeWorkOrder,
  confirmMaterialReceipt,
} from '@/api/supplier-work-orders.api';
import type {
  WorkOrderStatePayload,
  WorkOrderAction,
  ExceptionFlag,
  WorkOrderCapabilities,
  WorkOrderStatus,
} from '@/types/work-orders';

export const WORK_ORDER_QUERY_KEY = 'work_order';

export function useWorkOrder(workOrderId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [WORK_ORDER_QUERY_KEY, workOrderId],
    queryFn: () => fetchSupplierWorkOrderById(workOrderId || ''),
    enabled: !!workOrderId,
  });

  // Calculate capabilities based on current status (Mocking Backend Action Engine)
  const computeStatePayload = (): WorkOrderStatePayload | null => {
    if (!query.data) return null;

    const status = query.data.status;
    const flags: ExceptionFlag[] = []; // In real app, fetch from DB or derive

    // MOCK Backend-Driven State Machine
    if (status === 'in_progress') {
      // Mock an exception for demonstration
      flags.push('machine_breakdown');
    }
    let availableActions: WorkOrderAction[] = [];
    const capabilities: WorkOrderCapabilities = {
      canView: true,
      canUpdateProduction: false,
      canConfirmMaterials: false,
      canReportComplete: false,
      canDownloadDocuments: true,
      canComment: true,
    };

    // Mock 'pending_verification' for Approval Workflow
    let effectiveStatus: WorkOrderStatus = status as WorkOrderStatus;
    if (status === 'completed') {
      effectiveStatus = 'pending_verification';
    }

    if (effectiveStatus === 'yarn_issued') {
      availableActions = ['start'];
      capabilities.canConfirmMaterials = true;
    } else if (effectiveStatus === 'in_progress') {
      availableActions = ['pause', 'complete'];
      capabilities.canUpdateProduction = true;
      capabilities.canReportComplete = true;
      capabilities.canConfirmMaterials = true;
    } else if (effectiveStatus === 'pending_verification') {
      // In pending_verification, Supplier cannot update production anymore, just view
      capabilities.canUpdateProduction = false;
      capabilities.canReportComplete = false;
      capabilities.canConfirmMaterials = false;
    }

    return {
      status: effectiveStatus,
      flags,
      availableActions,
      capabilities,
    };
  };

  const statePayload = computeStatePayload();

  // Mutations
  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: [WORK_ORDER_QUERY_KEY, workOrderId],
    });
  };

  const startMutation = useMutation({
    mutationFn: () => startWorkOrder(workOrderId!),
    onSuccess: invalidate,
  });

  const pauseMutation = useMutation({
    mutationFn: () => pauseWorkOrder(workOrderId!),
    onSuccess: invalidate,
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeWorkOrder(workOrderId!),
    onSuccess: invalidate,
  });

  const completeMutation = useMutation({
    mutationFn: () => completeWorkOrder(workOrderId!),
    onSuccess: invalidate,
  });

  const confirmReceiptMutation = useMutation({
    mutationFn: (receiptId: string) => confirmMaterialReceipt(receiptId),
    onSuccess: invalidate,
  });

  return {
    ...query,
    workOrder: query.data,
    statePayload,
    actions: {
      start: startMutation.mutateAsync,
      pause: pauseMutation.mutateAsync,
      resume: resumeMutation.mutateAsync,
      complete: completeMutation.mutateAsync,
      confirmReceipt: confirmReceiptMutation.mutateAsync,
      isPending:
        startMutation.isPending ||
        pauseMutation.isPending ||
        resumeMutation.isPending ||
        completeMutation.isPending ||
        confirmReceiptMutation.isPending,
    },
  };
}
