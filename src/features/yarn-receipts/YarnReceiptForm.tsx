import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useRef, useEffect, useCallback } from 'react';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import toast from 'react-hot-toast';
import type { Control } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
import { BarcodeScanner } from '@/shared/components/BarcodeScanner';
import { useStepper } from '@/shared/hooks/useStepper';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import { MoneyText } from '@/shared/value';
import { extractFormErrorMessage } from '@/shared/utils/form';
import {
  useActiveSuppliers,
  useCreateYarnReceipt,
  useUpdateYarnReceipt,
  useYarnCatalogOptions,
} from '@/application/inventory';
import {
  emptyYarnReceiptItem,
  yarnReceiptsDefaultValues,
  yarnReceiptsSchema,
} from '@/schema/yarn-receipt.schema';
import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';
import { getErrorMessage } from '@/shared/utils/error';
import { useYarnBarcodeScanner } from '@/features/yarn-receipts/hooks/useYarnBarcodeScanner';
import {
  FORM_LABELS,
  FORM_MESSAGES,
} from '@/features/yarn-receipts/yarn-receipts.constants';
import { receiptToFormValues } from '@/features/yarn-receipts/utils';

import type { YarnReceipt } from './types';
import { YarnReceiptItemRow } from './components/YarnReceiptItemRow';
import { StepGeneralInfo } from './components/StepGeneralInfo';
import { StepLogisticsInfo } from './components/StepLogisticsInfo';
import { useYarnReceiptTotal } from './hooks/useYarnReceiptTotal';

export type YarnReceiptFormProps = {
  receipt: YarnReceipt | null;
  onClose: () => void;
};

/* ── Realtime totals sub-component ── */
function LineTotals({ control }: { control: Control<YarnReceiptsFormValues> }) {
  const total = useYarnReceiptTotal(control);
  return (
    <div className="text-right font-semibold text-base py-2.5 border-t-2 border-[var(--border)] mt-4">
      Tổng cộng: <MoneyText value={total} /> đ
    </div>
  );
}

export function YarnReceiptForm({ receipt, onClose }: YarnReceiptFormProps) {
  const isEditing = receipt !== null;
  const createMutation = useCreateYarnReceipt();
  const updateMutation = useUpdateYarnReceipt();
  const { data: suppliers = [] } = useActiveSuppliers();
  const { data: yarnCatalogs = [] } = useYarnCatalogOptions();
  const { data: colorOptions = [] } = useColorOptions();

  const methods = useForm<YarnReceiptsFormValues>({
    resolver: zodResolver(yarnReceiptsSchema),
    defaultValues: isEditing
      ? receiptToFormValues(receipt)
      : yarnReceiptsDefaultValues,
  });

  const {
    handleSubmit,
    control,
    trigger,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = methods;

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (!window.confirm(FORM_MESSAGES.unsavedConfirm)) {
        return false;
      }
    }
    onClose();
    return true;
  }, [isDirty, onClose]);

  const stepper = useStepper({
    totalSteps: 3,
    stepValidation: {
      0: () => trigger(['receiptNumber', 'receiptDate', 'supplierId', 'notes']),
      1: () => trigger(['items']),
      2: () => trigger(['vehicleInfo', 'additionalFees']),
    },
    onCancel: handleCancel,
  });

  const stepRef = useRef(0);
  useEffect(() => {
    stepRef.current = stepper.currentStep;
  }, [stepper.currentStep]);

  const supplierOptions = useMemo(
    () =>
      suppliers.map((s) => ({
        value: s.id,
        label: s.name,
        code: s.code,
      })),
    [suppliers],
  );

  const yarnCatalogComboboxOptions = useMemo(
    () =>
      yarnCatalogs.map((c) => ({
        value: c.name,
        label: c.name,
        code: c.code,
      })),
    [yarnCatalogs],
  );

  /** Pre-compute once — avoids recalculation inside each YarnReceiptItemRow render */
  const colorComboboxOptions = useMemo(
    () => toColorComboboxOptions(colorOptions),
    [colorOptions],
  );

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: 'items',
  });

  const {
    isScanning,
    showScanner,
    setShowScanner,
    processBarcode,
    handleManualBarcode,
  } = useYarnBarcodeScanner({ getValues, append, update });

  async function onSubmit(values: YarnReceiptsFormValues) {
    // Guard bằng ref để tránh stale closure khi stepper vừa next()
    if (stepRef.current !== stepper.totalSteps - 1) return;

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: receipt.id,
          values,
          expectedUpdatedAt: receipt.updated_at ?? undefined,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : FORM_MESSAGES.genericError;
      toast.error(msg);
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={handleCancel}
      title={
        isEditing
          ? `Sửa phiếu: ${receipt.receipt_number}`
          : 'Tạo phiếu nhập sợi'
      }
      stepInfo={{
        current: stepper.currentStep,
        total: stepper.totalSteps,
      }}
      maxWidth={720}
    >
      {mutationError && (
        <p className="error-inline mb-4">
          {FORM_MESSAGES.errorPrefix} {getErrorMessage(mutationError)}
        </p>
      )}

      <FormProvider {...methods}>
        <form
          id="yarn-receipt-form"
          onSubmit={handleSubmit(onSubmit, (validationErrors) => {
            const errorMessage = extractFormErrorMessage(validationErrors);
            toast.error(errorMessage);
            // Scroll to first error field
            const firstKey = Object.keys(validationErrors)[0];
            if (firstKey) {
              const el =
                document.getElementById(firstKey) ??
                document.querySelector(`[name="${firstKey}"]`);
              el?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
            }
          })}
          onKeyDown={stepper.handleKeyDown}
          noValidate
        >
          <div className="form-grid">
            {/* ── BƯỚC 1: THÔNG TIN CHUNG ── */}
            <StepGeneralInfo
              hidden={stepper.currentStep !== 0}
              isEditing={isEditing}
              supplierOptions={supplierOptions}
              formLabels={FORM_LABELS}
            />

            {/* ── BƯỚC 2: CHI TIẾT HÀNG HÓA ── */}
            <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
              {errors.items?.root && (
                <span className="field-error mb-2 block">
                  {errors.items.root.message}
                </span>
              )}

              <div className="flex flex-col gap-3">
                {fields.map((field, index) => (
                  <YarnReceiptItemRow
                    key={field.id}
                    index={index}
                    canRemove={fields.length > 1}
                    onRemove={() => remove(index)}
                    yarnCatalogOptions={yarnCatalogComboboxOptions}
                    colorComboboxOptions={colorComboboxOptions}
                    yarnCatalogs={yarnCatalogs}
                  />
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => append({ ...emptyYarnReceiptItem })}
                  className="flex-1"
                >
                  {FORM_LABELS.addItemRow}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isScanning}
                  onClick={handleManualBarcode}
                  className="flex-1 border-dashed"
                >
                  {isScanning ? FORM_LABELS.scanningBarcode : 'Nhập tay'}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isScanning}
                  onClick={() => setShowScanner(true)}
                  className="flex-1 border-dashed border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-light)]"
                  leftIcon="Camera"
                >
                  Quét bằng Camera
                </Button>
              </div>

              <LineTotals control={control} />
            </div>
          </div>

          {/* ── BƯỚC 3: CHI PHÍ & VẬN CHUYỂN ── */}
          <StepLogisticsInfo hidden={stepper.currentStep !== 2} />

          <StepperFooter
            stepper={stepper}
            onCancel={handleCancel}
            isPending={isPending}
            submitLabel={isEditing ? FORM_LABELS.update : FORM_LABELS.create}
          />
        </form>
      </FormProvider>

      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={processBarcode}
      />
    </AdaptiveSheet>
  );
}
