import { useFormContext, Controller } from 'react-hook-form';

import { Icon } from '@/shared/components';
import type { LoomFormValues } from '@/schema/loom.schema';
import { NumericInput } from '@/shared/value';

type Props = {
  isTechnicalLocked: boolean;
};

export function LoomFormStep4Other({ isTechnicalLocked }: Props) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<LoomFormValues>();

  return (
    <section>
      <h3 className="text-sm font-semibold text-foreground dark:text-muted mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
        <Icon name="FileText" size={16} className="text-muted" />
        Thông tin khác
      </h3>
      <div className="form-grid">
        <Controller
          name="year_manufactured"
          control={control}
          render={({ field }) => (
            <NumericInput
              id="loom-year"
              className={`field-input${errors.year_manufactured ? ' border-danger' : ''}`}
              step="1"
              min="1950"
              max="2100"
              placeholder="VD: 2020"
              disabled={isTechnicalLocked}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
        <div className="form-field">
          <label htmlFor="loom-notes">Ghi chú</label>
          <textarea
            id="loom-notes"
            className="field-textarea"
            rows={2}
            placeholder="Ghi chú về máy dệt..."
            {...register('notes')}
          />
        </div>
      </div>
    </section>
  );
}
