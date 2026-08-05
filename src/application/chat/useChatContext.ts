import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/services/supabase/client';

export interface ChatEntityContext {
  id: string;
  type: string;
  name: string;
  code: string;
  phone?: string;
  statusLabel?: string;
  detailUrl?: string;
  subtitle?: string;
}

export function useChatContext(entityType: string, entityId: string) {
  return useQuery({
    queryKey: ['chat-entity-context', entityType, entityId],
    queryFn: async (): Promise<ChatEntityContext | null> => {
      if (!entityType || !entityId) return null;

      if (entityType === 'supplier') {
        const { data } = await supabase
          .from('suppliers')
          .select('id, name, code, phone')
          .eq('id', entityId)
          .maybeSingle();

        if (!data) return null;
        return {
          id: data.id,
          type: 'supplier',
          name: data.name,
          code: data.code,
          phone: data.phone || undefined,
          statusLabel: 'Nhà cung cấp',
          detailUrl: `/suppliers`,
          subtitle: `Mã: ${data.code}`,
        };
      }

      if (entityType === 'shipment') {
        const { data } = await supabase
          .from('shipments')
          .select('id, shipment_number, status')
          .eq('id', entityId)
          .maybeSingle();

        if (!data) return null;
        return {
          id: data.id,
          type: 'shipment',
          name: `Lô hàng ${data.shipment_number}`,
          code: data.shipment_number,
          statusLabel: data.status,
          detailUrl: `/shipments`,
          subtitle: `Trạng thái: ${data.status}`,
        };
      }

      if (entityType === 'purchase_order') {
        const { data } = await supabase
          .from('purchase_orders')
          .select('id, po_code, status')
          .eq('id', entityId)
          .maybeSingle();

        if (!data) return null;
        return {
          id: data.id,
          type: 'purchase_order',
          name: `Đơn mua PO ${data.po_code}`,
          code: data.po_code,
          statusLabel: data.status || undefined,
          detailUrl: `/purchase-orders`,
          subtitle: `Trạng thái: ${data.status ?? 'N/A'}`,
        };
      }

      if (entityType === 'customer') {
        const { data } = await supabase
          .from('customers')
          .select('id, name, code, phone')
          .eq('id', entityId)
          .maybeSingle();

        if (!data) return null;
        return {
          id: data.id,
          type: 'customer',
          name: data.name,
          code: data.code,
          phone: data.phone || undefined,
          statusLabel: 'Khách hàng',
          detailUrl: `/customers`,
          subtitle: `Mã: ${data.code}`,
        };
      }

      return null;
    },
    enabled: Boolean(entityType && entityId),
    staleTime: 60_000,
  });
}
