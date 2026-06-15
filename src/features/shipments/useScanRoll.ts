import { useState, useCallback } from 'react';

import { fetchFinishedRollByBarcode } from '@/api/finished-fabric.api';
import type { FinishedFabricRoll } from '@/domain/inventory/finished-fabric.types';

export function useScanRoll() {
  const [isScanning, setIsScanning] = useState(false);

  const scanRoll = useCallback(
    async (barcode: string): Promise<FinishedFabricRoll | null> => {
      if (!barcode.trim()) return null;
      try {
        setIsScanning(true);
        const roll = await fetchFinishedRollByBarcode(barcode);
        return roll;
      } catch (err) {
        console.error('[useScanRoll] Error:', err);
        return null;
      } finally {
        setIsScanning(false);
      }
    },
    [],
  );

  return {
    scanRoll,
    isScanning,
  };
}
