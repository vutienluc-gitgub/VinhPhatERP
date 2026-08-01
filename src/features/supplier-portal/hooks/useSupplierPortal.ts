import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import {
  fetchPublicRfqDetails,
  submitSupplierQuote,
  SubmitQuotePayload,
} from '@/api/supplier-portal.api';

export const SUPPLIER_PORTAL_KEYS = {
  rfqDetails: (id: string | null) => ['public-rfq', id] as const,
};

export function usePublicRfqDetails(rfqId: string | null) {
  return useQuery({
    queryKey: SUPPLIER_PORTAL_KEYS.rfqDetails(rfqId),
    queryFn: () => {
      if (!rfqId) throw new Error('Mã RFQ không hợp lệ');
      return fetchPublicRfqDetails(rfqId);
    },
    enabled: !!rfqId,
    retry: false, // Don't retry if it's 404 or closed
  });
}

export function useSubmitSupplierQuote() {
  return useMutation({
    mutationFn: (payload: SubmitQuotePayload) => submitSupplierQuote(payload),
    onSuccess: () => {
      toast.success('Gửi báo giá thành công!');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}

export function usePublicPoDetails(token: string | null) {
  return useQuery({
    queryKey: ['public-po', token],
    queryFn: () => {
      if (!token) throw new Error('Mã truy cập không hợp lệ');
      return import('@/api/supplier-portal.api').then((m) =>
        m.fetchPublicPoDetails(token),
      );
    },
    enabled: !!token,
    retry: false,
  });
}

export function useConfirmPublicPo() {
  return useMutation({
    mutationFn: (
      payload: import('@/api/supplier-portal.api').ConfirmPublicPoPayload,
    ) =>
      import('@/api/supplier-portal.api').then((m) =>
        m.confirmPublicPo(payload),
      ),
    onSuccess: () => {
      toast.success('Xác nhận Đơn đặt hàng thành công!');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}

export function useRejectPublicPo() {
  return useMutation({
    mutationFn: (
      payload: import('@/api/supplier-portal.api').RejectPublicPoPayload,
    ) =>
      import('@/api/supplier-portal.api').then((m) =>
        m.rejectPublicPo(payload),
      ),
    onSuccess: () => {
      toast.success('Đã gửi phản hồi từ chối thành công');
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}

export function usePublicPoComments(token: string | null) {
  return useQuery({
    queryKey: ['public-po-comments', token],
    queryFn: () => {
      if (!token) throw new Error('Mã truy cập không hợp lệ');
      return import('@/api/supplier-portal.api').then((m) =>
        m.getPublicPoComments(token),
      );
    },
    enabled: !!token,
    refetchInterval: () => {
      return typeof document !== 'undefined' &&
        document.visibilityState === 'visible'
        ? 10000
        : false;
    },
  });
}

export function useAddPublicPoComment() {
  return useMutation({
    mutationFn: (payload: { token: string; content: string }) =>
      import('@/api/supplier-portal.api').then((m) =>
        m.addPublicPoComment(payload),
      ),
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`);
    },
  });
}
