import { useContext } from 'react';

import { RFQContext } from '@/features/fabric-catalog/context/RFQContext';
import type { RFQContextValue } from '@/features/fabric-catalog/context/RFQContext';

export function useRFQ(): RFQContextValue {
  const ctx = useContext(RFQContext);
  if (!ctx) {
    throw new Error('useRFQ must be used within <RFQProvider>');
  }
  return ctx;
}
