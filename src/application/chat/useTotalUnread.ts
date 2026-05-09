import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/services/supabase/client';

export function useTotalUnread(): number {
  const { data = 0 } = useQuery({
    queryKey: ['chat-total-unread'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('rpc_get_total_unread');
      if (error) throw error;
      return (data as number) ?? 0;
    },
    staleTime: 10_000,
    refetchInterval: 30_000,
  });
  return data;
}
