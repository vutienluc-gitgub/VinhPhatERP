import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deactivateEmployee,
  fetchNextEmployeeCode,
  fetchAvailableDriverProfiles,
} from '@/api';
import type { EmployeeFormValues } from '@/schema';

type UseEmployeesFilters = {
  role?: string;
  status?: string;
  query?: string;
};

export function useEmployees(filters?: UseEmployeesFilters) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => fetchEmployees(filters),
  });
}

export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: ['employees', id],
    queryFn: () => (id ? getEmployeeById(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useNextEmployeeCode() {
  return useQuery({
    queryKey: ['employees', 'next-code'],
    queryFn: fetchNextEmployeeCode,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<EmployeeFormValues>;
    }) => updateEmployee(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employees', id] });
    },
  });
}

export function useDeactivateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deactivateEmployee,
    onSuccess: (_, id) => {
      void queryClient.invalidateQueries({ queryKey: ['employees'] });
      void queryClient.invalidateQueries({ queryKey: ['employees', id] });
    },
  });
}

export function useAvailableDriverProfiles(employeeId?: string) {
  return useQuery({
    queryKey: ['available-driver-profiles', employeeId],
    queryFn: () => fetchAvailableDriverProfiles(employeeId),
  });
}

// We don't expose a separate mutation hook for linking because we will merge
// the linking process directly into the onSuccess callback of create/update employee
// or run it directly inside the form's submit handler.
