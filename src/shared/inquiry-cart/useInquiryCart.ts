import { useContext } from 'react';

import { InquiryCartContext } from './InquiryCartProvider';
import { InquiryCartContextValue } from './inquiry-cart.types';

export function useInquiryCart(): InquiryCartContextValue {
  const context = useContext(InquiryCartContext);
  if (context === undefined) {
    throw new Error(
      'useInquiryCart must be used within an InquiryCartProvider',
    );
  }
  return context;
}
