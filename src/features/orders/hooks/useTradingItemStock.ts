import { useMemo, useCallback } from 'react';
import type { Control, UseFormSetValue } from 'react-hook-form';

import {
  useTradingYarnStock,
  useTradingYarnLots,
  useTradingRawFabricRolls,
  useTradingFinishedFabricRolls,
} from '@/application/orders';
import { formatQuantity } from '@/shared/utils/format';
import type { OrdersFormValues, ProductCategory } from '@/schema/order.schema';

export function useTradingItemStock(
  index: number,
  control: Control<OrdersFormValues>,
  setValue: UseFormSetValue<OrdersFormValues>,
  productCategory: ProductCategory,
) {
  const { data: yarnStock = [] } = useTradingYarnStock();
  const { data: rawRolls = [] } = useTradingRawFabricRolls();
  const { data: finishedRolls = [] } = useTradingFinishedFabricRolls();

  // Current sourceStockId for yarn lot lookup
  const currentSourceStockId =
    (control._formValues as OrdersFormValues).items?.[index]?.sourceStockId ??
    '';
  const { data: yarnLots = [] } = useTradingYarnLots(
    productCategory === 'yarn' ? currentSourceStockId : '',
  );

  const lotOptions = useMemo(
    () =>
      yarnLots.map((lot) => ({
        value: lot.lot_number ?? lot.receipt_item_id,
        label: lot.lot_number
          ? `${lot.lot_number} (${lot.receipt_number})`
          : `Không có lô — ${lot.receipt_number}`,
        badge: `${formatQuantity(lot.quantity)} ${lot.unit}`,
      })),
    [yarnLots],
  );

  // Build combobox options based on selected category
  const stockOptions = useMemo(() => {
    switch (productCategory) {
      case 'yarn':
        return yarnStock.map((y) => ({
          value: y.id,
          label: `${y.code} — ${y.name}`,
          badge: `${formatQuantity(y.available_qty)} ${y.unit}`,
        }));
      case 'raw_fabric':
        return rawRolls.map((r) => ({
          value: r.id,
          label: `${r.roll_number} — ${r.fabric_type}`,
          badge: r.weight_kg
            ? `${formatQuantity(r.weight_kg)} kg`
            : r.length_m
              ? `${formatQuantity(r.length_m)} m`
              : '',
        }));
      case 'finished_fabric':
        return finishedRolls.map((r) => ({
          value: r.id,
          label: `${r.roll_number} — ${r.fabric_type}`,
          badge: r.weight_kg
            ? `${formatQuantity(r.weight_kg)} kg`
            : r.length_m
              ? `${formatQuantity(r.length_m)} m`
              : '',
        }));
      default:
        return [];
    }
  }, [productCategory, yarnStock, rawRolls, finishedRolls]);

  // When stock item is selected, auto-fill fields
  const handleStockSelect = useCallback(
    (stockId: string) => {
      setValue(`items.${index}.sourceStockId`, stockId);

      if (productCategory === 'yarn') {
        const yarn = yarnStock.find((y) => y.id === stockId);
        if (yarn) {
          setValue(`items.${index}.fabricType`, yarn.name);
          setValue(`items.${index}.colorName`, yarn.color_name ?? '');
          setValue(`items.${index}.unit`, yarn.unit === 'm' ? 'm' : 'kg');
        }
      } else if (productCategory === 'raw_fabric') {
        const roll = rawRolls.find((r) => r.id === stockId);
        if (roll) {
          setValue(`items.${index}.fabricType`, roll.fabric_type);
          setValue(`items.${index}.colorName`, roll.color_name ?? '');
          setValue(`items.${index}.colorCode`, roll.color_code ?? '');
          if (roll.weight_kg) {
            setValue(`items.${index}.quantity`, roll.weight_kg);
            setValue(`items.${index}.unit`, 'kg');
          } else if (roll.length_m) {
            setValue(`items.${index}.quantity`, roll.length_m);
            setValue(`items.${index}.unit`, 'm');
          }
        }
      } else if (productCategory === 'finished_fabric') {
        const roll = finishedRolls.find((r) => r.id === stockId);
        if (roll) {
          setValue(`items.${index}.fabricType`, roll.fabric_type);
          setValue(`items.${index}.colorName`, roll.color_name ?? '');
          setValue(`items.${index}.colorCode`, roll.color_code ?? '');
          if (roll.weight_kg) {
            setValue(`items.${index}.quantity`, roll.weight_kg);
            setValue(`items.${index}.unit`, 'kg');
          } else if (roll.length_m) {
            setValue(`items.${index}.quantity`, roll.length_m);
            setValue(`items.${index}.unit`, 'm');
          }
        }
      }
    },
    [setValue, index, productCategory, yarnStock, rawRolls, finishedRolls],
  );

  // Get available qty for selected stock (for display + validation)
  const getMaxAvailableQty = useCallback(() => {
    const sourceId = (control._formValues as OrdersFormValues).items?.[index]
      ?.sourceStockId;
    if (!sourceId) return null;

    if (productCategory === 'yarn') {
      const yarn = yarnStock.find((y) => y.id === sourceId);
      if (yarn)
        return {
          label: `Khả dụng: ${formatQuantity(yarn.available_qty)} ${yarn.unit}`,
          max: yarn.available_qty,
        };
    } else if (productCategory === 'raw_fabric') {
      const roll = rawRolls.find((r) => r.id === sourceId);
      if (roll) {
        const qty = roll.weight_kg ?? roll.length_m ?? 0;
        const unit = roll.weight_kg ? 'kg' : 'm';
        return { label: `Cuộn: ${formatQuantity(qty)} ${unit}`, max: qty };
      }
    } else if (productCategory === 'finished_fabric') {
      const roll = finishedRolls.find((r) => r.id === sourceId);
      if (roll) {
        const qty = roll.weight_kg ?? roll.length_m ?? 0;
        const unit = roll.weight_kg ? 'kg' : 'm';
        return { label: `Cuộn: ${formatQuantity(qty)} ${unit}`, max: qty };
      }
    }
    return null;
  }, [control, index, productCategory, yarnStock, rawRolls, finishedRolls]);

  return {
    lotOptions,
    stockOptions,
    handleStockSelect,
    getMaxAvailableQty,
  };
}
