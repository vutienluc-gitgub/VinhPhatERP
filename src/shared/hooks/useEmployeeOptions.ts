import { useQuery } from '@tanstack/react-query';

import { fetchEmployees } from '@/api/employees.api';

type EmployeeFilters = {
  role?: string;
  status?: string;
  query?: string;
};

/** Shared hook — dùng cho các form cần chọn nhân viên (cross-feature) */
export function useEmployees(filters?: EmployeeFilters) {
  return useQuery({
    queryKey: ['employees', filters],
    queryFn: () => fetchEmployees(filters),
  });
}
