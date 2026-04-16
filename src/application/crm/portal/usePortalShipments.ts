import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/services/supabase/client';
import type { PortalShipment } from '@/features/customer-portal/types';

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

    const { data, error: err } = await supabase
      .from('shipments')
      .select(
        'id, shipment_number, shipment_date, order_id, status, delivery_address, customer_id, orders(order_number)',
      )
      .order('shipment_date', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setShipments(
        (data ?? []).map((s) => ({
          id: s.id,
          shipment_number: s.shipment_number,
          shipment_date: s.shipment_date,
          order_number:
            (s.orders as { order_number: string } | null)?.order_number ?? null,
          status: s.status,
          delivery_address: s.delivery_address,
          customer_id: s.customer_id,
        })),
      );
    }
    setLoading(false);
  }

  async function fetchShipmentDetail(id: string) {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('shipments')
      .select(
        'id, shipment_number, shipment_date, order_id, status, delivery_address, customer_id, orders(order_number), shipment_items(id, fabric_type, quantity, unit)',
      )
      .eq('id', id)
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setShipment({
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
      });
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
