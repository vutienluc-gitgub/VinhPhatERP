import { useEffect, useState } from 'react';

import { supabase } from '@/services/supabase/client';
import { computeDebtSummary } from '@/features/customer-portal/utils';
import type {
  PortalOrder,
  PortalDebtSummary,
} from '@/features/customer-portal/types';

export function usePortalDebt() {
  const [summary, setSummary] = useState<PortalDebtSummary>({
    total_amount: 0,
    paid_amount: 0,
    remaining_debt: 0,
    overdue_orders: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDebt();
  }, []);

  async function fetchDebt() {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('orders')
      .select(
        'id, order_number, order_date, delivery_date, total_amount, paid_amount, status, customer_id',
      )
      .order('delivery_date', { ascending: true });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const rows = data ?? [];
    const totalAmount = rows.reduce((sum, o) => sum + o.total_amount, 0);
    const paidAmount = rows.reduce((sum, o) => sum + o.paid_amount, 0);
    const debt = computeDebtSummary(totalAmount, paidAmount);

    const overdueOrders: PortalOrder[] = rows
      .filter((o) => o.paid_amount < o.total_amount)
      .map((o) => ({
        id: o.id,
        order_number: o.order_number,
        order_date: o.order_date,
        due_date: o.delivery_date,
        total_amount: o.total_amount,
        paid_amount: o.paid_amount,
        status: o.status,
        customer_id: o.customer_id,
      }));

    setSummary({
      ...debt,
      overdue_orders: overdueOrders,
    });
    setLoading(false);
  }

  return {
    totalAmount: summary.total_amount,
    paidAmount: summary.paid_amount,
    remainingDebt: summary.remaining_debt,
    overdueOrders: summary.overdue_orders,
    loading,
    error,
  };
}
