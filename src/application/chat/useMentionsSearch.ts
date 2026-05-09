import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/services/supabase/client';
import { CHAT_LABELS, AVAILABLE_ROLES } from '@/schema/chat.schema';

export type MentionOption = {
  id: string;
  label: string;
  type: 'user' | 'role' | 'document';
  entity_type?: string;
};

export function useMentionsSearch(
  type: 'user' | 'document' | null,
  query: string,
) {
  return useQuery({
    queryKey: ['mentions-search', type, query],
    enabled: type !== null,
    queryFn: async (): Promise<MentionOption[]> => {
      if (type === 'user') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .ilike('full_name', `%${query}%`)
          .limit(10);

        if (error) throw error;

        const results: MentionOption[] = (data || []).map((p) => ({
          id: p.id,
          label: p.full_name || CHAT_LABELS.UNKNOWN_USER,
          type: 'user',
        }));

        // Add roles if query matches
        const matchingRoles = AVAILABLE_ROLES.filter((r) =>
          r.toLowerCase().includes(query.toLowerCase()),
        );

        matchingRoles.forEach((r) => {
          results.unshift({
            id: r,
            label: `${CHAT_LABELS.DEPARTMENT} ${r}`,
            type: 'role',
          });
        });

        return results.slice(0, 10);
      }

      if (type === 'document') {
        // Search shipments and orders for now
        const [shipments, orders] = await Promise.all([
          supabase
            .from('shipments')
            .select('id, shipment_number')
            .ilike('shipment_number', `%${query}%`)
            .limit(5),
          supabase
            .from('orders')
            .select('id, order_number')
            .ilike('order_number', `%${query}%`)
            .limit(5),
        ]);

        const results: MentionOption[] = [];

        shipments.data?.forEach((s) => {
          results.push({
            id: s.id,
            label: s.shipment_number,
            type: 'document',
            entity_type: 'shipment',
          });
        });

        orders.data?.forEach((o) => {
          results.push({
            id: o.id,
            label: o.order_number,
            type: 'document',
            entity_type: 'order',
          });
        });

        return results;
      }

      return [];
    },
    staleTime: 60_000,
  });
}
