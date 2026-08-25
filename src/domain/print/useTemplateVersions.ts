import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  getStoredRevisions,
  saveTemplateRevision,
  type PrintTemplateRevision,
} from './versioning.service';
import type { PrintTemplateEntity } from './types';

export function useTemplateRevisions(templateId?: string) {
  return useQuery({
    queryKey: ['template-revisions', templateId],
    queryFn: async (): Promise<PrintTemplateRevision[]> => {
      return getStoredRevisions(templateId);
    },
    enabled: Boolean(templateId),
    staleTime: 60 * 1000,
  });
}

export function useSaveTemplateRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      template: PrintTemplateEntity;
      savedBy?: string;
      note?: string;
    }) => {
      return saveTemplateRevision(params.template, params.savedBy, params.note);
    },
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['template-revisions', vars.template.id],
      });
    },
  });
}
