import { useState } from 'react';
import { useFormContext, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
// eslint-disable-next-line boundaries/dependencies
import { QuickSupplierForm } from '@/features/procurement/suppliers/QuickSupplierForm';
import { SCAN_WORKSPACE_LABELS } from '@/features/yarn-receipts/yarn-slip-scan.constants';
import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';

type StepGeneralInfoProps = {
  hidden: boolean;
  isEditing: boolean;
  supplierOptions: { value: string; label: string; code?: string }[];
  formLabels: Record<string, string>;
  onScanYarnSlip?: () => void;
};

export function StepGeneralInfo({
  hidden,
  isEditing,
  supplierOptions,
  formLabels,
  onScanYarnSlip,
}: StepGeneralInfoProps) {
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<YarnReceiptsFormValues>();

  return (
    <div className={hidden ? 'hidden' : 'block'}>
      {!isEditing && onScanYarnSlip && (
        <div className="mb-4 p-3 rounded-lg border border-dashed border-[var(--primary)] bg-surface-secondary/40 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-foreground block">
              {SCAN_WORKSPACE_LABELS.BANNER_PROMPT_TITLE}
            </span>
            <span className="text-xs text-muted block">
              {SCAN_WORKSPACE_LABELS.BANNER_PROMPT_DESC}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon="Camera"
            onClick={onScanYarnSlip}
            className="shrink-0 border-[var(--primary)] text-[var(--primary)]"
          >
            {SCAN_WORKSPACE_LABELS.BTN_SCAN_AI}
          </Button>
        </div>
      )}
      <div className="form-grid">
        <div className="form-grid form-grid-auto">
          <div className="form-field">
            <label htmlFor="receiptNumber">{formLabels.receiptNumber}</label>
            {isEditing ? (
              <input
                id="receiptNumber"
                className="field-input bg-[var(--surface)]"
                type="text"
                readOnly
                {...register('receiptNumber')}
              />
            ) : (
              <input
                id="receiptNumber"
                className="field-input text-muted-foreground italic bg-[var(--surface-disabled)]"
                type="text"
                value={formLabels.receiptNumberAuto}
                readOnly
                disabled
              />
            )}
          </div>

          <div className="form-field">
            <label htmlFor="receiptDate">
              {formLabels.receiptDate} <span className="field-required">*</span>
            </label>
            <input
              id="receiptDate"
              className={`field-input${errors.receiptDate ? ' border-danger' : ''}`}
              type="date"
              {...register('receiptDate')}
            />
            {errors.receiptDate && (
              <span className="field-error">{errors.receiptDate.message}</span>
            )}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="supplierId">
            {formLabels.supplier} <span className="field-required">*</span>
          </label>
          <Controller
            name="supplierId"
            control={control}
            render={({ field }) => (
              <Combobox
                options={supplierOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder={formLabels.supplierPlaceholder}
                hasError={!!errors.supplierId}
              />
            )}
          />
          {errors.supplierId && (
            <span className="field-error">{errors.supplierId.message}</span>
          )}
          {!showQuickSupplier && (
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowQuickSupplier(true)}
              className="text-[0.8rem] py-1.5 px-3 self-start mt-2"
            >
              {formLabels.createSupplier}
            </Button>
          )}
          {showQuickSupplier && (
            <div className="mt-2">
              <QuickSupplierForm
                defaultCategory="YARN"
                onCreated={(created) => {
                  setValue('supplierId', created.id);
                  setShowQuickSupplier(false);
                }}
                onCancel={() => setShowQuickSupplier(false)}
              />
            </div>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="notes">{formLabels.notes}</label>
          <textarea
            id="notes"
            className="field-textarea"
            rows={2}
            placeholder={formLabels.notesPlaceholder}
            {...register('notes')}
          />
        </div>
      </div>
    </div>
  );
}
