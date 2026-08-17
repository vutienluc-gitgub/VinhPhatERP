import { useEffect } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import { yarnCatalogDefaultValues } from '@/schema/yarn-catalog.schema';
import type { YarnCatalogFormValues } from '@/schema/yarn-catalog.schema';
import type { YarnCatalog } from '@/domain/settings/yarn-catalog.types';

function catalogToFormValues(catalog: YarnCatalog): YarnCatalogFormValues {
  return {
    code: catalog.code,
    name: catalog.name,
    composition: catalog.composition ?? '',
    color_name: catalog.color_name ?? '',
    tensile_strength: catalog.tensile_strength ?? '',
    origin: catalog.origin ?? '',
    lot_no: catalog.lot_no ?? '',
    grade: catalog.grade ?? '',
    category: catalog.category ?? '',
    yarn_type: catalog.yarn_type ?? '',
    denier: catalog.denier ?? '',
    filament_count: catalog.filament_count ?? '',
    finish: catalog.finish ?? '',
    color_status: catalog.color_status ?? '',
    count_ne: catalog.count_ne ?? '',
    spinning_method: catalog.spinning_method ?? '',
    twist_type: catalog.twist_type ?? '',
    certifications: catalog.certifications ?? [],
    is_fancy: catalog.is_fancy ?? false,
    fancy_details: catalog.fancy_details ?? '',
    unit: catalog.unit,
    notes: catalog.notes ?? '',
    status: catalog.status,
  };
}

type UseFormInitializationParams = {
  catalog: YarnCatalog | null;
  isEditing: boolean;
  nextCode?: string;
  methods: UseFormReturn<YarnCatalogFormValues>;
};

export function useFormInitialization({
  catalog,
  isEditing,
  nextCode,
  methods,
}: UseFormInitializationParams) {
  const { reset, setValue } = methods;

  // Initialize form values when catalog changes
  useEffect(() => {
    reset(isEditing ? catalogToFormValues(catalog!) : yarnCatalogDefaultValues);
  }, [catalog, isEditing, reset]);

  // Set next code for new catalog
  useEffect(() => {
    if (!isEditing && nextCode) {
      setValue('code', nextCode);
    }
  }, [isEditing, nextCode, setValue]);
}
