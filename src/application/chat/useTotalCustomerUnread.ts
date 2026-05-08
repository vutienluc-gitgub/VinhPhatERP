import { useQuery } from '@tanstack/react-query';

import { fetchCustomerChatRooms, fetchUnreadCount } from '@/api/chat.api';

export function useTotalCustomerUnread(): number {
  const { data: rooms = [] } = useQuery({
    queryKey: ['chat-inbox-rooms'],
    queryFn: fetchCustomerChatRooms,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const roomIds = rooms.map((r) => r.roomId).join(',');

  const { data: total = 0 } = useQuery({
    queryKey: ['chat-inbox-total-unread', roomIds],
    enabled: rooms.length > 0,
    queryFn: async () => {
      const counts = await Promise.all(
        rooms.map((r) => fetchUnreadCount(r.roomId)),
      );
      let sum = 0;
      for (const n of counts) sum += n;
      return sum;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  return total;
}
