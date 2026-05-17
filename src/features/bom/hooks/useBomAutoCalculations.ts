import { useEffect } from 'react';
import { UseFormReturn, useWatch } from 'react-hook-form';

import type { BomTemplateFormData } from '@/schema/bom.schema';
interface UseBomAutoCalculationsProps {
  form: UseFormReturn<BomTemplateFormData>;
  fabricCatalogs: { id: string; code: string }[];
  yarnCatalogs: { id: string; code: string }[];
  isEdit: boolean;
}

export function useBomAutoCalculations({
  form,
  fabricCatalogs,
  yarnCatalogs,
  isEdit,
}: UseBomAutoCalculationsProps) {
  const { control, setValue, getValues } = form;

  // Watch necessary fields for code generation
  const watchFabricId = useWatch({ control, name: 'target_fabric_id' });
  const watchItems = useWatch({ control, name: 'bom_yarn_items' }) || [];
  const watchFirstYarnId = watchItems[0]?.yarn_catalog_id;

  // Watch necessary fields for consumption calculation
  const watchWidthCm = useWatch({ control, name: 'target_width_cm' });
  const watchGsm = useWatch({ control, name: 'target_gsm' });

  // Track ratios explicitly to bypass RHF shallow equality limits on arrays
  const ratiosString = watchItems.map((i) => i.ratio_pct).join(',');

  // 1. Tự sinh mã BOM: BOM-<mã sản phẩm mộc>-<mã sợi đầu tiên>
  useEffect(() => {
    if (isEdit) return; // Không đổi mã khi sửa

    const fabric = fabricCatalogs.find((f) => f.id === watchFabricId);
    const yarn = yarnCatalogs.find((y) => y.id === watchFirstYarnId);

    const fabricCode = fabric?.code ?? '';
    const yarnCode = yarn?.code ?? '';

    if (fabricCode || yarnCode) {
      const parts = ['BOM', fabricCode, yarnCode].filter(Boolean);
      setValue('code', parts.join('-'), { shouldValidate: true });
    }
  }, [
    watchFabricId,
    watchFirstYarnId,
    fabricCatalogs,
    yarnCatalogs,
    isEdit,
    setValue,
  ]);

  // 2. Tự động tính Tiêu hao (kg/m)
  useEffect(() => {
    if (watchWidthCm && watchGsm) {
      // 1 mét chiều dài -> Trọng lượng = (Width_cm / 100) * 1m * GSM / 1000 (kg)
      const totalKgPerM = (watchWidthCm * watchGsm) / 100000;
      const currentItems = getValues('bom_yarn_items') || [];

      currentItems.forEach((item, index) => {
        const ratio = Number(item.ratio_pct) || 0;
        // Chia tỉ lệ sợi, giới hạn 4 số thập phân để chính xác
        const consumption = Number(((totalKgPerM * ratio) / 100).toFixed(4));

        // Tránh infinite loop: chỉ set nếu thực sự có sự sai lệch
        if (Math.abs((item.consumption_kg_per_m || 0) - consumption) > 0.0001) {
          setValue(
            `bom_yarn_items.${index}.consumption_kg_per_m` as const,
            consumption,
            {
              shouldValidate: true,
              shouldDirty: true,
            },
          );
        }
      });
    }
  }, [watchWidthCm, watchGsm, ratiosString, setValue, getValues]);
}
