import { useEffect, useState } from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import toast from 'react-hot-toast';

import {
  fetchSupplierPrice,
  fetchAllSupplierPrices,
  type SupplierPrice,
} from '@/api/suppliers.api';
import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';
import { fetchYarnCatalogOptions } from '@/api/yarn-catalog.api';
import { fetchFabricCatalogOptions } from '@/api/fabric-catalog.api';

import { PO_CONSTANTS as MSG } from './purchase-orders.constants';

export type GlobalMaterialOption = {
  id: string;
  name: string;
  code: string;
  type: 'yarn' | 'fabric';
  unit: string;
};

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
  const [globalMaterials, setGlobalMaterials] = useState<
    GlobalMaterialOption[]
  >([]);

  useEffect(() => {
    let active = true;
    Promise.all([fetchYarnCatalogOptions(), fetchFabricCatalogOptions()])
      .then(([yarns, fabrics]) => {
        if (!active) return;
        const mappedYarns: GlobalMaterialOption[] = yarns.map((y) => ({
          id: y.id,
          name: y.name,
          code: y.code,
          type: 'yarn',
          unit: y.unit,
        }));
        const mappedFabrics: GlobalMaterialOption[] = fabrics.map((f) => ({
          id: f.id,
          name: f.name,
          code: f.code,
          type: 'fabric',
          unit: f.unit,
        }));
        setGlobalMaterials([...mappedYarns, ...mappedFabrics]);
      })
      .catch((err) => {
        console.error(
          '[useMaterialAutoFill] Failed to fetch global materials',
          err,
        );
      });
    return () => {
      active = false;
    };
  }, []);

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
        const material = globalMaterials.find((m) => m.id === materialId);
        const displayName = material
          ? `[${material.code}] ${material.name}`
          : materialId;
        toast(
          `${PO_CONSTANTS.LABEL_SUPPLIER} ${PO_CONSTANTS.MSG_MOQ_REQUIRED} ${cached.moq} ${cached.uom} ${PO_CONSTANTS.MSG_FOR_MATERIAL} ${displayName}`,
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
          const material = globalMaterials.find((m) => m.id === materialId);
          const displayName = material
            ? `[${material.code}] ${material.name}`
            : materialId;
          toast(
            `${PO_CONSTANTS.LABEL_SUPPLIER} ${PO_CONSTANTS.MSG_MOQ_REQUIRED} ${priceInfo.moq} ${priceInfo.uom} ${PO_CONSTANTS.MSG_FOR_MATERIAL} ${displayName}`,
            { icon: 'ℹ️' },
          );
        }
      } else {
        const material = globalMaterials.find((m) => m.id === materialId);
        const displayName = material
          ? `[${material.code}] ${material.name}`
          : materialId;
        toast(MSG.ERR_NO_CONTRACT_PRICE(displayName), { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('[useMaterialAutoFill] Failed to fetch price', error);
    }
  };

  return { handleMaterialBlur, supplierPrices, globalMaterials };
}
