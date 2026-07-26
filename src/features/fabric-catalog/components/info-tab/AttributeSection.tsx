import { useFormContext, Controller } from 'react-hook-form';

import { Combobox, TagInput } from '@/shared/components';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import {
  LABELS,
  TECHNIQUE_OPTIONS,
  STRETCH_TYPE_MAP,
  THICKNESS_MAP,
  PUBLIC_PAGE_LABELS,
} from '@/features/fabric-catalog/fabric-catalog.constants';
import type { FabricCatalog } from '@/features/fabric-catalog/types';

const STRETCH_OPTIONS = Object.entries(STRETCH_TYPE_MAP).map(
  ([value, label]) => ({ value, label }),
);
const THICKNESS_OPTIONS = Object.entries(THICKNESS_MAP).map(
  ([value, label]) => ({ value, label }),
);

type AttributeSectionProps = {
  catalog: FabricCatalog | null;
};

export function AttributeSection({ catalog }: AttributeSectionProps) {
  const { control, watch } = useFormContext<FabricCatalogFormValues>();

  return (
    <fieldset className="border border-slate-200 p-4 rounded-md mb-6 relative mt-4">
      <legend className="text-sm font-semibold px-2 text-slate-700">
        Phân loại & Thuộc tính
      </legend>
      <div className="form-grid sm:grid-cols-2">
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
              <p className="text-xs text-muted mt-1">
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

      <div className="form-grid sm:grid-cols-2 mt-4">
        <div className="form-field">
          <label>{PUBLIC_PAGE_LABELS.stretch}</label>
          <Controller
            name="stretch_type"
            control={control}
            render={({ field }) => (
              <Combobox
                options={STRETCH_OPTIONS}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val || null)}
                placeholder={LABELS.STRETCH_PLACEHOLDER}
              />
            )}
          />
        </div>

        <div className="form-field">
          <label>{PUBLIC_PAGE_LABELS.thickness}</label>
          <Controller
            name="thickness"
            control={control}
            render={({ field }) => (
              <Combobox
                options={THICKNESS_OPTIONS}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val || null)}
                placeholder={LABELS.THICKNESS_PLACEHOLDER}
              />
            )}
          />
        </div>
      </div>
    </fieldset>
  );
}
