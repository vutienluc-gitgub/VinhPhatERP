import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import {
  useForm,
  Controller,
  UseFormWatch,
  UseFormSetValue,
} from 'react-hook-form';

import { Button, Switch } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import {
  useCreateFabricVariant,
  useUpdateFabricVariant,
} from '@/application/settings';
import { useFormAutoSave, useStepper } from '@/shared/hooks';
import {
  fabricVariantSchema,
  fabricVariantDefaultValues,
  FABRIC_VARIANT_STATUS_LABELS,
  FABRIC_VARIANT_STATUSES,
  FABRIC_UOM_OPTIONS,
} from '@/schema/fabric-variant.schema';
import type { FabricVariantFormValues } from '@/schema/fabric-variant.schema';
import type { FabricVariant } from '@/domain/settings/fabric-catalog.types';
import { getErrorMessage } from '@/shared/utils/error';

const STATUS_OPTIONS = FABRIC_VARIANT_STATUSES.map((s) => ({
  value: s,
  label: FABRIC_VARIANT_STATUS_LABELS[s],
}));

const LABELS = {
  COLOR_SECTION: 'Màu sắc',
  COLOR_NAME: 'Tên màu',
  COLOR_HEX: 'Mã hex',
  SPEC_SECTION: 'Quy cách thực tế (sau nhuộm)',
  ACTUAL_WIDTH: 'Khổ thực tế (cm)',
  ACTUAL_GSM: 'K/L thực tế (gsm)',
  SHRINK_WARP: 'Rút dọc (%)',
  SHRINK_WEFT: 'Rút ngang (%)',
  UOM_SECTION: 'Đơn vị tính & Quy đổi',
  BASE_UOM: 'Đơn vị cơ sở',
  CONVERSION_RATE: 'Hệ số quy đổi (mét/kg)',
  SOURCING_SECTION: 'Truy xuất nguồn',
  LOT_NUMBER: 'Số lô nhuộm',
  SKU: 'SKU',
  BARCODE: 'Barcode',
  MOQ: 'MOQ (kg tối thiểu)',
  PRICE_SECTION: 'Giá & Trạng thái',
  PURCHASE_PRICE: 'Giá nhập (VNĐ/kg)',
  SELLING_PRICE: 'Giá bán (VNĐ/kg)',
  STATUS: 'Trạng thái',
  NOTES: 'Ghi chú',
  CANCEL: 'Hủy',
  UPDATE: 'Cập nhật',
  ADD: 'Thêm biến thể',
  EDIT_TITLE: 'Sửa biến thể',
  ADD_TITLE: 'Thêm biến thể',
  SAVING_DRAFT: 'Đang lưu nháp...',
  SAVED_DRAFT: 'Lưu nháp lần cuối',
  AUTO_CALC: 'Tự tính: 1000 / (GSM x Khổ_m)',
  ERROR_PREFIX: 'Lỗi:',
  PUBLIC_SECTION: 'Hiển thị công khai',
  PUBLIC_DESC:
    'Cho phép biến thể này hiển thị trên trang công khai cho khách hàng xem.',
  PUBLIC_ON: 'Công khai',
  PUBLIC_OFF: 'Ẩn',
};

const MESSAGES = {
  PLACEHOLDER_COLOR: 'VD: Đen, Trắng, Navy...',
  PLACEHOLDER_HEX: '#000000',
  PLACEHOLDER_WIDTH: 'VD: 150',
  PLACEHOLDER_GSM: 'VD: 175',
  PLACEHOLDER_SHRINK_WARP: 'VD: 3.5',
  PLACEHOLDER_SHRINK_WEFT: 'VD: 2.0',
  PLACEHOLDER_LOT: 'VD: L2026-W20',
  PLACEHOLDER_SKU: 'VD: 11070011.BLACK.L01',
  PLACEHOLDER_BARCODE: 'Mã vạch quét kho',
  PLACEHOLDER_MOQ: 'VD: 300',
  PLACEHOLDER_PURCHASE: 'VD: 85000',
  PLACEHOLDER_SELLING: 'VD: 120000',
  PLACEHOLDER_NOTES: 'Ghi chú thêm...',
};

type FabricVariantFormProps = {
  variant: FabricVariant | null;
  fabricCatalogId: string;
  parentCode: string;
  onClose: () => void;
};

function variantToFormValues(v: FabricVariant): FabricVariantFormValues {
  return {
    color_name: v.color_name,
    color_hex: v.color_hex,
    actual_width_cm: v.actual_width_cm,
    actual_gsm: v.actual_gsm,
    shrinkage_rate_warp: v.shrinkage_rate_warp,
    shrinkage_rate_weft: v.shrinkage_rate_weft,
    base_uom: v.base_uom,
    conversion_rate: v.conversion_rate,
    lot_number: v.lot_number,
    supplier_id: v.supplier_id,
    sku: v.sku,
    barcode: v.barcode,
    moq: v.moq,
    purchase_price: v.purchase_price,
    selling_price: v.selling_price,
    status: v.status,
    is_public: v.is_public ?? false,
    image_url: v.image_url,
    notes: v.notes,
  };
}

// Extract Business Logic into Custom Hook
function useConversionRateCalculator(
  watch: UseFormWatch<FabricVariantFormValues>,
  setValue: UseFormSetValue<FabricVariantFormValues>,
) {
  const actualGsm = watch('actual_gsm');
  const actualWidth = watch('actual_width_cm');

  useEffect(() => {
    if (actualGsm && actualWidth && actualGsm > 0 && actualWidth > 0) {
      const widthM = actualWidth / 100;
      const rate = Math.round((1000 / (actualGsm * widthM)) * 1000) / 1000;
      setValue('conversion_rate', rate);
    }
  }, [actualGsm, actualWidth, setValue]);
}

export function FabricVariantForm({
  variant,
  fabricCatalogId,
  parentCode,
  onClose,
}: FabricVariantFormProps) {
  const isEditing = variant !== null;
  const createMutation = useCreateFabricVariant();
  const updateMutation = useUpdateFabricVariant();

  const formMethods = useForm<FabricVariantFormValues>({
    resolver: zodResolver(fabricVariantSchema),
    defaultValues: isEditing
      ? variantToFormValues(variant)
      : fabricVariantDefaultValues,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = formMethods;

  const stepper = useStepper({
    totalSteps: 2,
    stepValidation: {
      0: async () => {
        try {
          // Ensure form is in a stable state before validation
          await new Promise((resolve) => requestAnimationFrame(resolve));

          // Define required fields for step 1 with validation priority
          const requiredFields = ['color_name'] as const;
          const optionalFields = [
            'color_hex',
            'actual_width_cm',
            'actual_gsm',
            'shrinkage_rate_warp',
            'shrinkage_rate_weft',
            'base_uom',
            'conversion_rate',
          ] as const;

          // First validate required fields
          const requiredValid = await formMethods.trigger(requiredFields);
          if (!requiredValid) {
            // Focus on first invalid required field
            const errors = formMethods.formState.errors;
            for (const field of requiredFields) {
              if (errors[field]) {
                const element = document.getElementById(
                  `fv-${field.replace('_', '-')}`,
                );
                if (element) {
                  element.focus();
                  break;
                }
              }
            }
            return false;
          }

          // Then validate optional fields
          const optionalValid = await formMethods.trigger(optionalFields);
          if (!optionalValid) {
            // Focus on first invalid optional field
            const errors = formMethods.formState.errors;
            for (const field of optionalFields) {
              if (errors[field]) {
                const element = document.getElementById(
                  `fv-${field.replace('_', '-')}`,
                );
                if (element) {
                  element.focus();
                  break;
                }
              }
            }
            return false;
          }

          // Validate business rules
          const values = formMethods.getValues();

          // Color hex validation if provided
          if (values.color_hex && values.color_hex.trim() !== '') {
            const hexPattern = /^#[0-9a-fA-F]{6}$/;
            if (!hexPattern.test(values.color_hex)) {
              formMethods.setError('color_hex', {
                type: 'pattern',
                message: 'Mã hex không hợp lệ (VD: #000000)',
              });
              document.getElementById('fv-color-hex')?.focus();
              return false;
            }
          }

          // GSM and width validation for conversion rate calculation
          if (values.actual_gsm && values.actual_width_cm) {
            if (values.actual_gsm <= 0) {
              formMethods.setError('actual_gsm', {
                type: 'min',
                message: 'GSM phải lớn hơn 0',
              });
              document.getElementById('fv-actual-gsm')?.focus();
              return false;
            }
            if (values.actual_width_cm <= 0) {
              formMethods.setError('actual_width_cm', {
                type: 'min',
                message: 'Khổ phải lớn hơn 0',
              });
              document.getElementById('fv-actual-width')?.focus();
              return false;
            }
          }

          // Shrinkage rates validation
          if (
            values.shrinkage_rate_warp !== null &&
            values.shrinkage_rate_warp !== undefined
          ) {
            if (
              values.shrinkage_rate_warp < 0 ||
              values.shrinkage_rate_warp > 100
            ) {
              formMethods.setError('shrinkage_rate_warp', {
                type: 'range',
                message: 'Rút dọc phải từ 0-100%',
              });
              document.getElementById('fv-shrink-warp')?.focus();
              return false;
            }
          }

          if (
            values.shrinkage_rate_weft !== null &&
            values.shrinkage_rate_weft !== undefined
          ) {
            if (
              values.shrinkage_rate_weft < 0 ||
              values.shrinkage_rate_weft > 100
            ) {
              formMethods.setError('shrinkage_rate_weft', {
                type: 'range',
                message: 'Rút ngang phải từ 0-100%',
              });
              document.getElementById('fv-shrink-weft')?.focus();
              return false;
            }
          }

          // Wait for validation state to stabilize
          await new Promise((resolve) => setTimeout(resolve, 50));

          return true;
        } catch (error) {
          console.error('[FabricVariantForm] Step validation error:', error);
          return false;
        }
      },
    },
  });

  // Create a ref to provide stepper state to autosave hook
  const stepperRef = useRef({
    isTransitioning: stepper.isTransitioning,
    isValidating: stepper.isValidating,
  });

  // Update ref values when stepper state changes
  stepperRef.current.isTransitioning = stepper.isTransitioning;
  stepperRef.current.isValidating = stepper.isValidating;

  const { status, lastSavedTimeText, clearDraft } = useFormAutoSave({
    formId: isEditing
      ? `fabric-variant-edit-${variant.id}`
      : `fabric-variant-create-${parentCode}`,
    methods: formMethods,
    // Auto-save chỉ cần thiết khi tạo mới.
    // Edit mode: data đã có trong DB, không cần draft recovery.
    enabled: !isEditing,
    // Pass stepper reference to prevent autosave during transitions
    stepperRef,
  });

  useEffect(() => {
    reset(
      isEditing ? variantToFormValues(variant) : fabricVariantDefaultValues,
    );
  }, [variant, isEditing, reset]);

  // Use separated business logic hook
  useConversionRateCalculator(watch, setValue);

  async function onSubmit(values: FabricVariantFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: variant.id,
          parentCode,
          values,
        });
      } else {
        await createMutation.mutateAsync({
          fabricCatalogId,
          parentCode,
          values,
        });
        clearDraft();
      }
      onClose();
    } catch (err) {
      console.error('[FabricVariantForm] submit error:', err);
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={
        isEditing
          ? `${LABELS.EDIT_TITLE}: ${variant.variant_code}`
          : `${LABELS.ADD_TITLE} — ${parentCode}`
      }
      footer={
        <>
          {stepper.isFirst ? (
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isPending}
            >
              {LABELS.CANCEL}
            </Button>
          ) : (
            <Button
              variant="secondary"
              type="button"
              onClick={stepper.prev}
              disabled={isPending}
            >
              Quay lại
            </Button>
          )}

          {stepper.isLast ? (
            <Button
              variant="primary"
              type="submit"
              form="fabric-variant-form"
              isLoading={isPending}
            >
              {isEditing ? LABELS.UPDATE : LABELS.ADD}
            </Button>
          ) : (
            <Button
              variant="primary"
              type="button"
              onClick={() => void stepper.next()}
              disabled={
                isPending || stepper.isTransitioning || stepper.isValidating
              }
              isLoading={stepper.isValidating}
            >
              {stepper.isValidating ? 'Đang kiểm tra...' : 'Tiếp tục'}
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-muted">
          Bước {stepper.currentStep + 1} / {stepper.totalSteps}
        </div>
        <div className="flex gap-2">
          {status === 'saving' && (
            <span className="text-xs text-muted italic">
              {LABELS.SAVING_DRAFT}
            </span>
          )}
          {status === 'saved' && (
            <span className="text-xs text-emerald-600 italic">
              {LABELS.SAVED_DRAFT}: {lastSavedTimeText}
            </span>
          )}
        </div>
      </div>

      {mutationError && (
        <p className="error-inline mb-4">
          {LABELS.ERROR_PREFIX} {getErrorMessage(mutationError)}
        </p>
      )}

      <form
        id="fabric-variant-form"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={stepper.handleKeyDown}
        noValidate
      >
        <div className="form-grid">
          {stepper.currentStep === 0 && (
            <>
              <fieldset className="form-section">
                <legend className="form-section-title">
                  {LABELS.COLOR_SECTION}
                </legend>
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="fv-color-name">
                      {LABELS.COLOR_NAME}{' '}
                      <span className="field-required">*</span>
                    </label>
                    <input
                      id="fv-color-name"
                      className={`field-input${errors.color_name ? ' is-error' : ''}`}
                      type="text"
                      placeholder={MESSAGES.PLACEHOLDER_COLOR}
                      {...register('color_name')}
                    />
                    {errors.color_name && (
                      <span className="field-error">
                        {errors.color_name.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-color-hex">{LABELS.COLOR_HEX}</label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="fv-color-hex"
                        className={`field-input flex-1${errors.color_hex ? ' is-error' : ''}`}
                        type="text"
                        placeholder={MESSAGES.PLACEHOLDER_HEX}
                        {...register('color_hex')}
                      />
                      {watch('color_hex') &&
                        /^#[0-9a-fA-F]{6}$/.test(watch('color_hex') ?? '') && (
                          <div
                            className="w-8 h-8 rounded border border-border shrink-0"
                            style={{
                              backgroundColor: watch('color_hex') ?? '',
                            }}
                          />
                        )}
                    </div>
                    {errors.color_hex && (
                      <span className="field-error">
                        {errors.color_hex.message}
                      </span>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend className="form-section-title">
                  {LABELS.SPEC_SECTION}
                </legend>
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="fv-actual-width">
                      {LABELS.ACTUAL_WIDTH}
                    </label>
                    <input
                      id="fv-actual-width"
                      className={`field-input${errors.actual_width_cm ? ' is-error' : ''}`}
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder={MESSAGES.PLACEHOLDER_WIDTH}
                      {...register('actual_width_cm', { valueAsNumber: true })}
                    />
                    {errors.actual_width_cm && (
                      <span className="field-error">
                        {errors.actual_width_cm.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-actual-gsm">{LABELS.ACTUAL_GSM}</label>
                    <input
                      id="fv-actual-gsm"
                      className={`field-input${errors.actual_gsm ? ' is-error' : ''}`}
                      type="number"
                      step="1"
                      min="0"
                      placeholder={MESSAGES.PLACEHOLDER_GSM}
                      {...register('actual_gsm', { valueAsNumber: true })}
                    />
                    {errors.actual_gsm && (
                      <span className="field-error">
                        {errors.actual_gsm.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-shrink-warp">{LABELS.SHRINK_WARP}</label>
                    <input
                      id="fv-shrink-warp"
                      className={`field-input${errors.shrinkage_rate_warp ? ' is-error' : ''}`}
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder={MESSAGES.PLACEHOLDER_SHRINK_WARP}
                      {...register('shrinkage_rate_warp', {
                        valueAsNumber: true,
                      })}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-shrink-weft">{LABELS.SHRINK_WEFT}</label>
                    <input
                      id="fv-shrink-weft"
                      className={`field-input${errors.shrinkage_rate_weft ? ' is-error' : ''}`}
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder={MESSAGES.PLACEHOLDER_SHRINK_WEFT}
                      {...register('shrinkage_rate_weft', {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend className="form-section-title">
                  {LABELS.UOM_SECTION}
                </legend>
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label>{LABELS.BASE_UOM}</label>
                    <Controller
                      name="base_uom"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={[...FABRIC_UOM_OPTIONS]}
                          value={field.value}
                          onChange={field.onChange}
                          hasError={!!errors.base_uom}
                        />
                      )}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-conversion-rate">
                      {LABELS.CONVERSION_RATE}
                    </label>
                    <input
                      id="fv-conversion-rate"
                      className="field-input field-input--readonly"
                      type="number"
                      step="0.001"
                      readOnly
                      {...register('conversion_rate', { valueAsNumber: true })}
                    />
                    <span className="text-xs text-muted italic">
                      {LABELS.AUTO_CALC}
                    </span>
                  </div>
                </div>
              </fieldset>
            </>
          )}

          {stepper.currentStep === 1 && (
            <>
              <fieldset className="form-section">
                <legend className="form-section-title">
                  {LABELS.SOURCING_SECTION}
                </legend>
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="fv-lot">{LABELS.LOT_NUMBER}</label>
                    <input
                      id="fv-lot"
                      className="field-input"
                      type="text"
                      placeholder={MESSAGES.PLACEHOLDER_LOT}
                      {...register('lot_number')}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-sku">{LABELS.SKU}</label>
                    <input
                      id="fv-sku"
                      className="field-input"
                      type="text"
                      placeholder={MESSAGES.PLACEHOLDER_SKU}
                      {...register('sku')}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-barcode">{LABELS.BARCODE}</label>
                    <input
                      id="fv-barcode"
                      className="field-input"
                      type="text"
                      placeholder={MESSAGES.PLACEHOLDER_BARCODE}
                      {...register('barcode')}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-moq">{LABELS.MOQ}</label>
                    <input
                      id="fv-moq"
                      className={`field-input${errors.moq ? ' is-error' : ''}`}
                      type="number"
                      step="1"
                      min="0"
                      placeholder={MESSAGES.PLACEHOLDER_MOQ}
                      {...register('moq', { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend className="form-section-title">
                  {LABELS.PRICE_SECTION}
                </legend>
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="fv-purchase-price">
                      {LABELS.PURCHASE_PRICE}
                    </label>
                    <input
                      id="fv-purchase-price"
                      className="field-input"
                      type="number"
                      step="100"
                      min="0"
                      placeholder={MESSAGES.PLACEHOLDER_PURCHASE}
                      {...register('purchase_price', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-selling-price">
                      {LABELS.SELLING_PRICE}
                    </label>
                    <input
                      id="fv-selling-price"
                      className="field-input"
                      type="number"
                      step="100"
                      min="0"
                      placeholder={MESSAGES.PLACEHOLDER_SELLING}
                      {...register('selling_price', { valueAsNumber: true })}
                    />
                  </div>

                  <div className="form-field">
                    <label>{LABELS.STATUS}</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={STATUS_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          hasError={!!errors.status}
                        />
                      )}
                    />
                  </div>
                </div>
              </fieldset>

              <div className="form-field">
                <label htmlFor="fv-notes">{LABELS.NOTES}</label>
                <textarea
                  id="fv-notes"
                  className="field-textarea"
                  rows={2}
                  placeholder={MESSAGES.PLACEHOLDER_NOTES}
                  {...register('notes')}
                />
              </div>

              {/* Public toggle */}
              <div className="public-toggle-section">
                <div className="public-toggle-section__text">
                  <p className="public-toggle-section__title">
                    {LABELS.PUBLIC_SECTION}
                  </p>
                  <p className="public-toggle-section__desc">
                    {LABELS.PUBLIC_DESC}
                  </p>
                </div>
                <div className="public-toggle-section__controls">
                  <span
                    className={`public-status-dot${watch('is_public') ? ' is-active' : ''}`}
                  >
                    {watch('is_public') ? LABELS.PUBLIC_ON : LABELS.PUBLIC_OFF}
                  </span>
                  <Controller
                    name="is_public"
                    control={control}
                    render={({ field }) => (
                      <Switch checked={field.value} onChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </form>
    </AdaptiveSheet>
  );
}
