import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchUnifiedTimeline } from '@/api/chat.api';

export function useUnifiedTimeline() {
  return useInfiniteQuery({
    queryKey: ['chat-unified-timeline'],
    queryFn: async ({ pageParam = 0 }) => {
      return fetchUnifiedTimeline({ pageParam, limit: 20 });
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    initialPageParam: 0,
    staleTime: 10_000,
  });
}
