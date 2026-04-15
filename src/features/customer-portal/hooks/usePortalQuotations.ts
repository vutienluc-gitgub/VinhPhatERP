import { useState, useEffect, useCallback } from 'react';

import { supabase } from '@/services/supabase/client';
import type { PortalQuotation } from '@/features/customer-portal/types';

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
    if (!quotation) return;
    try {
      const { error: updateError } = await supabase
        .from('quotations')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;
      setQuotation({
        ...quotation,
        status: 'confirmed',
      });
      return { success: true };
    } catch (err: unknown) {
      console.error('Error accepting quotation:', err);
      return {
        success: false,
        error: 'Không thể duyệt báo giá này',
      };
    }
  };

  const rejectQuotation = async (reason: string) => {
    if (!quotation) return;
    try {
      const { error: updateError } = await supabase
        .from('quotations')
        .update({
          status: 'rejected',
          notes: quotation.notes
            ? `${quotation.notes}\nLý do từ chối: ${reason}`
            : `Lý do từ chối: ${reason}`,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      setQuotation({
        ...quotation,
        status: 'rejected',
      });
      return { success: true };
    } catch (err: unknown) {
      console.error('Error rejecting quotation:', err);
      return {
        success: false,
        error: 'Không thể từ chối báo giá',
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
