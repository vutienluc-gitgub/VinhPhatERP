import { useMemo } from 'react';

import type { SupplierPrice } from '@/api/suppliers.api';
import type { GlobalMaterialOption } from '@/features/procurement/purchase-orders/useMaterialAutoFill';
import { formatCurrency } from '@/shared/value/core/formatter';

export function usePOItemsTableLogic(
  globalMaterials: GlobalMaterialOption[],
  supplierPrices: (SupplierPrice & { material_id: string })[],
) {
  const materialOptions = useMemo(() => {
    const options: Array<{
      value: string;
      label: string;
      code?: string;
      desc?: string;
    }> = globalMaterials.map((mat) => {
      const priceInfo = supplierPrices.find((p) => p.material_id === mat.id);

      if (priceInfo) {
        return {
          value: mat.id,
          label: `${mat.code} - ${mat.name}`,
          code: mat.code,
          // eslint-disable-next-line no-restricted-syntax
          desc: `Giá HĐ: ${formatCurrency(priceInfo.unit_price)} | ĐVT: ${priceInfo.uom} | MOQ: ${priceInfo.moq} | Leadtime: ${priceInfo.lead_time_days} ngày`,
        };
      }

      return {
        value: mat.id,
        label: `${mat.code} - ${mat.name}`,
        code: mat.code,
        desc: `(Chưa có giá hợp đồng) Loại: ${mat.type === 'yarn' ? 'Sợi' : 'Vải'} | ĐVT: ${mat.unit}`,
      };
    });

    // Include any supplier materials that might not be in the global catalog (just in case)
    const globalIds = new Set(globalMaterials.map((m) => m.id));
    supplierPrices.forEach((p) => {
      if (!globalIds.has(p.material_id)) {
        options.push({
          value: p.material_id,
          label: p.material_id, // We don't have the code/name if not in global catalog
          // eslint-disable-next-line no-restricted-syntax
          desc: `Giá HĐ: ${formatCurrency(p.unit_price)} | ĐVT: ${p.uom} | MOQ: ${p.moq} | Leadtime: ${p.lead_time_days} ngày`,
        });
      }
    });

    return options;
  }, [globalMaterials, supplierPrices]);

  return { materialOptions };
}
