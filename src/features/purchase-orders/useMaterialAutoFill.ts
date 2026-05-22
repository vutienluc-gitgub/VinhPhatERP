import { useEffect, useState } from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import toast from 'react-hot-toast';

import {
  fetchSupplierPrice,
  fetchAllSupplierPrices,
  type SupplierPrice,
} from '@/api/suppliers.api';
import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';
import { PO_CONSTANTS } from '@/features/purchase-orders/purchase-orders.constants';

interface UseMaterialAutoFillProps {
  watch: UseFormWatch<PurchaseOrderFormValues>;
  setValue: UseFormSetValue<PurchaseOrderFormValues>;
}

export function useMaterialAutoFill({
  watch,
  setValue,
}: UseMaterialAutoFillProps) {
  const supplierId = watch('supplier_id');
  const [supplierPrices, setSupplierPrices] = useState<
    (SupplierPrice & { material_id: string })[]
  >([]);

  useEffect(() => {
    if (!supplierId) {
      setSupplierPrices([]);
      return;
    }
    let active = true;
    fetchAllSupplierPrices(supplierId)
      .then((prices) => {
        if (active) {
          setSupplierPrices(prices);
        }
      })
      .catch((err) => {
        console.error(
          '[useMaterialAutoFill] Failed to fetch supplier prices',
          err,
        );
      });
    return () => {
      active = false;
    };
  }, [supplierId]);

  const handleMaterialBlur = async (index: number, materialId: string) => {
    const supId = watch('supplier_id');
    if (!supId || !materialId) return;

    // Check in loaded supplierPrices first
    const cached = supplierPrices.find((p) => p.material_id === materialId);
    if (cached) {
      setValue(`items.${index}.unit_price`, cached.unit_price, {
        shouldValidate: true,
      });
      setValue(
        `items.${index}.uom`,
        cached.uom as 'kg' | 'cây' | 'mét' | 'cuộn',
      );

      if (cached.moq > 0) {
        toast(
          `${PO_CONSTANTS.LABEL_SUPPLIER} ${PO_CONSTANTS.MSG_MOQ_REQUIRED} ${cached.moq} ${cached.uom} ${PO_CONSTANTS.MSG_FOR_MATERIAL} ${materialId}`,
          { icon: 'ℹ️' },
        );
      }
      return;
    }

    try {
      const priceInfo = await fetchSupplierPrice(supId, materialId);
      if (priceInfo) {
        setValue(`items.${index}.unit_price`, priceInfo.unit_price, {
          shouldValidate: true,
        });
        setValue(
          `items.${index}.uom`,
          priceInfo.uom as 'kg' | 'cây' | 'mét' | 'cuộn',
        );

        if (priceInfo.moq > 0) {
          toast(
            `${PO_CONSTANTS.LABEL_SUPPLIER} ${PO_CONSTANTS.MSG_MOQ_REQUIRED} ${priceInfo.moq} ${priceInfo.uom} ${PO_CONSTANTS.MSG_FOR_MATERIAL} ${materialId}`,
            { icon: 'ℹ️' },
          );
        }
      }
    } catch (error) {
      console.error('[useMaterialAutoFill] Failed to fetch price', error);
    }
  };

  return { handleMaterialBlur, supplierPrices };
}
