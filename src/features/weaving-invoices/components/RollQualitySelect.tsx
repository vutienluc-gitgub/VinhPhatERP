import { Controller, type Control, type FieldError } from 'react-hook-form';

import {
  QUALITY_GRADES,
  QUALITY_GRADE_LABELS,
  type WeavingInvoiceFormValues,
} from '@/schema/weaving-invoice.schema';
import { VPSelect } from '@/shared/components';

const QUALITY_GRADE_OPTIONS = [
  { value: '', label: '— Chưa kiểm định —' },
  ...QUALITY_GRADES.map((g) => ({ value: g, label: QUALITY_GRADE_LABELS[g] })),
];

type RollQualitySelectProps = {
  control: Control<WeavingInvoiceFormValues>;
  index: number;
  error?: FieldError;
};

export function RollQualitySelect({
  control,
  index,
  error,
}: RollQualitySelectProps) {
  return (
    <Controller
      name={`rolls.${index}.quality_grade`}
      control={control}
      render={({ field }) => (
        <VPSelect
          className="w-full"
          size="lg"
          error={!!error}
          value={field.value ?? ''}
          onValueChange={field.onChange}
          options={QUALITY_GRADE_OPTIONS}
        />
      )}
    />
  );
}
