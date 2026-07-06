import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchCustomerGroups,
  createCustomerGroup,
  updateCustomerGroup,
  deleteCustomerGroup,
  fetchCustomerGroupsForCustomer,
  saveCustomerGroupsForCustomer,
} from '@/api/customer-groups.api';
import type {
  CustomerGroupInsert,
  CustomerGroupUpdate,
} from '@/domain/crm/customer-groups.types';

const QUERY_KEY = ['customer_groups'] as const;

export function useCustomerGroupList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchCustomerGroups,
  });
}

export function useCreateCustomerGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CustomerGroupInsert) => createCustomerGroup(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateCustomerGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: CustomerGroupUpdate }) =>
      updateCustomerGroup(id, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteCustomerGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCustomerGroup(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useCustomerGroupMembers(customerId: string | null | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'members', customerId],
    queryFn: () =>
      customerId ? fetchCustomerGroupsForCustomer(customerId) : [],
    enabled: !!customerId,
  });
}

export function useSaveCustomerGroupMembers(customerId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupIds: string[]) =>
      saveCustomerGroupsForCustomer(customerId, groupIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'members', customerId],
      });
      // Invalidate customers list query to trigger re-renders if needed
      void queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
