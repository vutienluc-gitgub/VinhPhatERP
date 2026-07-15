import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button } from '@/shared/components';
import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';
import { LOGISTICS_LABELS as L } from '@/features/yarn-receipts/yarn-receipts.constants';

type StepLogisticsInfoProps = {
  hidden: boolean;
};

export function StepLogisticsInfo({ hidden }: StepLogisticsInfoProps) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<YarnReceiptsFormValues>();

  const {
    fields: feeFields,
    append: appendFee,
    remove: removeFee,
  } = useFieldArray({
    control,
    name: 'additionalFees',
  });

  return (
    <div className={hidden ? 'hidden' : 'block'}>
      <h3 className="text-lg font-semibold mb-4 text-foreground">{L.title}</h3>
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="vehicleInfo">{L.vehicleInfo}</label>
            <input
              id="vehicleInfo"
              className={`field-input${errors.vehicleInfo ? ' border-danger' : ''}`}
              type="text"
              placeholder={L.vehicleInfoPlaceholder}
              {...register('vehicleInfo')}
            />
            {errors.vehicleInfo && (
              <span className="field-error">{errors.vehicleInfo.message}</span>
            )}
          </div>

          <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[var(--border)]">
            <label className="text-sm font-medium">{L.additionalFees}</label>
            {feeFields.map((field, index) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  <input
                    className={`field-input${errors.additionalFees?.[index]?.name ? ' border-danger' : ''}`}
                    type="text"
                    placeholder={L.feeNamePlaceholder}
                    {...register(`additionalFees.${index}.name`)}
                  />
                  {errors.additionalFees?.[index]?.name && (
                    <span className="field-error text-xs mt-1 block">
                      {errors.additionalFees[index]?.name?.message}
                    </span>
                  )}
                </div>
                <div className="w-[140px]">
                  <input
                    className={`field-input text-right${errors.additionalFees?.[index]?.amount ? ' border-danger' : ''}`}
                    type="number"
                    min="0"
                    placeholder="0"
                    {...register(`additionalFees.${index}.amount`, {
                      valueAsNumber: true,
                    })}
                  />
                </div>
                <Button
                  variant="danger"
                  type="button"
                  className="p-2 h-[38px] w-[38px]"
                  onClick={() => removeFee(index)}
                >
                  X
                </Button>
              </div>
            ))}
            <Button
              variant="secondary"
              type="button"
              onClick={() => appendFee({ name: '', amount: 0 })}
              className="text-[0.8rem] py-1.5 px-3 self-start mt-1"
            >
              {L.addFeeBtn}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
