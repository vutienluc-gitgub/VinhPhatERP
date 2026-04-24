import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { colorApi } from '@/api/color.api';
import type { ColorFormValues } from '@/schema/color.schema';

const QUERY_KEY = ['colors'] as const;

export function useColors() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => colorApi.list(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useColorMutations() {
  const queryClient = useQueryClient();

  const upsertMutation = useMutation({
    mutationFn: (values: ColorFormValues) => colorApi.upsert(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['colors', 'options'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (code: string) => colorApi.delete(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['colors', 'options'] });
    },
  });

  return {
    upsertMutation,
    deleteMutation,
    isLoading: upsertMutation.isPending || deleteMutation.isPending,
  };
}
