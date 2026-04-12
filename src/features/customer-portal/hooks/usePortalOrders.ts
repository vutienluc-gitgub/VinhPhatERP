import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/services/supabase/client';
import { computeStageOverdue } from '@/features/customer-portal/utils';
import type {
  OrderStatus,
  PortalOrder,
  PortalProgressStage,
  StageStatus,
} from '@/features/customer-portal/types';

const PAGE_SIZE = 20;

export function usePortalOrders(orderId?: string) {
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [order, setOrder] = useState<PortalOrder | null>(null);
  const [stages, setStages] = useState<PortalProgressStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail(orderId);
    } else {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, page]);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error: err } = await supabase
      .from('orders')
      .select(
        'id, order_number, order_date, delivery_date, total_amount, paid_amount, status, customer_id, order_items(id, fabric_type, color_name, quantity, unit_price, amount)',
      )
      .order('order_date', { ascending: false })
      .range(from, to);

    if (err) {
      setError(err.message);
    } else {
      setOrders(
        (data ?? []).map((o) => ({
          id: o.id,
          order_number: o.order_number,
          order_date: o.order_date,
          due_date: o.delivery_date,
          total_amount: o.total_amount,
          paid_amount: o.paid_amount,
          status: o.status,
          customer_id: o.customer_id,
          items: (o.order_items ?? []).map((i) => ({
            id: i.id,
            fabric_name: i.fabric_type,
            color: i.color_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            amount: i.amount ?? i.quantity * i.unit_price,
          })),
        })),
      );
    }
    setLoading(false);
  }

  async function fetchOrderDetail(id: string) {
    setLoading(true);
    setError(null);

    const [orderRes, progressRes] = await Promise.all([
      supabase
        .from('orders')
        .select(
          'id, order_number, order_date, delivery_date, total_amount, paid_amount, status, customer_id, order_items(id, fabric_type, color_name, quantity, unit_price, amount)',
        )
        .eq('id', id)
        .single(),
      supabase
        .from('order_progress')
        .select('id, stage, status, planned_date, actual_date')
        .eq('order_id', id)
        .order('stage'),
    ]);

    if (orderRes.error) {
      setError(orderRes.error.message);
    } else if (orderRes.data) {
      const o = orderRes.data;
      setOrder({
        id: o.id,
        order_number: o.order_number,
        order_date: o.order_date,
        due_date: o.delivery_date,
        total_amount: o.total_amount,
        paid_amount: o.paid_amount,
        status: o.status,
        customer_id: o.customer_id,
        items: (o.order_items ?? []).map((i) => ({
          id: i.id,
          fabric_name: i.fabric_type,
          color: i.color_name,
          quantity: i.quantity,
          unit_price: i.unit_price,
          amount: i.amount ?? i.quantity * i.unit_price,
        })),
      });
    }

    if (!progressRes.error && progressRes.data) {
      setStages(
        progressRes.data.map((s) => ({
          id: s.id,
          stage: s.stage,
          status: s.status,
          planned_date: s.planned_date,
          actual_date: s.actual_date,
          ...computeStageOverdue({
            actual_date: s.actual_date,
            planned_date: s.planned_date,
          }),
        })),
      );
    }

    setLoading(false);
  }

  return {
    orders,
    order,
    stages,
    loading,
    error,
    page,
    setPage,
    PAGE_SIZE,
    updateOrderStatus: useCallback(
      (targetOrderId: string, newStatus: OrderStatus) => {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === targetOrderId
              ? {
                  ...o,
                  status: newStatus,
                }
              : o,
          ),
        );
        setOrder((prev) =>
          prev?.id === targetOrderId
            ? {
                ...prev,
                status: newStatus,
              }
            : prev,
        );
      },
      [],
    ),
    updateProgressStage: useCallback(
      (stageId: string, newStatus: StageStatus) => {
        setStages((prev) =>
          prev.map((s) =>
            s.id === stageId
              ? {
                  ...s,
                  status: newStatus,
                  ...computeStageOverdue({
                    actual_date: s.actual_date,
                    planned_date: s.planned_date,
                  }),
                }
              : s,
          ),
        );
      },
      [],
    ),
  };
}
