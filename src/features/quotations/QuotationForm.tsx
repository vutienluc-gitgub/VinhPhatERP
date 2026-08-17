import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
import { useStepper } from '@/shared/hooks/useStepper';
import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import { Combobox } from '@/shared/components/Combobox';
import { NumericInput } from '@/shared/value';
import { Icon } from '@/shared/components/Icon';
import { useActiveCustomers } from '@/shared/hooks/useActiveCustomers';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import {
  useCreateQuotation,
  useUpdateQuotation,
} from '@/application/quotations';
import {
  DISCOUNT_TYPE_OPTIONS,
  emptyQuotationItem,
  quotationsDefaultValues,
  quotationsSchema,
  VAT_RATE_OPTIONS,
} from '@/schema/quotation.schema';
import type { QuotationsFormValues } from '@/schema/quotation.schema';
import { getErrorMessage } from '@/shared/utils/error';
import type { Quotation } from '@/domain/crm/quotations.types';

import {
  QUOTATION_LABELS,
  QUOTATION_PLACEHOLDERS,
  QUOTATION_MESSAGES,
} from './quotations.constants';
import { QuotationSummary } from './components/QuotationSummary';
import { QuotationItemRow } from './components/QuotationItemRow';

const DISCOUNT_OPTIONS = DISCOUNT_TYPE_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

const VAT_OPTIONS = VAT_RATE_OPTIONS.map((opt) => ({
  value: String(opt.value),
  label: opt.label,
}));

type QuotationFormProps = {
  quotation: Quotation | null;
  initialData?: Partial<QuotationsFormValues>;
  onClose: () => void;
};

function quotationToFormValues(q: Quotation): QuotationsFormValues {
  return {
    quotationNumber: q.quotation_number,
    customerId: q.customer_id,
    quotationDate: q.quotation_date,
    validUntil: q.valid_until ?? '',
    discountType: q.discount_type,
    discountValue: Number(q.discount_value),
    vatRate: Number(q.vat_rate),
    deliveryTerms: q.delivery_terms ?? '',
    paymentTerms: q.payment_terms ?? '',
    notes: q.notes ?? '',
    items: (q.quotation_items ?? []).map((it) => ({
      fabricType: it.fabric_type,
      colorName: it.color_name ?? '',
      colorCode: it.color_code ?? '',
      widthCm: it.width_cm ? Number(it.width_cm) : 0,
      unit: (it.unit === 'm' ? 'm' : 'kg') as 'm' | 'kg',
      quantity: Number(it.quantity),
      unitPrice: Number(it.unit_price),
      leadTimeDays: it.lead_time_days ?? 0,
      notes: it.notes ?? '',
    })),
  };
}

export function QuotationForm({
  quotation,
  initialData,
  onClose,
}: QuotationFormProps) {
  const isEditing = quotation !== null;
  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();
  const { data: customers = [] } = useActiveCustomers();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();
  const { data: colorOptionsData = [] } = useColorOptions();

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: c.id,
        label: c.name,
        code: c.code,
      })),
    [customers],
  );

  const fabricComboOptions = useMemo(
    () =>
      fabricOptions.map((f) => ({
        value: f.name,
        label: f.name,
        code: f.code,
      })),
    [fabricOptions],
  );

  const colorOptions = useMemo(
    () => toColorComboboxOptions(colorOptionsData),
    [colorOptionsData],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<QuotationsFormValues>({
    resolver: zodResolver(quotationsSchema),
    defaultValues: isEditing
      ? quotationToFormValues(quotation)
      : { ...quotationsDefaultValues, ...initialData },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    reset(
      isEditing
        ? quotationToFormValues(quotation)
        : { ...quotationsDefaultValues, ...initialData },
    );
  }, [quotation, initialData, isEditing, reset]);

  async function onSubmit(values: QuotationsFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: quotation.id,
          values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch {
      // Error displayed via mutationError below
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const stepper = useStepper({
    totalSteps: 4,
    stepValidation: {
      0: () => trigger(['quotationDate', 'customerId', 'validUntil']),
      1: () => trigger(['items']),
      2: () => trigger(['discountValue', 'vatRate']),
    },
    onCancel: onClose,
  });

  async function handleFinalSubmit(values: QuotationsFormValues) {
    if (!stepper.isLast) return;
    await onSubmit(values);
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={
        isEditing
          ? `${QUOTATION_LABELS.EDIT_QUOTATION}: ${quotation.quotation_number}`
          : QUOTATION_LABELS.NEW_QUOTATION
      }
      maxWidth={780}
      stepInfo={{ current: stepper.currentStep, total: stepper.totalSteps }}
      footer={
        <StepperFooter
          stepper={stepper}
          onCancel={onClose}
          isPending={isPending}
          submitLabel={
            isEditing ? QUOTATION_LABELS.BTN_UPDATE : QUOTATION_LABELS.BTN_SAVE
          }
          formId="quotation-form"
        />
      }
    >
      <form
        id="quotation-form"
        onSubmit={handleSubmit(handleFinalSubmit)}
        onKeyDown={stepper.handleKeyDown}
        noValidate
      >
        {mutationError && (
          <p className="error-inline mb-4">
            {QUOTATION_MESSAGES.ERROR_PREFIX} {getErrorMessage(mutationError)}
          </p>
        )}

        <div className="form-grid">
          {/* STEP 1: THÔNG TIN CƠ BẢN */}
          <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
            <div className="form-grid sm:grid-cols-2">
              <div className="form-field">
                <label htmlFor="quotationNumber">
                  {QUOTATION_LABELS.QUOTATION_NUMBER}
                </label>
                {isEditing ? (
                  <input
                    id="quotationNumber"
                    className="field-input"
                    type="text"
                    readOnly
                    {...register('quotationNumber')}
                  />
                ) : (
                  <input
                    id="quotationNumber"
                    className="field-input italic text-[var(--muted-foreground)]"
                    type="text"
                    value={QUOTATION_PLACEHOLDERS.AUTO_NUMBER}
                    readOnly
                    disabled
                  />
                )}
              </div>

              <div className="form-field">
                <label htmlFor="quotationDate">
                  {QUOTATION_LABELS.QUOTATION_DATE}{' '}
                  <span className="field-required">*</span>
                </label>
                <input
                  id="quotationDate"
                  className={`field-input${errors.quotationDate ? ' border-danger' : ''}`}
                  type="date"
                  {...register('quotationDate')}
                />
                {errors.quotationDate && (
                  <span className="field-error">
                    {errors.quotationDate.message}
                  </span>
                )}
              </div>
            </div>

            <div className="form-grid sm:grid-cols-2">
              <div className="form-field">
                <label htmlFor="customerId">
                  {QUOTATION_LABELS.CUSTOMER}{' '}
                  <span className="field-required">*</span>
                </label>
                <Controller
                  name="customerId"
                  control={control}
                  render={({ field }) => {
                    return (
                      <Combobox
                        options={customerOptions}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={QUOTATION_PLACEHOLDERS.SELECT_CUSTOMER}
                        hasError={!!errors.customerId}
                      />
                    );
                  }}
                />
                {errors.customerId && (
                  <span className="field-error">
                    {errors.customerId.message}
                  </span>
                )}
              </div>

              <div className="form-field">
                <label htmlFor="validUntil">
                  {QUOTATION_LABELS.VALID_UNTIL}
                </label>
                <input
                  id="validUntil"
                  className={`field-input${errors.validUntil ? ' border-danger' : ''}`}
                  type="date"
                  {...register('validUntil')}
                />
                {errors.validUntil && (
                  <span className="field-error">
                    {errors.validUntil.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* STEP 2: DÒNG HÀNG */}
          <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
            <div className="form-field">
              <label>
                {QUOTATION_LABELS.LINE_ITEMS}{' '}
                <span className="field-required">*</span>
              </label>
              {errors.items?.root && (
                <span className="field-error mb-2 block">
                  {errors.items.root.message}
                </span>
              )}

              <div className="flex flex-col gap-3">
                {fields.map((field, index) => (
                  <QuotationItemRow
                    key={field.id}
                    index={index}
                    control={control}
                    register={register}
                    errors={errors}
                    setValue={setValue}
                    remove={remove}
                    fabricComboOptions={fabricComboOptions}
                    fabricOptions={fabricOptions}
                    colorOptions={colorOptions}
                  />
                ))}
              </div>

              <button
                className="btn-secondary w-full mt-2"
                type="button"
                onClick={() => append({ ...emptyQuotationItem })}
              >
                <Icon name="Plus" size={16} /> {QUOTATION_LABELS.ADD_ITEM}
              </button>
            </div>
          </div>

          {/* STEP 3: CHIẾT KHẤU & VAT */}
          <div className={stepper.currentStep === 2 ? 'block' : 'hidden'}>
            <div className="form-grid sm:grid-cols-2">
              <div className="form-field">
                <label htmlFor="discountType">
                  {QUOTATION_LABELS.DISCOUNT_TYPE}
                </label>
                <Controller
                  name="discountType"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={DISCOUNT_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>

              <div className="form-field">
                <label htmlFor="discountValue">
                  {QUOTATION_LABELS.DISCOUNT_VALUE}
                </label>
                <Controller
                  name="discountValue"
                  control={control}
                  render={({ field }) => (
                    <NumericInput
                      id="discountValue"
                      className="field-input"
                      placeholder="0"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      formatOptions={{ decimals: 2 }}
                    />
                  )}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="vatRate">{QUOTATION_LABELS.VAT_RATE}</label>
              <Controller
                name="vatRate"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={VAT_OPTIONS}
                    value={String(field.value)}
                    onChange={(val) => field.onChange(Number(val))}
                  />
                )}
              />
            </div>

            <QuotationSummary control={control} />
          </div>

          {/* STEP 4: ĐIỀU KHOẢN */}
          <div className={stepper.currentStep === 3 ? 'block' : 'hidden'}>
            <div className="form-grid sm:grid-cols-2">
              <div className="form-field">
                <label htmlFor="deliveryTerms">
                  {QUOTATION_LABELS.DELIVERY_TERMS}
                </label>
                <textarea
                  id="deliveryTerms"
                  className="field-textarea"
                  rows={2}
                  placeholder={QUOTATION_PLACEHOLDERS.DELIVERY_TERMS}
                  {...register('deliveryTerms')}
                />
              </div>

              <div className="form-field">
                <label htmlFor="paymentTerms">
                  {QUOTATION_LABELS.PAYMENT_TERMS}
                </label>
                <textarea
                  id="paymentTerms"
                  className="field-textarea"
                  rows={2}
                  placeholder={QUOTATION_PLACEHOLDERS.PAYMENT_TERMS}
                  {...register('paymentTerms')}
                />
              </div>
            </div>

            <div className="form-field mt-4">
              <label htmlFor="notes">{QUOTATION_LABELS.NOTES}</label>
              <textarea
                id="notes"
                className="field-textarea"
                rows={2}
                placeholder={QUOTATION_PLACEHOLDERS.NOTES}
                {...register('notes')}
              />
            </div>
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
