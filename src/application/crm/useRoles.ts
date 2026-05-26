import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchCompanyRoles,
  createCompanyRole,
  updateCompanyRole,
  deleteCompanyRole,
} from '@/api';

export const ROLES_QUERY_KEY = ['company-roles'];

export function useCompanyRoles() {
  return useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: fetchCompanyRoles,
  });
}

export function useCreateCompanyRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCompanyRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    },
  });
}

export function useUpdateCompanyRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      updateCompanyRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    },
  });
}

export function useDeleteCompanyRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCompanyRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY });
    },
  });
}
