import { useFormContext, Controller } from 'react-hook-form';

import { Combobox, TagInput } from '@/shared/components';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import {
  LABELS,
  TECHNIQUE_OPTIONS,
} from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalog } from '@/features/fabric-catalog/types';

type AttributeSectionProps = {
  catalog: FabricCatalog | null;
};

export function AttributeSection({ catalog }: AttributeSectionProps) {
  const { control, watch } = useFormContext<FabricCatalogFormValues>();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Phân loại & Thuộc tính
        </h3>
      </div>
      <div className="form-grid grid-cols-2">
        <div className="form-field">
          <label>{LABELS.LABEL_COLOR}</label>
          <Controller
            name="color_tags"
            control={control}
            render={({ field }) => (
              <TagInput
                value={field.value ?? []}
                onChange={field.onChange}
                placeholder={LABELS.COLOR_TAG_PLACEHOLDER}
              />
            )}
          />
          {catalog?.color &&
            (!watch('color_tags') || watch('color_tags')?.length === 0) && (
              <p className="text-xs text-muted-foreground mt-1">
                {LABELS.OLD_DATA_HINT}
                {catalog.color}
              </p>
            )}
        </div>

        <div className="form-field">
          <label>{LABELS.LABEL_TECHNIQUE}</label>
          <Controller
            name="technique"
            control={control}
            render={({ field }) => (
              <Combobox
                options={TECHNIQUE_OPTIONS}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val || null)}
                placeholder={LABELS.TECHNIQUE_PLACEHOLDER}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
}
