import { useMutation, useQuery } from '@tanstack/react-query';

import {
  generateContract,
  getCustomerOptions,
  getOrderOptions,
  getSupplierOptions,
} from '@/features/contracts/contracts.service';
import type { GenerateContractResponse } from '@/features/contracts/contracts.service';

export function useOrderOptions() {
  return useQuery({
    queryKey: ['orders', 'contract-picker'],
    queryFn: getOrderOptions,
  });
}

export function useCustomerOptions() {
  return useQuery({
    queryKey: ['customers', 'contract-picker'],
    queryFn: getCustomerOptions,
  });
}

export function useSupplierOptions() {
  return useQuery({
    queryKey: ['suppliers', 'contract-picker'],
    queryFn: getSupplierOptions,
  });
}

export function useGenerateContract() {
  return useMutation<GenerateContractResponse, Error, Record<string, unknown>>({
    mutationFn: (payload: Record<string, unknown>) => generateContract(payload),
  });
}
