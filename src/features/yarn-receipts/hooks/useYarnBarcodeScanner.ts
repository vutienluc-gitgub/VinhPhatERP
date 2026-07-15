import { useState } from 'react';
import toast from 'react-hot-toast';
import type {
  UseFieldArrayAppend,
  UseFieldArrayUpdate,
  UseFormGetValues,
} from 'react-hook-form';

import { fetchYarnSpecsFromVendorApi } from '@/api/vendor-integration.api';
import { emptyYarnReceiptItem } from '@/schema/yarn-receipt.schema';
import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';
import {
  FORM_MESSAGES,
  DEV_SAMPLE_BARCODE,
} from '@/features/yarn-receipts/yarn-receipts.constants';

type UseYarnBarcodeScannerProps = {
  getValues: UseFormGetValues<YarnReceiptsFormValues>;
  append: UseFieldArrayAppend<YarnReceiptsFormValues, 'items'>;
  update: UseFieldArrayUpdate<YarnReceiptsFormValues, 'items'>;
};

export function useYarnBarcodeScanner({
  getValues,
  append,
  update,
}: UseYarnBarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const processBarcode = async (code: string) => {
    setShowScanner(false);
    setIsScanning(true);
    try {
      const parsedData = await fetchYarnSpecsFromVendorApi(code);
      const items = getValues('items');
      const lastIndex = items.length - 1;
      const lastItem = items[lastIndex];

      const isLastItemEmpty =
        lastItem && !lastItem.yarnType && lastItem.quantity === 0;

      if (isLastItemEmpty) {
        update(lastIndex, {
          ...emptyYarnReceiptItem,
          ...parsedData,
        });
      } else {
        append({
          ...emptyYarnReceiptItem,
          ...parsedData,
        });
      }
      toast.success(FORM_MESSAGES.scanSuccess);
    } catch (err) {
      const msg = err instanceof Error ? err.message : FORM_MESSAGES.scanError;
      toast.error(msg);
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualBarcode = () => {
    const code = window.prompt(
      `Nhập mã Barcode (thử: ${DEV_SAMPLE_BARCODE}):`,
      DEV_SAMPLE_BARCODE,
    );
    if (!code) return;
    processBarcode(code);
  };

  return {
    isScanning,
    showScanner,
    setShowScanner,
    processBarcode,
    handleManualBarcode,
  };
}
