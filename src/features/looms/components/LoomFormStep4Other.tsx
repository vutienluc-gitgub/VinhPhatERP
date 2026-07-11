import { useFormContext } from 'react-hook-form';

import { Icon } from '@/shared/components';
import type { LoomFormValues } from '@/schema/loom.schema';

type Props = {
  isTechnicalLocked: boolean;
};

export function LoomFormStep4Other({ isTechnicalLocked }: Props) {
  const {
    register,
    formState: { errors },
  } = useFormContext<LoomFormValues>();

  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
        <Icon name="FileText" size={16} className="text-gray-500" />
        Thông tin khác
      </h3>
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="loom-year">Năm sản xuất</label>
          <input
            id="loom-year"
            className={`field-input${errors.year_manufactured ? ' border-danger' : ''}`}
            type="number"
            step="1"
            min="1950"
            max="2100"
            placeholder="VD: 2020"
            disabled={isTechnicalLocked}
            {...register('year_manufactured', {
              setValueAs: (v) =>
                v === '' || Number.isNaN(Number(v)) ? null : Number(v),
            })}
          />
          {errors.year_manufactured && (
            <span className="field-error">
              {errors.year_manufactured.message}
            </span>
          )}
        </div>
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
