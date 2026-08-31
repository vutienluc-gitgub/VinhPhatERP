import { useEffect, useState } from 'react';

import { supabase } from '@/services/supabase/client';
import { useAuth } from '@/shared/hooks/useAuth';
import type { PortalPayment } from '@/domain/portal/types';

export function usePortalPayments() {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<PortalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.customer_id]);

  async function fetchPayments() {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('payments')
      .select(
        'id, payment_number, payment_date, amount, payment_method, customer_id, orders(order_number)',
      );

    if (profile?.role === 'customer') {
      if (!profile.customer_id) {
        setPayments([]);
        setLoading(false);
        return;
      }
      query = query.eq('customer_id', profile.customer_id);
    }

    const { data, error: err } = await query.order('payment_date', {
      ascending: false,
    });

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
