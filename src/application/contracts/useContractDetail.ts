import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import {
  getContractById,
  getOrdersByContractId,
  getAuditLogs,
  updateContract,
  updateContractStatus,
  linkOrderToContract,
  unlinkOrderFromContract,
} from '@/features/contracts/contracts.service';
import type {
  ContractStatus,
  UpdateContractInput,
} from '@/features/contracts/contracts.module';

const CONTRACTS_KEY = ['contracts'] as const;

export function useContract(id: string) {
  return useQuery({
    queryKey: [...CONTRACTS_KEY, id],
    queryFn: () => getContractById(id),
    enabled: !!id,
  });
}

export function useContractLinkedOrders(contractId: string) {
  return useQuery({
    queryKey: [...CONTRACTS_KEY, contractId, 'orders'],
    queryFn: () => getOrdersByContractId(contractId),
    enabled: !!contractId,
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      performedBy,
    }: {
      id: string;
      data: UpdateContractInput;
      performedBy?: string | null;
    }) => updateContract(id, data, performedBy),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({
        queryKey: [...CONTRACTS_KEY, updated.id],
      });
      void queryClient.invalidateQueries({ queryKey: CONTRACTS_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...CONTRACTS_KEY, updated.id, 'audit-logs'],
      });
      toast.success('Cập nhật hợp đồng thành công');
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Có lỗi xảy ra');
    },
  });
}

export function useUpdateContractStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      meta,
    }: {
      id: string;
      status: ContractStatus;
      meta?: {
        performedBy?: string | null;
        cancelReason?: string;
        signedFileUrl?: string;
      };
    }) => updateContractStatus(id, status, meta),
    onSuccess: (updated) => {
      void queryClient.invalidateQueries({
        queryKey: [...CONTRACTS_KEY, updated.id],
      });
      void queryClient.invalidateQueries({ queryKey: CONTRACTS_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...CONTRACTS_KEY, updated.id, 'audit-logs'],
      });
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Có lỗi xảy ra');
    },
  });
}

export function useLinkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contractId,
      orderId,
      linkedBy,
    }: {
      contractId: string;
      orderId: string;
      linkedBy?: string | null;
    }) => linkOrderToContract(contractId, orderId, linkedBy),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: [...CONTRACTS_KEY, vars.contractId, 'orders'],
      });
      void queryClient.invalidateQueries({
        queryKey: [...CONTRACTS_KEY, vars.contractId, 'audit-logs'],
      });
      toast.success('Đã liên kết đơn hàng');
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Có lỗi xảy ra');
    },
  });
}

export function useUnlinkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contractId,
      orderId,
      performedBy,
    }: {
      contractId: string;
      orderId: string;
      performedBy?: string | null;
    }) => unlinkOrderFromContract(contractId, orderId, performedBy),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: [...CONTRACTS_KEY, vars.contractId, 'orders'],
      });
      void queryClient.invalidateQueries({
        queryKey: [...CONTRACTS_KEY, vars.contractId, 'audit-logs'],
      });
      toast.success('Đã huỷ liên kết đơn hàng');
    },
    onError: (err: Error) => {
      toast.error(err.message ?? 'Có lỗi xảy ra');
    },
  });
}

export function useContractAuditLogs(contractId: string) {
  return useQuery({
    queryKey: [...CONTRACTS_KEY, contractId, 'audit-logs'],
    queryFn: () => getAuditLogs(contractId),
    enabled: !!contractId,
  });
}
