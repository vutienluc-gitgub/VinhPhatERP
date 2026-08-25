import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { getStoredPrintJobs, recordPrintJob } from './print-job.service';
import type { DocumentType, OutputTarget, PrintJob } from './types';

export function usePrintJobs() {
  return useQuery({
    queryKey: ['print-jobs'],
    queryFn: async (): Promise<PrintJob[]> => {
      return getStoredPrintJobs();
    },
    staleTime: 60 * 1000,
  });
}

export function useRecordPrintJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      documentType: DocumentType;
      documentId: string;
      templateId: string;
      outputType: OutputTarget;
      requestedBy?: string;
      status?: 'pending' | 'rendering' | 'completed' | 'failed';
      error?: string | null;
    }) => {
      return recordPrintJob(params);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['print-jobs'] });
    },
  });
}
