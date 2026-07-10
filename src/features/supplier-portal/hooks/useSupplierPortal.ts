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
