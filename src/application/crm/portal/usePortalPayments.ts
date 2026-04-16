import { useEffect, useState } from 'react';

import { supabase } from '@/services/supabase/client';
import type { PortalPayment } from '@/features/customer-portal/types';

export function usePortalPayments() {
  const [payments, setPayments] = useState<PortalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('payments')
      .select(
        'id, payment_number, payment_date, amount, payment_method, orders(order_number)',
      )
      .order('payment_date', { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      setPayments(
        (data ?? []).map((p) => ({
          id: p.id,
          payment_number: p.payment_number,
          payment_date: p.payment_date,
          amount: p.amount,
          payment_method: p.payment_method,
          order_number:
            (p.orders as { order_number: string } | null)?.order_number ?? null,
        })),
      );
    }
    setLoading(false);
  }

  return {
    payments,
    loading,
    error,
  };
}
