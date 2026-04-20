import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/services/supabase/client';
// eslint-disable-next-line boundaries/dependencies
import { useAuth } from '@/features/auth/AuthProvider';

export type PortalOrderRequestItem = {
  fabric_type: string;
  color_name: string;
  quantity: number;
  unit: string;
  notes: string;
};

export type PortalOrderRequestPayload = {
  delivery_date: string | null;
  notes: string;
  items: PortalOrderRequestItem[];
};

export function usePortalOrderRequest() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { profile } = useAuth();

  async function submitOrderRequest(payload: PortalOrderRequestPayload) {
    if (!profile?.customer_id || !profile?.tenant_id) {
      setError(
        'Không tìm thấy thông tin định danh hệ thống (Customer / Tenant).',
      );
      return false;
    }

    setIsPending(true);
    setError(null);

    try {
      // Generate order number: PO-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(Math.random() * 9000) + 1000;
      const orderNumber = `PO-${dateStr}-${rand}`;

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          tenant_id: profile.tenant_id,
          customer_id: profile.customer_id,
          order_number: orderNumber,
          order_date: new Date().toISOString().slice(0, 10),
          delivery_date: payload.delivery_date,
          notes: payload.notes || null,
          status: 'pending_review',
          total_amount: 0,
          paid_amount: 0,
        })
        .select('id')
        .single();

      if (orderErr || !order) {
        throw new Error(orderErr?.message ?? 'Không thể tạo đơn hàng.');
      }

      // Insert order items
      if (payload.items.length > 0) {
        const { error: itemsErr } = await supabase.from('order_items').insert(
          payload.items.map((item, idx) => ({
            tenant_id: profile.tenant_id,
            order_id: order.id,
            fabric_type: item.fabric_type,
            color_name: item.color_name || null,
            quantity: item.quantity,
            unit: item.unit,
            unit_price: 0,
            notes: item.notes || null,
            sort_order: idx,
          })),
        );
        if (itemsErr) throw new Error(itemsErr.message);
      }

      await supabase.from('business_audit_log').insert({
        tenant_id: profile.tenant_id,
        entity_type: 'orders',
        entity_id: order.id,
        event_type: 'ORDER_REQUEST_CREATED',
        payload: {
          action: 'submit_from_portal',
          customer_name: profile.full_name,
        },
        user_id: profile.id,
      });

      void queryClient.invalidateQueries({ queryKey: ['portal-orders'] });
      setIsPending(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định.');
      setIsPending(false);
      return false;
    }
  }

  return {
    submitOrderRequest,
    isPending,
    error,
  };
}
