import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/services/supabase/client';
import { customerPortalAudit } from '@/features/customer-portal/audit/customerQueryAuditLogger';
import type { PortalShipment } from '@/domain/portal/types';

export function usePortalShipments(shipmentId?: string) {
  const [shipments, setShipments] = useState<PortalShipment[]>([]);
  const [shipment, setShipment] = useState<PortalShipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (shipmentId) {
      fetchShipmentDetail(shipmentId);
    } else {
      fetchShipments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shipmentId]);

  async function fetchShipments() {
    setLoading(true);
    setError(null);

    const tracker = customerPortalAudit.startQuery('portal-shipments', {
      caller: 'usePortalShipments.fetchShipments',
    });

    tracker.logFetch('shipments', {
      select: 'id, shipment_number, shipment_date, order_id, status, delivery_address, customer_id, orders',
      order: 'shipment_date DESC',
    });

    const { data, error: err } = await supabase
      .from('shipments')
      .select(
        'id, shipment_number, shipment_date, order_id, status, delivery_address, customer_id, orders(order_number)',
      )
      .order('shipment_date', { ascending: false });

    if (err) {
      tracker.logError(err);
      setError(err.message);
    } else {
      tracker.logResponse(data, null, data?.length ?? 0);
      const mapped = (data ?? []).map((s) => ({
        id: s.id,
        shipment_number: s.shipment_number,
        shipment_date: s.shipment_date,
        order_number:
          (s.orders as { order_number: string } | null)?.order_number ?? null,
        status: s.status,
        delivery_address: s.delivery_address,
        customer_id: s.customer_id,
      }));

      tracker.logTransform(data, mapped);
      tracker.logComplete(mapped);
      setShipments(mapped);
    }
    setLoading(false);
  }

  async function fetchShipmentDetail(id: string) {
    setLoading(true);
    setError(null);

    const tracker = customerPortalAudit.startQuery('portal-shipment-detail', {
      caller: 'usePortalShipments.fetchShipmentDetail',
      shipmentId: id,
    });

    tracker.logFetch('shipments', {
      select: 'shipments.*, shipment_items.*',
      filters: { id },
    });

    const { data, error: err } = await supabase
      .from('shipments')
      .select(
        'id, shipment_number, shipment_date, order_id, status, delivery_address, customer_id, orders(order_number), shipment_items(id, fabric_type, quantity, unit)',
      )
      .eq('id', id)
      .single();

    if (err) {
      tracker.logError(err);
      setError(err.message);
    } else if (data) {
      tracker.logResponse(data, null, 1);
      const mapped = {
        id: data.id,
        shipment_number: data.shipment_number,
        shipment_date: data.shipment_date,
        order_number:
          (data.orders as { order_number: string } | null)?.order_number ??
          null,
        status: data.status,
        delivery_address: data.delivery_address,
        customer_id: data.customer_id,
        items: (data.shipment_items ?? []).map((i) => ({
          roll_number: i.id,
          fabric_type: i.fabric_type,
          weight_kg: null,
          length_m: i.unit === 'm' ? i.quantity : null,
        })),
      };

      tracker.logTransform(data, mapped);
      tracker.logComplete(mapped);
      setShipment(mapped);
    }
    setLoading(false);
  }


  return {
    shipments,
    shipment,
    loading,
    error,
    prependShipment: useCallback((newShipment: PortalShipment) => {
      setShipments((prev) => [newShipment, ...prev]);
    }, []),
  };
}
