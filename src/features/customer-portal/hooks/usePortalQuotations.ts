import { useState, useEffect, useCallback } from 'react';

import { supabase } from '@/services/supabase/client';
import type { PortalQuotation } from '@/features/customer-portal/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- RPCs chưa được sync vào database.types.ts
const rpc = supabase.rpc.bind(supabase) as (
  fn: string,
  args: Record<string, unknown>,
) => ReturnType<typeof supabase.rpc>;

const PAGE_SIZE = 10;

export function usePortalQuotations() {
  const [quotations, setQuotations] = useState<PortalQuotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const fetchQuotations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('quotations')
        .select(
          `
          id,
          quotation_number,
          quotation_date,
          valid_until,
          total_amount,
          status,
          customer_id,
          notes,
          items:quotation_items(
            id,
            fabric_type,
            color_name,
            quantity,
            unit,
            unit_price,
            amount,
            notes
          )
        `,
        )
        .neq('status', 'draft') // Khách hàng không xem được bản nháp
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (fetchError) throw fetchError;

      setQuotations(data as unknown as PortalQuotation[]);
    } catch (err: unknown) {
      console.error('Error fetching portal quotations:', err);
      setError('Không thể tải danh sách báo giá');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchQuotations();
  }, [fetchQuotations]);

  return {
    quotations,
    loading,
    error,
    page,
    setPage,
    refresh: fetchQuotations,
    PAGE_SIZE,
  };
}

export function usePortalQuotationDetail(id: string) {
  const [quotation, setQuotation] = useState<PortalQuotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('quotations')
        .select(
          `
          id,
          quotation_number,
          quotation_date,
          valid_until,
          total_amount,
          status,
          customer_id,
          notes,
          items:quotation_items(
            id,
            fabric_type,
            color_name,
            quantity,
            unit,
            unit_price,
            amount,
            notes
          )
        `,
        )
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      setQuotation(data as unknown as PortalQuotation);

      // Track hành vi VIEWED (nếu đang ở trạng thái 'sent')
      if (data.status === 'sent') {
        await supabase
          .from('quotations')
          .update({ status: 'sent' })
          .eq('id', id);
      }
    } catch (err: unknown) {
      console.error('Error fetching quotation detail:', err);
      setError('Hệ thống không tìm thấy báo giá này');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id, fetchDetail]);

  const acceptQuotation = async () => {
    if (!quotation)
      return {
        success: false,
        error: 'Quotation not found',
      };
    try {
      const { data, error: updateError } = await rpc(
        'rpc_portal_accept_quotation',
        {
          p_quotation_id: id,
        },
      );

      if (updateError) throw updateError;

      setQuotation({
        ...quotation,
        status: 'confirmed',
      });
      return {
        success: true,
        ...(data as Record<string, unknown>),
      };
    } catch (err: unknown) {
      console.error('Error accepting quotation:', err);
      const e = err as Error;
      // Extra message extraction logic matching Supabase error format
      const errorMessage = e?.message?.includes('QUOTATION_EXPIRED')
        ? 'Báo giá đã hết hạn, vui lòng liên hệ Sale để nhận báo giá mới'
        : e?.message?.includes('QUOTATION_ALREADY_ACCEPTED')
          ? 'Báo giá này đã được chấp nhận'
          : 'Không thể duyệt báo giá này do lỗi hệ thống';

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const rejectQuotation = async (reason: string) => {
    if (!quotation)
      return {
        success: false,
        error: 'Quotation not found',
      };
    try {
      const { error: updateError } = await rpc('rpc_portal_reject_quotation', {
        p_quotation_id: id,
        p_reason: reason,
      });

      if (updateError) throw updateError;

      setQuotation({
        ...quotation,
        status: 'rejected',
      });
      return { success: true };
    } catch (err: unknown) {
      console.error('Error rejecting quotation:', err);
      const e = err as Error;
      const errorMessage = e?.message?.includes('QUOTATION_ALREADY_ACCEPTED')
        ? 'Báo giá này đã được chấp nhận trước đó'
        : e?.message?.includes('QUOTATION_ALREADY_REJECTED')
          ? 'Báo giá này đã bị từ chối'
          : 'Không thể từ chối báo giá';

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    quotation,
    loading,
    error,
    acceptQuotation,
    rejectQuotation,
    refresh: fetchDetail,
  };
}
