import { useContext } from 'react';

import { InquiryContext } from '@/features/fabric-catalog/context/InquiryContext';
import type { InquiryContextValue } from '@/features/fabric-catalog/context/InquiryContext';

export function useInquiry(): InquiryContextValue {
  const ctx = useContext(InquiryContext);
  if (!ctx) {
    throw new Error('useInquiry must be used within <InquiryProvider>');
  }
  return ctx;
}
