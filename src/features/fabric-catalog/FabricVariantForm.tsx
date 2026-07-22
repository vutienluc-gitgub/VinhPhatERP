import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
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
  MoneyInput,
  LengthInput,
  DensityInput,
  PercentageInput,
  NumericInput,
} from '@/shared/value';
import {
  useCreateFabricVariant,
  useUpdateFabricVariant,
} from '@/application/settings';
import { useConfirm } from '@/shared/components/ConfirmDialog';
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

import { LABELS } from './fabric-catalog.constants';

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
  const confirm = useConfirm();

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
                message: LABELS.VARIANT_VAL_ERR_HEX,
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
                message: LABELS.VARIANT_VAL_ERR_GSM,
              });
              document.getElementById('fv-actual-gsm')?.focus();
              return false;
            }
            if (values.actual_width_cm <= 0) {
              formMethods.setError('actual_width_cm', {
                type: 'min',
                message: LABELS.VARIANT_VAL_ERR_WIDTH,
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
                message: LABELS.VARIANT_VAL_ERR_WARP,
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
                message: LABELS.VARIANT_VAL_ERR_WEFT,
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
      toast.success(
        isEditing
          ? LABELS.VARIANT_SUCCESS_UPDATE
          : LABELS.VARIANT_SUCCESS_CREATE,
      );
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await confirm.alert(`${LABELS.ERROR_PREFIX} ${message}`);
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
          ? `${LABELS.VARIANT_EDIT_TITLE}: ${variant.variant_code}`
          : `${LABELS.VARIANT_ADD_TITLE} — ${parentCode}`
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
              {LABELS.VARIANT_STEP_BACK}
            </Button>
          )}

          {stepper.isLast ? (
            <Button
              variant="primary"
              type="submit"
              form="fabric-variant-form"
              isLoading={isPending}
            >
              {isEditing ? LABELS.UPDATE : LABELS.VARIANT_ADD}
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
              {stepper.isValidating
                ? LABELS.VARIANT_STEP_VALIDATING
                : LABELS.VARIANT_STEP_CONTINUE}
            </Button>
          )}
        </>
      }
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-muted">
          {LABELS.VARIANT_STEP_TITLE.replace(
            '{current}',
            String(stepper.currentStep + 1),
          ).replace('{total}', String(stepper.totalSteps))}
        </div>
        <div className="flex gap-2">
          {status === 'saving' && (
            <span className="text-xs text-muted italic">
              {LABELS.VARIANT_SAVING_DRAFT}
            </span>
          )}
          {status === 'saved' && (
            <span className="text-xs text-emerald-600 italic">
              {LABELS.VARIANT_SAVED_DRAFT}: {lastSavedTimeText}
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
                  {LABELS.VARIANT_COLOR_SECTION}
                </legend>
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="fv-color-name">
                      {LABELS.VARIANT_COLOR_NAME}{' '}
                      <span className="field-required">*</span>
                    </label>
                    <input
                      id="fv-color-name"
                      className={`field-input${errors.color_name ? ' border-danger' : ''}`}
                      type="text"
                      placeholder={LABELS.VARIANT_PLACEHOLDER_COLOR}
                      {...register('color_name')}
                    />
                    {errors.color_name && (
                      <span className="field-error">
                        {errors.color_name.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-color-hex">
                      {LABELS.VARIANT_COLOR_HEX}
                    </label>
                    <div className="flex gap-2 items-center">
                      <input
                        id="fv-color-hex"
                        className={`field-input flex-1${errors.color_hex ? ' border-danger' : ''}`}
                        type="text"
                        placeholder={LABELS.VARIANT_PLACEHOLDER_HEX}
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
                  {LABELS.VARIANT_SPEC_SECTION}
                </legend>
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
                  <Controller
                    name="actual_width_cm"
                    control={control}
                    render={({ field }) => (
                      <LengthInput
                        id="fv-actual-width"
                        className={`field-input${errors.actual_width_cm ? ' border-danger' : ''}`}
                        step="0.1"
                        min="0"
                        placeholder={LABELS.VARIANT_PLACEHOLDER_WIDTH}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />

                  <Controller
                    name="actual_gsm"
                    control={control}
                    render={({ field }) => (
                      <DensityInput
                        id="fv-actual-gsm"
                        className={`field-input${errors.actual_gsm ? ' border-danger' : ''}`}
                        step="1"
                        min="0"
                        placeholder={LABELS.VARIANT_PLACEHOLDER_GSM}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />

                  <Controller
                    name="shrinkage_rate_warp"
                    control={control}
                    render={({ field }) => (
                      <PercentageInput
                        id="fv-shrink-warp"
                        className={`field-input${errors.shrinkage_rate_warp ? ' border-danger' : ''}`}
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder={LABELS.VARIANT_PLACEHOLDER_SHRINK_WARP}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />

                  <Controller
                    name="shrinkage_rate_weft"
                    control={control}
                    render={({ field }) => (
                      <PercentageInput
                        id="fv-shrink-weft"
                        className={`field-input${errors.shrinkage_rate_weft ? ' border-danger' : ''}`}
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder={LABELS.VARIANT_PLACEHOLDER_SHRINK_WEFT}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend className="form-section-title">
                  {LABELS.VARIANT_UOM_SECTION}
                </legend>
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label>{LABELS.VARIANT_BASE_UOM}</label>
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

                  <Controller
                    name="conversion_rate"
                    control={control}
                    render={({ field }) => (
                      <PercentageInput
                        id="fv-conversion-rate"
                        className="field-input field-input--readonly"
                        step="0.001"
                        readOnly
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </div>
              </fieldset>
            </>
          )}

          {stepper.currentStep === 1 && (
            <>
              <fieldset className="form-section">
                <legend className="form-section-title">
                  {LABELS.VARIANT_SOURCING_SECTION}
                </legend>
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="fv-lot">{LABELS.VARIANT_LOT_NUMBER}</label>
                    <input
                      id="fv-lot"
                      className="field-input"
                      type="text"
                      placeholder={LABELS.VARIANT_PLACEHOLDER_LOT}
                      {...register('lot_number')}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-sku">{LABELS.VARIANT_SKU}</label>
                    <input
                      id="fv-sku"
                      className="field-input"
                      type="text"
                      placeholder={LABELS.VARIANT_PLACEHOLDER_SKU}
                      {...register('sku')}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-barcode">{LABELS.VARIANT_BARCODE}</label>
                    <input
                      id="fv-barcode"
                      className="field-input"
                      type="text"
                      placeholder={LABELS.VARIANT_PLACEHOLDER_BARCODE}
                      {...register('barcode')}
                    />
                  </div>

                  <Controller
                    name="moq"
                    control={control}
                    render={({ field }) => (
                      <NumericInput
                        id="fv-moq"
                        className={`field-input${errors.moq ? ' border-danger' : ''}`}
                        step="1"
                        min="0"
                        placeholder={LABELS.VARIANT_PLACEHOLDER_MOQ}
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    )}
                  />
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend className="form-section-title">
                  {LABELS.VARIANT_PRICE_SECTION}
                </legend>
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="fv-purchase-price">
                      {LABELS.VARIANT_PURCHASE_PRICE}
                    </label>
                    <Controller
                      name="purchase_price"
                      control={control}
                      render={({ field }) => (
                        <MoneyInput
                          id="fv-purchase-price"
                          className="field-input"
                          placeholder={LABELS.VARIANT_PLACEHOLDER_PURCHASE}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="fv-selling-price">
                      {LABELS.VARIANT_SELLING_PRICE}
                    </label>
                    <Controller
                      name="selling_price"
                      control={control}
                      render={({ field }) => (
                        <MoneyInput
                          id="fv-selling-price"
                          className="field-input"
                          placeholder={LABELS.VARIANT_PLACEHOLDER_SELLING}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      )}
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
                <label htmlFor="fv-notes">{LABELS.NOTES_LABEL}</label>
                <textarea
                  id="fv-notes"
                  className="field-textarea"
                  rows={2}
                  placeholder={LABELS.NOTES_PLACEHOLDER}
                  {...register('notes')}
                />
              </div>

              {/* Public toggle */}
              <div className="public-toggle-section">
                <div className="public-toggle-section__text">
                  <p className="public-toggle-section__title">
                    {LABELS.VARIANT_PUBLIC_SECTION}
                  </p>
                  <p className="public-toggle-section__desc">
                    {LABELS.VARIANT_PUBLIC_DESC}
                  </p>
                </div>
                <div className="public-toggle-section__controls">
                  <span
                    className={`public-status-dot${watch('is_public') ? ' text-primary bg-primary/10' : ''}`}
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
