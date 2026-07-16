import { useCallback, useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

import type { ShippingRate } from '@/shared/hooks/useShippingRateOptions';
import {
  adHocShipmentDefaultValues,
  adHocShipmentSchema,
  emptyAdHocItem,
  type AdHocShipmentFormValues,
} from '@/schema/shipment.schema';
import { sumBy } from '@/shared/utils/array.util';

import { useScanRoll } from './useScanRoll';
import { AD_HOC_SHIPMENT_MESSAGES } from './shipments.constants';

function computeShippingCost(
  rate: ShippingRate | undefined,
  totalMeters: number,
): { shippingCost: number; loadingFee: number } {
  if (!rate) return { shippingCost: 0, loadingFee: 0 };

  let cost = 0;
  if (rate.rate_per_trip != null) {
    cost = rate.rate_per_trip;
  } else if (rate.rate_per_meter != null) {
    cost = rate.rate_per_meter * totalMeters;
  }

  const total = cost + (rate.loading_fee ?? 0);
  const finalCost =
    rate.min_charge > 0 ? Math.max(total, rate.min_charge) : total;

  return {
    shippingCost: Math.round(finalCost - (rate.loading_fee ?? 0)),
    loadingFee: rate.loading_fee ?? 0,
  };
}

export function useAdHocShipmentForm(shippingRates: ShippingRate[]) {
  const form = useForm<AdHocShipmentFormValues>({
    resolver: zodResolver(adHocShipmentSchema),
    defaultValues: { ...adHocShipmentDefaultValues },
  });

  const { control, setValue, watch } = form;

  const { scanRoll, isScanning } = useScanRoll();

  const fieldArray = useFieldArray({
    control,
    name: 'items',
  });

  const watchedRateId = watch('shippingRateId');
  const watchedItems = watch('items');

  const shippingRateById = useMemo(
    () => new Map(shippingRates.map((r) => [r.id, r])),
    [shippingRates],
  );

  // Compute totals
  const itemsSummary = useMemo(() => {
    const items = watchedItems ?? [];
    const totalAmount = sumBy(items, (item) => item.totalAmount || 0);
    const totalQty = sumBy(items, (item) => item.quantity || 0);
    return {
      count: items.length,
      totalQty,
      totalAmount,
    };
  }, [watchedItems]);

  // Auto-compute total for each item when quantity or price changes
  const handleItemFieldChange = useCallback(
    (index: number) => {
      const items = watchedItems ?? [];
      const item = items[index];
      if (!item) return;
      const total = (item.quantity || 0) * (item.pricePerKg || 0);
      setValue(`items.${index}.totalAmount`, Math.round(total));
    },
    [watchedItems, setValue],
  );

  // Auto-compute shipping cost when rate changes
  useEffect(() => {
    if (!watchedRateId) return;
    const rate = shippingRateById.get(watchedRateId);
    const items = watchedItems ?? [];
    const totalMeters = sumBy(items, (item) =>
      item.unit === 'm' ? item.quantity || 0 : 0,
    );
    const { shippingCost, loadingFee } = computeShippingCost(rate, totalMeters);
    setValue('shippingCost', shippingCost);
    setValue('loadingFee', loadingFee);
  }, [watchedRateId, watchedItems, setValue, shippingRateById]);

  function handleAddRow() {
    fieldArray.append({ ...emptyAdHocItem });
  }

  function handleRemoveRow(index: number, showToastError: () => void) {
    if (fieldArray.fields.length <= 1) {
      showToastError();
      return;
    }
    fieldArray.remove(index);
  }

  async function handleScanRow(index: number, barcode: string) {
    if (!barcode) return;
    const roll = await scanRoll(barcode);
    if (!roll) {
      toast.error(`${AD_HOC_SHIPMENT_MESSAGES.SCAN_ERROR} ${barcode}`);
      return;
    }

    // Auto-fill row
    setValue(`items.${index}.finishedRollId`, roll.id);
    setValue(`items.${index}.fabricType`, roll.fabric_type);

    // Choose unit based on length or weight. Length takes precedence usually
    if (roll.length_m) {
      setValue(`items.${index}.unit`, 'm');
      setValue(`items.${index}.quantity`, roll.length_m);
    } else if (roll.weight_kg) {
      setValue(`items.${index}.unit`, 'kg');
      setValue(`items.${index}.quantity`, roll.weight_kg);
    }

    handleItemFieldChange(index);
    toast.success(AD_HOC_SHIPMENT_MESSAGES.SCAN_SUCCESS);
  }

  return {
    form,
    fieldArray,
    itemsSummary,
    isScanning,
    handleItemFieldChange,
    handleAddRow,
    handleRemoveRow,
    handleScanRow,
  };
}
