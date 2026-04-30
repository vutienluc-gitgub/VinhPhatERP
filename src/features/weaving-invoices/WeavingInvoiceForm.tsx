import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm, useWatch, Controller } from 'react-hook-form';
import type { UseFormWatch } from 'react-hook-form';

import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { CancelButton, Button } from '@/shared/components';
import { useStepper } from '@/shared/hooks/useStepper';
import { formatCurrency } from '@/shared/utils/format';
import { useAutoSave, loadDraft, clearDraft } from '@/shared/hooks/useAutoSave';
import DraftBanner from '@/shared/components/DraftBanner';
import SaveStatus from '@/shared/components/SaveStatus';
import {
  useCreateWeavingInvoice,
  useUpdateWeavingInvoice,
  useNextWeavingInvoiceNumber,
  useWeavingSuppliers,
  useWorkOrders,
} from '@/application/production';
import {
  weavingInvoiceFormSchema,
  weavingInvoiceDefaults,
} from '@/schema/weaving-invoice.schema';
import type { WeavingInvoiceFormValues } from '@/schema/weaving-invoice.schema';
import { generateWeavingRollPrefix } from '@/domain/production';

import { RollProgressBar } from './components/RollProgressBar';
import { PasteExcelParser } from './components/PasteExcelParser';
import { BulkRollStation } from './components/BulkRollStation';
import { useWeavingInvoiceCalculator } from './hooks/useWeavingInvoiceCalculator';
import type { WeavingInvoice } from './types';

const DRAFT_KEY = 'weaving-invoice-draft';

/**
 * Isolated sub-component that subscribes to ALL form values for auto-save.
 * By extracting this, the re-renders caused by watch() are confined here
 * and do NOT propagate to the main WeavingInvoiceForm tree.
 */
function AutoSaveSubscriber({
  watch,
}: {
  watch: UseFormWatch<WeavingInvoiceFormValues>;
}) {
  const formValues = watch();
  const { status: saveStatus, lastSavedAt } = useAutoSave({
    key: DRAFT_KEY,
    data: formValues,
    delay: 800,
  });
  return <SaveStatus status={saveStatus} lastSavedAt={lastSavedAt} />;
}

type Props = {
  invoice?: WeavingInvoice | null;
  onClose: () => void;
};

export function WeavingInvoiceForm({ invoice, onClose }: Props) {
  const isEdit = !!invoice;
  const stepper = useStepper({ totalSteps: 2 });

  const { data: nextNumber = '' } = useNextWeavingInvoiceNumber();
  const { data: suppliers = [] } = useWeavingSuppliers();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();
  const createMutation = useCreateWeavingInvoice();
  const updateMutation = useUpdateWeavingInvoice();

  // Draft restoration state
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [savedDraft, setSavedDraft] = useState<WeavingInvoiceFormValues | null>(
    null,
  );

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<WeavingInvoiceFormValues>({
    resolver: zodResolver(weavingInvoiceFormSchema),
    defaultValues: isEdit
      ? {
          invoice_number: invoice.invoice_number,
          supplier_id: invoice.supplier_id,
          invoice_date: invoice.invoice_date,
          fabric_type: invoice.fabric_type,
          unit_price_per_kg: invoice.unit_price_per_kg,
          notes: invoice.notes ?? '',
          rolls:
            invoice.weaving_invoice_rolls?.map((r) => ({
              roll_number: r.roll_number,
              weight_kg: r.weight_kg,
              length_m: r.length_m ?? undefined,
              quality_grade: r.quality_grade ?? undefined,
              warehouse_location: r.warehouse_location ?? '',
              lot_number: r.lot_number ?? '',
              notes: r.notes ?? '',
            })) ?? weavingInvoiceDefaults.rolls,
        }
      : weavingInvoiceDefaults,
    mode: 'onTouched',
  });

  // ── TARGETED FIELD SUBSCRIPTIONS (avoid full-form re-render) ──
  const selectedSupplierId = useWatch({ control, name: 'supplier_id' });
  const watchedRolls = useWatch({ control, name: 'rolls' });
  const watchedUnitPrice = useWatch({ control, name: 'unit_price_per_kg' });
  const watchedInvoiceNumber = useWatch({ control, name: 'invoice_number' });

  const { data: woData } = useWorkOrders(
    selectedSupplierId
      ? {
          supplier_id: selectedSupplierId,
          status: 'in_progress',
        }
      : undefined,
  );

  const workOrderOptions = (woData?.data || [])
    .filter((wo) => wo.supplier_id === selectedSupplierId)
    .map((wo) => ({
      label: `${wo.work_order_number} ${wo.bom_template?.target_fabric ? `(${wo.bom_template.target_fabric.name})` : ''}`,
      value: wo.id,
      raw: wo,
    }));

  // ── BUSINESS LOGIC CALCULATIONS ──
  const { scannedCount, totalKg, totalAmount } = useWeavingInvoiceCalculator(
    watchedRolls || [],
    watchedUnitPrice || 0,
  );

  // ── DRAFT RESTORATION ──
  useEffect(() => {
    if (isEdit) return;
    const draft = loadDraft<WeavingInvoiceFormValues>(DRAFT_KEY);
    if (draft && draft.invoice_number) {
      setSavedDraft(draft);
      setShowDraftBanner(true);
    }
  }, [isEdit]);

  function handleRestoreDraft() {
    if (!savedDraft) return;
    reset(savedDraft);
    setShowDraftBanner(false);
    setSavedDraft(null);
  }

  function handleDiscardDraft() {
    clearDraft(DRAFT_KEY);
    setShowDraftBanner(false);
    setSavedDraft(null);
  }

  /**
   * Auto-fill invoice number for new invoices.
   * Uses a ref to track whether auto-fill has happened, preventing
   * the fragile dependency on formValues.invoice_number which could
   * cause an infinite re-render loop if nextNumber ever returned "".
   */
  const hasAutoFilledInvoiceRef = useRef(false);
  useEffect(() => {
    if (!isEdit && nextNumber && !hasAutoFilledInvoiceRef.current) {
      hasAutoFilledInvoiceRef.current = true;
      setValue('invoice_number', nextNumber);
    }
  }, [nextNumber, isEdit, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rolls',
  });

  // ── OPS UI: Active roll index for scanning station ──
  const [activeRollIndex, setActiveRollIndex] = useState(0);

  // ── Import rolls from Excel paste or auto-generate ──
  const handleImportRolls = useCallback(
    (
      imported: { roll_number: string; weight_kg: number; length_m?: number }[],
    ) => {
      // Remove existing empty placeholder rows first
      const emptyIndices = fields
        .map((f, i) => {
          const rn = (f as Record<string, unknown>).roll_number;
          const wk = (f as Record<string, unknown>).weight_kg;
          return !rn && (!wk || wk === 0) ? i : -1;
        })
        .filter((i) => i >= 0)
        .reverse(); // reverse to remove from end first
      for (const idx of emptyIndices) {
        remove(idx);
      }

      for (const r of imported) {
        append({
          roll_number: r.roll_number,
          weight_kg:
            r.weight_kg > 0 ? r.weight_kg : (undefined as unknown as number),
          length_m: r.length_m,
          quality_grade: undefined,
          warehouse_location: '',
          lot_number: '',
          notes: '',
        });
      }
      // Focus on first new roll
      setActiveRollIndex(Math.max(0, fields.length - emptyIndices.length));
    },
    [fields, append, remove],
  );

  async function handleNext() {
    const valid = await trigger([
      'invoice_number',
      'supplier_id',
      'invoice_date',
      'fabric_type',
      'unit_price_per_kg',
    ]);
    if (valid) stepper.next();
  }

  async function onSubmit(values: WeavingInvoiceFormValues) {
    if (!stepper.isLast) return;
    try {
      if (isEdit && invoice) {
        await updateMutation.mutateAsync({
          id: invoice.id,
          values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      clearDraft(DRAFT_KEY);
      onClose();
    } catch (e) {
      // Lỗi đã được bắt bởi react-query error state và sẽ hiển thị ở mutationError
      console.error('Submit failed', e);
    }
  }

  // Auto Prefix derived from invoice number to ensure global uniqueness and logical grouping
  const autoPrefix = generateWeavingRollPrefix(watchedInvoiceNumber);

  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error ?? updateMutation.error;

  const supplierOptions = suppliers.map((s) => ({
    label: s.name,
    value: s.id,
    code: s.code,
  }));
  const fabricComboOptions = fabricOptions.map((f) => ({
    label: f.name,
    value: f.name,
    code: f.code,
  }));

  return (
    <AdaptiveSheet
      open
      onClose={onClose}
      title={isEdit ? 'Sửa phiếu gia công' : 'Tạo phiếu gia công'}
      stepInfo={{
        current: stepper.currentStep,
        total: stepper.totalSteps,
      }}
      maxWidth={900}
    >
      {/* Auto-save subscriber — isolated re-renders */}
      <AutoSaveSubscriber watch={watch} />

      {mutationError && (
        <p className="error-inline mb-4">
          {mutationError instanceof Error
            ? mutationError.message
            : String(mutationError)}
        </p>
      )}

      {showDraftBanner && savedDraft && (
        <DraftBanner
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      <form id="weaving-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* ── BƯỚC 1: THÔNG TIN PHIẾU ── */}
        <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
          <fieldset className="bulk-section">
            <legend>Thông tin phiếu gia công</legend>
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
              {/* Số phiếu */}
              <div className="form-field">
                <label>
                  Số phiếu <span className="field-required">*</span>
                </label>
                <input
                  className={`field-input${errors.invoice_number ? ' is-error' : ''}`}
                  {...register('invoice_number')}
                />
                {errors.invoice_number && (
                  <span className="field-error">
                    {errors.invoice_number.message}
                  </span>
                )}
              </div>

              {/* Nhà dệt */}
              <div className="form-field">
                <label>
                  Nhà dệt <span className="field-required">*</span>
                </label>
                <Controller
                  control={control}
                  name="supplier_id"
                  render={({ field }) => (
                    <Combobox
                      options={supplierOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Chọn nhà dệt..."
                      hasError={!!errors.supplier_id}
                    />
                  )}
                />
                {errors.supplier_id && (
                  <span className="field-error">
                    {errors.supplier_id.message}
                  </span>
                )}
              </div>

              {/* Ngày */}
              <div className="form-field">
                <label>
                  Ngày <span className="field-required">*</span>
                </label>
                <input
                  type="date"
                  className={`field-input${errors.invoice_date ? ' is-error' : ''}`}
                  {...register('invoice_date')}
                />
                {errors.invoice_date && (
                  <span className="field-error">
                    {errors.invoice_date.message}
                  </span>
                )}
              </div>

              {/* Lệnh dệt (Tùy chọn) */}
              <div className="form-field">
                <label>Lệnh dệt</label>
                <Controller
                  control={control}
                  name="work_order_id"
                  render={({ field }) => (
                    <Combobox
                      options={workOrderOptions}
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        // Auto-fill fabric & price from Work Order
                        const wo = workOrderOptions.find(
                          (o) => o.value === val,
                        )?.raw;
                        if (wo) {
                          if (wo.bom_template?.target_fabric) {
                            setValue(
                              'fabric_type',
                              wo.bom_template.target_fabric.name,
                            );
                          }
                          if (wo.weaving_unit_price) {
                            setValue(
                              'unit_price_per_kg',
                              wo.weaving_unit_price,
                            );
                          }
                        }
                      }}
                      onBlur={field.onBlur}
                      placeholder={
                        selectedSupplierId
                          ? 'Chọn lệnh dệt...'
                          : 'Chọn nhà dệt trước...'
                      }
                      hasError={!!errors.work_order_id}
                      disabled={
                        !selectedSupplierId || workOrderOptions.length === 0
                      }
                    />
                  )}
                />
                {errors.work_order_id && (
                  <span className="field-error">
                    {errors.work_order_id.message}
                  </span>
                )}
              </div>

              {/* Loại vải */}
              <div className="form-field">
                <label>
                  Loại vải <span className="field-required">*</span>
                </label>
                <Controller
                  control={control}
                  name="fabric_type"
                  render={({ field }) => (
                    <Combobox
                      options={fabricComboOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Chọn hoặc nhập loại vải..."
                      hasError={!!errors.fabric_type}
                      allowInput
                    />
                  )}
                />
                {errors.fabric_type && (
                  <span className="field-error">
                    {errors.fabric_type.message}
                  </span>
                )}
              </div>

              {/* Đơn giá */}
              <div className="form-field">
                <label>
                  Đơn giá gia công (đ/kg){' '}
                  <span className="field-required">*</span>
                </label>
                <Controller
                  control={control}
                  name="unit_price_per_kg"
                  render={({ field }) => (
                    <CurrencyInput
                      className={`field-input${errors.unit_price_per_kg ? ' is-error' : ''}`}
                      value={field.value}
                      onChange={(v) => field.onChange(v ?? 0)}
                      onBlur={field.onBlur}
                      placeholder="0"
                    />
                  )}
                />
                {errors.unit_price_per_kg && (
                  <span className="field-error">
                    {errors.unit_price_per_kg.message}
                  </span>
                )}
              </div>

              {/* Ghi chú */}
              <div className="form-field col-span-full">
                <label>Ghi chú</label>
                <textarea
                  className="field-input"
                  rows={2}
                  {...register('notes')}
                />
              </div>
            </div>
          </fieldset>

          <div className="mt-6 pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
                <CancelButton
                  onClick={onClose}
                  label="Hủy"
                  className="w-full sm:w-auto justify-center"
                />
              </div>
              <div className="text-center sm:text-left w-full sm:w-auto">
                <AutoSaveSubscriber watch={watch} />
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <Button
                variant="primary"
                type="button"
                className="w-full sm:w-auto justify-center"
                onClick={handleNext}
              >
                Tiếp theo → Nhập cuộn vải
              </Button>
            </div>
          </div>
        </div>

        {/* ── BƯỚC 2: NHẬP CUỘN VẢI (OPS UI) ── */}
        <div
          className={
            stepper.currentStep === 1 ? 'flex flex-col gap-4' : 'hidden'
          }
        >
          {/* Gamification Progress Bar */}
          <RollProgressBar
            scanned={scannedCount}
            total={fields.length}
            totalKg={totalKg}
            totalAmount={totalAmount}
            formatCurrency={formatCurrency}
          />

          {errors.rolls?.root && (
            <p className="error-inline">{errors.rolls.root.message}</p>
          )}

          {/* Import tools: Paste Excel / Auto-gen */}
          <PasteExcelParser
            onImport={handleImportRolls}
            autoPrefix={autoPrefix}
          />

          {/* Ops UI: Scanning Station + Roll Grid */}
          <BulkRollStation
            fields={fields}
            register={register}
            control={control}
            remove={remove}
            errors={errors}
            activeIndex={activeRollIndex}
            onActiveIndexChange={setActiveRollIndex}
          />

          {/* Add single & Validation Summary */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                const nextNumMatch = String(fields.length + 1).padStart(3, '0');
                append({
                  roll_number: `${autoPrefix}${nextNumMatch}`,
                  weight_kg: undefined as unknown as number,
                  length_m: undefined,
                  quality_grade: undefined,
                  warehouse_location: '',
                  lot_number: '',
                  notes: '',
                });
                setActiveRollIndex(fields.length);
              }}
            >
              + Thêm 1 cuộn
            </Button>

            {errors.rolls &&
              Array.isArray(errors.rolls) &&
              errors.rolls.some(Boolean) && (
                <div className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg animate-pulse">
                  ⚠️ Không thể lưu: Tồn tại{' '}
                  {errors.rolls.filter(Boolean).length} cuộn bị lỗi dữ liệu
                  (chưa điền KG hoặc sai mã). Hãy điền đủ hoặc Xóa cuộn dư.
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={stepper.prev}
              className="w-full sm:w-auto justify-center"
            >
              Quay lại
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="weaving-form"
              className="w-full sm:w-auto justify-center"
              disabled={isPending}
            >
              {isPending
                ? 'Đang lưu...'
                : isEdit
                  ? 'Lưu thay đổi'
                  : 'Lưu phiếu nháp'}
            </Button>
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
