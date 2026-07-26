import { useFormContext } from 'react-hook-form';

import { LengthField, DensityField } from '@/shared/value';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

export function SpecificationSection() {
  const { control } = useFormContext<FabricCatalogFormValues>();

  return (
    <fieldset className="border border-slate-200 p-4 rounded-md mb-6 relative mt-4">
      <legend className="text-sm font-semibold px-2 text-slate-700">
        Thông số kỹ thuật
      </legend>
      <div className="form-grid sm:grid-cols-2">
        <LengthField
          control={control}
          name="target_width_cm"
          label={LABELS.WIDTH}
          suffix="cm"
          placeholder={LABELS.WIDTH_PLACEHOLDER}
          allowNegative={false}
        />

        <DensityField
          control={control}
          name="target_gsm"
          label={LABELS.GSM}
          placeholder={LABELS.GSM_PLACEHOLDER}
          allowNegative={false}
        />
      </div>
    </fieldset>
  );
}
