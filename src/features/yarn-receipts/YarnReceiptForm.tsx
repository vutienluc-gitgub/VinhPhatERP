import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  useFieldArray,
  useForm,
  useWatch,
  Controller,
  FormProvider,
} from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { StepperFooter } from '@/shared/components/StepperFooter';
import { BarcodeScanner } from '@/shared/components/BarcodeScanner';
import { useStepper } from '@/shared/hooks/useStepper';
// eslint-disable-next-line boundaries/dependencies
import { QuickSupplierForm } from '@/features/suppliers/QuickSupplierForm';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import { formatCurrency } from '@/shared/utils/format';
import { extractFormErrorMessage } from '@/shared/utils/form';
import {
  useActiveSuppliers,
  useCreateYarnReceipt,
  useUpdateYarnReceipt,
  useYarnCatalogOptions,
} from '@/application/inventory';
import { fetchYarnSpecsFromVendorApi } from '@/api/vendor-integration.api';
import { sumBy } from '@/shared/utils/array.util';
import {
  emptyYarnReceiptItem,
  yarnReceiptsDefaultValues,
  yarnReceiptsSchema,
} from '@/schema/yarn-receipt.schema';
import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';

import type { YarnReceipt } from './types';
import { YarnReceiptItemRow } from './components/YarnReceiptItemRow';

/* ── Constants ── */

const FORM_LABELS = {
  receiptNumber: 'Số phiếu',
  receiptNumberAuto: 'Tự động',
  receiptDate: 'Ngày nhập',
  supplier: 'Nhà cung cấp',
  createSupplier: '+ Tạo NCC mới',
  addItemRow: '+ Thêm dòng sợi',
  scanBarcode: 'Quét Barcode',
  scanningBarcode: 'Đang tra cứu API...',
  notesPlaceholder: 'Ghi chú về phiếu nhập...',
  update: 'Cập nhật',
  create: 'Tạo phiếu',
} as const;

const FORM_MESSAGES = {
  genericError: 'Có lỗi xảy ra',
  scanError: 'Lỗi quét mã',
  scanSuccess: 'Bóc tách Barcode thành công!',
  errorPrefix: 'Lỗi:',
} as const;

/** Sample barcode for dev/demo — will be used as prompt default value */
const DEV_SAMPLE_BARCODE = '2510-F000016';

type YarnReceiptFormProps = {
  receipt: YarnReceipt | null;
  onClose: () => void;
};

function receiptToFormValues(receipt: YarnReceipt): YarnReceiptsFormValues {
  return {
    receiptNumber: receipt.receipt_number,
    supplierId: receipt.supplier_id,
    receiptDate: receipt.receipt_date,
    notes: receipt.notes ?? '',
    items: (receipt.yarn_receipt_items ?? []).map(
      (it: Record<string, unknown>) => ({
        yarnCatalogId: (it.yarn_catalog_id as string | undefined) ?? '',
        yarnType: it.yarn_type as string,
        colorName: (it.color_name as string | undefined) ?? '',
        quantity: Number(it.quantity),
        unitPrice: Number(it.unit_price),
        lotNumber: (it.lot_number as string | undefined) ?? '',
        grade: (it.grade as string | undefined) ?? '',
        unit: (it.unit as string | undefined) ?? 'kg',
        tensileStrength: (it.tensile_strength as string | undefined) ?? '',
        composition: (it.composition as string | undefined) ?? '',
        origin: (it.origin as string | undefined) ?? '',
        notes: (it.notes as string | undefined) ?? '',
        dtex: (it.dtex as string | undefined) ?? '',
        twist: (it.twist as string | undefined) ?? '',
        machineNo: (it.machine_no as string | undefined) ?? '',
      }),
    ),
  };
}

/* ── Realtime totals sub-component ── */

function LineTotals({
  control,
}: {
  control: ReturnType<typeof useForm<YarnReceiptsFormValues>>['control'];
}) {
  const items = useWatch({
    control,
    name: 'items',
  });
  const total = sumBy(
    items ?? [],
    (it) => (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
  );
  return (
    <div className="text-right font-semibold text-base py-2.5 border-t-2 border-[var(--border)] mt-4">
      Tổng cộng: {formatCurrency(total)} đ
    </div>
  );
}

export function YarnReceiptForm({ receipt, onClose }: YarnReceiptFormProps) {
  const isEditing = receipt !== null;
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const createMutation = useCreateYarnReceipt();
  const updateMutation = useUpdateYarnReceipt();
  const { data: suppliers = [] } = useActiveSuppliers();
  const { data: yarnCatalogs = [] } = useYarnCatalogOptions();
  const { data: colorOptions = [] } = useColorOptions();
  const [isScanning, setIsScanning] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const methods = useForm<YarnReceiptsFormValues>({
    resolver: zodResolver(yarnReceiptsSchema),
    defaultValues: isEditing
      ? receiptToFormValues(receipt)
      : yarnReceiptsDefaultValues,
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    getValues,
    formState: { errors, isSubmitting, isDirty },
  } = methods;

  const stepper = useStepper({
    totalSteps: 2,
    stepValidation: {
      0: () => trigger(['receiptNumber', 'receiptDate', 'supplierId', 'notes']),
    },
    onCancel: () => {
      if (isDirty) {
        if (
          !window.confirm(
            'Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng?',
          )
        ) {
          return false;
        }
      }
      onClose();
      return true;
    },
  });

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (
        !window.confirm(
          'Bạn có thông tin chưa lưu. Bạn có chắc chắn muốn đóng?',
        )
      ) {
        return false;
      }
    }
    onClose();
    return true;
  }, [isDirty, onClose]);

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

  const handleManualBarcode = () => {
    const code = window.prompt(
      `Nhập mã Barcode (thử: ${DEV_SAMPLE_BARCODE}):`,
      DEV_SAMPLE_BARCODE,
    );
    if (!code) return;
    processBarcode(code);
  };

  const processBarcode = async (code: string) => {
    setShowScanner(false);
    setIsScanning(true);
    try {
      const parsedData = await fetchYarnSpecsFromVendorApi(code);
      const items = getValues('items');
      const lastIndex = items.length - 1;
      const lastItem = items[lastIndex];

      const isLastItemEmpty =
        lastItem && !lastItem.yarnType && lastItem.quantity === 0;

      if (isLastItemEmpty) {
        update(lastIndex, {
          ...emptyYarnReceiptItem,
          ...parsedData,
        });
      } else {
        append({
          ...emptyYarnReceiptItem,
          ...parsedData,
        });
      }
      toast.success(FORM_MESSAGES.scanSuccess);
    } catch (err) {
      const msg = err instanceof Error ? err.message : FORM_MESSAGES.scanError;
      toast.error(msg);
    } finally {
      setIsScanning(false);
    }
  };

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
          {FORM_MESSAGES.errorPrefix}{' '}
          {mutationError instanceof Error
            ? mutationError.message
            : String(mutationError)}
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
            <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
              <div className="form-grid">
                <div className="form-grid form-grid-auto">
                  <div className="form-field">
                    <label htmlFor="receiptNumber">
                      {FORM_LABELS.receiptNumber}
                    </label>
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
                        className="field-input text-muted italic bg-[var(--surface-disabled)]"
                        type="text"
                        value={FORM_LABELS.receiptNumberAuto}
                        readOnly
                        disabled
                      />
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="receiptDate">
                      {FORM_LABELS.receiptDate}{' '}
                      <span className="field-required">*</span>
                    </label>
                    <input
                      id="receiptDate"
                      className={`field-input${errors.receiptDate ? ' is-error' : ''}`}
                      type="date"
                      {...register('receiptDate')}
                    />
                    {errors.receiptDate && (
                      <span className="field-error">
                        {errors.receiptDate.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="supplierId">
                    {FORM_LABELS.supplier}{' '}
                    <span className="field-required">*</span>
                  </label>
                  <Controller
                    name="supplierId"
                    control={control}
                    render={({ field }) => (
                      <Combobox
                        options={supplierOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="— Chọn nhà cung cấp —"
                        hasError={!!errors.supplierId}
                      />
                    )}
                  />
                  {errors.supplierId && (
                    <span className="field-error">
                      {errors.supplierId.message}
                    </span>
                  )}
                  {!showQuickSupplier && (
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowQuickSupplier(true)}
                      className="text-[0.8rem] py-1.5 px-3 self-start mt-2"
                    >
                      {FORM_LABELS.createSupplier}
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
                  <label htmlFor="notes">Ghi chú</label>
                  <textarea
                    id="notes"
                    className="field-textarea"
                    rows={3}
                    placeholder={FORM_LABELS.notesPlaceholder}
                    {...register('notes')}
                  />
                </div>
              </div>
            </div>

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
