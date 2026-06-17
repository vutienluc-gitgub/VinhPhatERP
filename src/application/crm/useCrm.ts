import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchLeadsPaginated,
  fetchLeadById,
  updateLeadStatus,
  fetchLeadActivities,
  createLeadActivity,
} from '@/api/crm.api';
import type {
  LeadFilter,
  LeadStatus,
  ActivityType,
} from '@/domain/crm/crm.types';

export const crmKeys = {
  all: ['crm'] as const,
  leads: () => [...crmKeys.all, 'leads'] as const,
  leadsList: (filters: LeadFilter, page: number) =>
    [...crmKeys.leads(), filters, page] as const,
  lead: (id: string) => [...crmKeys.leads(), id] as const,
  activities: (leadId: string) =>
    [...crmKeys.lead(leadId), 'activities'] as const,
};

export function useLeads(filters: LeadFilter, page: number) {
  return useQuery({
    queryKey: crmKeys.leadsList(filters, page),
    queryFn: () => fetchLeadsPaginated(filters, page),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: crmKeys.lead(id),
    queryFn: () => fetchLeadById(id),
    enabled: !!id,
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LeadStatus }) =>
      updateLeadStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: crmKeys.leads() });
      queryClient.invalidateQueries({ queryKey: crmKeys.lead(variables.id) });
    },
  });
}

export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: crmKeys.activities(leadId),
    queryFn: () => fetchLeadActivities(leadId),
    enabled: !!leadId,
  });
}

export function useCreateLeadActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      leadId: string;
      type: ActivityType;
      description: string;
    }) => createLeadActivity(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: crmKeys.activities(variables.leadId),
      });
    },
  });
}
