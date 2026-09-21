import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/services/supabase/client';
import { customerPortalAudit } from '@/features/customer-portal/audit/customerQueryAuditLogger';

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

      const isCustomerContext = entityType === 'customer';
      const tracker = customerPortalAudit.startQuery(
        isCustomerContext ? 'customer-chat-context' : `chat-entity-${entityType}`,
        {
          entityType,
          entityId,
          customerId: isCustomerContext ? entityId : undefined,
          caller: 'useChatContext',
        },
      );

      try {
        if (entityType === 'supplier') {
          tracker.logFetch('suppliers', {
            select: 'id, name, code, phone',
            filters: { id: entityId },
          });

          const { data, error } = await supabase
            .from('suppliers')
            .select('id, name, code, phone')
            .eq('id', entityId)
            .maybeSingle();

          if (error) {
            tracker.logError(error);
            return null;
          }

          tracker.logResponse(data, null, data ? 1 : 0);
          if (!data) {
            tracker.logComplete(null);
            return null;
          }

          const transformed: ChatEntityContext = {
            id: data.id,
            type: 'supplier',
            name: data.name,
            code: data.code,
            phone: data.phone || undefined,
            statusLabel: 'Nhà cung cấp',
            detailUrl: `/suppliers`,
            subtitle: `Mã: ${data.code}`,
          };

          tracker.logTransform(data, transformed, { contextType: 'supplier' });
          tracker.logComplete(transformed);
          return transformed;
        }

        if (entityType === 'shipment') {
          tracker.logFetch('shipments', {
            select: 'id, shipment_number, status',
            filters: { id: entityId },
          });

          const { data, error } = await supabase
            .from('shipments')
            .select('id, shipment_number, status')
            .eq('id', entityId)
            .maybeSingle();

          if (error) {
            tracker.logError(error);
            return null;
          }

          tracker.logResponse(data, null, data ? 1 : 0);
          if (!data) {
            tracker.logComplete(null);
            return null;
          }

          const transformed: ChatEntityContext = {
            id: data.id,
            type: 'shipment',
            name: `Lô hàng ${data.shipment_number}`,
            code: data.shipment_number,
            statusLabel: data.status,
            detailUrl: `/shipments`,
            subtitle: `Trạng thái: ${data.status}`,
          };

          tracker.logTransform(data, transformed, { contextType: 'shipment' });
          tracker.logComplete(transformed);
          return transformed;
        }

        if (entityType === 'purchase_order') {
          tracker.logFetch('purchase_orders', {
            select: 'id, po_code, status',
            filters: { id: entityId },
          });

          const { data, error } = await supabase
            .from('purchase_orders')
            .select('id, po_code, status')
            .eq('id', entityId)
            .maybeSingle();

          if (error) {
            tracker.logError(error);
            return null;
          }

          tracker.logResponse(data, null, data ? 1 : 0);
          if (!data) {
            tracker.logComplete(null);
            return null;
          }

          const transformed: ChatEntityContext = {
            id: data.id,
            type: 'purchase_order',
            name: `Đơn mua PO ${data.po_code}`,
            code: data.po_code,
            statusLabel: data.status || undefined,
            detailUrl: `/purchase-orders`,
            subtitle: `Trạng thái: ${data.status ?? 'N/A'}`,
          };

          tracker.logTransform(data, transformed, { contextType: 'purchase_order' });
          tracker.logComplete(transformed);
          return transformed;
        }

        if (entityType === 'customer') {
          tracker.logFetch('customers', {
            select: 'id, name, code, phone',
            filters: { id: entityId },
          });

          const { data, error } = await supabase
            .from('customers')
            .select('id, name, code, phone')
            .eq('id', entityId)
            .maybeSingle();

          if (error) {
            tracker.logError(error);
            return null;
          }

          tracker.logResponse(data, null, data ? 1 : 0);
          if (!data) {
            tracker.logComplete(null);
            return null;
          }

          const transformed: ChatEntityContext = {
            id: data.id,
            type: 'customer',
            name: data.name,
            code: data.code,
            phone: data.phone || undefined,
            statusLabel: 'Khách hàng',
            detailUrl: `/customers`,
            subtitle: `Mã: ${data.code}`,
          };

          // Logs the transformation and automatically detects REVERSED_ROLE_CONTEXT anomaly
          tracker.logTransform(data, transformed, {
            contextType: 'customer',
            isPortalUser: window.location.pathname.startsWith('/portal'),
          });
          tracker.logComplete(transformed);
          return transformed;
        }

        tracker.logComplete(null);
        return null;
      } catch (err) {
        tracker.logError(err);
        throw err;
      }
    },
    enabled: Boolean(entityType && entityId),
    staleTime: 60_000,
  });
}

