import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';

import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';

type YarnCatalogInfo = {
  id: string;
  name: string;
  color_name: string | null;
  composition: string | null;
  tensile_strength: string | null;
  origin: string | null;
  grade: string | null;
  unit: string;
};

export function useYarnReceiptItemRow(
  index: number,
  yarnCatalogs: YarnCatalogInfo[],
) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<YarnReceiptsFormValues>();

  const itemErrors = errors.items?.[index];

  const handleYarnTypeChange = useCallback(
    (val: string, onChange: (val: string) => void) => {
      onChange(val);
      const cat = yarnCatalogs.find((c) => c.name === val);
      if (cat) {
        setValue(`items.${index}.yarnCatalogId`, cat.id);
        setValue(`items.${index}.colorName`, cat.color_name ?? '');
        setValue(`items.${index}.composition`, cat.composition ?? '');
        setValue(`items.${index}.tensileStrength`, cat.tensile_strength ?? '');
        setValue(`items.${index}.origin`, cat.origin ?? '');
        setValue(`items.${index}.grade`, cat.grade ?? '');
        setValue(`items.${index}.unit`, cat.unit ?? 'kg');
      } else {
        setValue(`items.${index}.yarnCatalogId`, '');
      }
    },
    [index, yarnCatalogs, setValue],
  );

  return {
    control,
    register,
    itemErrors,
    handleYarnTypeChange,
  };
}

export function parseNullableNumber(v: string): number | null {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}
