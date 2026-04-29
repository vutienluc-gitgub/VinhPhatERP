import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useFieldArray, useForm, useWatch, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import { Combobox } from '@/shared/components/Combobox';
import { Icon } from '@/shared/components/Icon';
import { useActiveCustomers } from '@/shared/hooks/useActiveCustomers';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import { formatCurrency } from '@/shared/utils/format';
import {
  useCreateQuotation,
  useUpdateQuotation,
} from '@/application/quotations';
import {
  calculateQuotationTotals,
  DISCOUNT_TYPE_OPTIONS,
  emptyQuotationItem,
  quotationsDefaultValues,
  quotationsSchema,
  UNIT_OPTIONS,
  VAT_RATE_OPTIONS,
} from '@/schema/quotation.schema';
import type { QuotationsFormValues } from '@/schema/quotation.schema';

import type { DiscountType, Quotation } from './types';

const UNIT_LABELS: Record<string, string> = {
  m: 'm',
  kg: 'kg',
};

type QuotationFormProps = {
  quotation: Quotation | null;
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

/* ── Realtime totals ── */

function TotalsSummary({
  control,
}: {
  control: ReturnType<typeof useForm<QuotationsFormValues>>['control'];
}) {
  const items = useWatch({
    control,
    name: 'items',
  });
  const discountType = useWatch({
    control,
    name: 'discountType',
  }) as DiscountType;
  const discountValue =
    useWatch({
      control,
      name: 'discountValue',
    }) ?? 0;
  const vatRate =
    useWatch({
      control,
      name: 'vatRate',
    }) ?? 10;

  const totals = calculateQuotationTotals(
    items ?? [],
    discountType,
    Number(discountValue),
    Number(vatRate),
  );

  return (
    <div className="border-t-2 border-border py-3 flex flex-col gap-1.5 text-[0.92rem]">
      <div className="flex justify-between">
        <span>Tạm tính:</span>
        <span>{formatCurrency(totals.subtotal)}đ</span>
      </div>
      {totals.discountAmount > 0 && (
        <div className="flex justify-between text-danger">
          <span>Chiết khấu:</span>
          <span>-{formatCurrency(totals.discountAmount)}đ</span>
        </div>
      )}
      <div className="flex justify-between">
        <span>Trước VAT:</span>
        <span>{formatCurrency(totals.totalBeforeVat)}đ</span>
      </div>
      {totals.vatAmount > 0 && (
        <div className="flex justify-between">
          <span>VAT ({vatRate}%):</span>
          <span>+{formatCurrency(totals.vatAmount)}đ</span>
        </div>
      )}
      <div className="flex justify-between font-bold text-[1.05rem] border-t border-border pt-2">
        <span>Tổng cộng:</span>
        <span>{formatCurrency(totals.totalAmount)}đ</span>
      </div>
    </div>
  );
}

/* ── Quantity + Unit Price fields ── */

type ItemFieldsProps = {
  control: ReturnType<typeof useForm<QuotationsFormValues>>['control'];
  index: number;
  register: ReturnType<typeof useForm<QuotationsFormValues>>['register'];
  errors: ReturnType<
    typeof useForm<QuotationsFormValues>
  >['formState']['errors'];
};

function ItemQuantityFields({
  control,
  index,
  register,
  errors,
}: ItemFieldsProps) {
  const unit =
    useWatch({
      control,
      name: `items.${index}.unit`,
    }) ?? 'm';
  const unitLabel = UNIT_LABELS[unit] ?? unit;

  return (
    <>
      <div className="form-field">
        <label htmlFor={`items.${index}.quantity`}>
          Số lượng ({unitLabel}) <span className="field-required">*</span>
        </label>
        <input
          id={`items.${index}.quantity`}
          className={`field-input${errors.items?.[index]?.quantity ? ' is-error' : ''}`}
          type="number"
          step="0.001"
          min="0"
          placeholder="0"
          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
        />
        {errors.items?.[index]?.quantity && (
          <span className="field-error">
            {errors.items[index].quantity.message}
          </span>
        )}
      </div>

      <div className="form-field">
        <label htmlFor={`items.${index}.unitPrice`}>
          Đơn giá (đ/{unitLabel}) <span className="field-required">*</span>
        </label>
        <input
          id={`items.${index}.unitPrice`}
          className={`field-input${errors.items?.[index]?.unitPrice ? ' is-error' : ''}`}
          type="number"
          step="1"
          min="0"
          placeholder="0"
          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })}
        />
        {errors.items?.[index]?.unitPrice && (
          <span className="field-error">
            {errors.items[index].unitPrice.message}
          </span>
        )}
      </div>
    </>
  );
}

export function QuotationForm({ quotation, onClose }: QuotationFormProps) {
  const isEditing = quotation !== null;
  const createMutation = useCreateQuotation();
  const updateMutation = useUpdateQuotation();
  const { data: customers = [] } = useActiveCustomers();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();
  const { data: colorOptions = [] } = useColorOptions();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuotationsFormValues>({
    resolver: zodResolver(quotationsSchema),
    defaultValues: isEditing
      ? quotationToFormValues(quotation)
      : quotationsDefaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    reset(
      isEditing ? quotationToFormValues(quotation) : quotationsDefaultValues,
    );
  }, [quotation, isEditing, reset]);

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

  return (
    <form id="quotation-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      {mutationError && (
        <p className="error-inline mb-4">
          Lỗi: {(mutationError as Error).message}
        </p>
      )}

      <div className="form-grid">
        {/* Row 1: So BG + Ngay BG */}
        <div className="form-grid sm:grid-cols-2">
          <div className="form-field">
            <label htmlFor="quotationNumber">Số báo giá</label>
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
                className="field-input italic text-[var(--text-tertiary)]"
                type="text"
                value="Tự động"
                readOnly
                disabled
              />
            )}
          </div>

          <div className="form-field">
            <label htmlFor="quotationDate">
              Ngày báo giá <span className="field-required">*</span>
            </label>
            <input
              id="quotationDate"
              className={`field-input${errors.quotationDate ? ' is-error' : ''}`}
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

        {/* Row 2: Khach hang + Het hieu luc */}
        <div className="form-grid sm:grid-cols-2">
          <div className="form-field">
            <label htmlFor="customerId">
              Khách hàng <span className="field-required">*</span>
            </label>
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => {
                const customerOptions = customers.map((c) => ({
                  value: c.id,
                  label: c.name,
                  code: c.code,
                }));
                return (
                  <Combobox
                    options={customerOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="— Chọn khách hàng —"
                    hasError={!!errors.customerId}
                  />
                );
              }}
            />
            {errors.customerId && (
              <span className="field-error">{errors.customerId.message}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="validUntil">Hiệu lực đến</label>
            <input
              id="validUntil"
              className={`field-input${errors.validUntil ? ' is-error' : ''}`}
              type="date"
              {...register('validUntil')}
            />
            {errors.validUntil && (
              <span className="field-error">{errors.validUntil.message}</span>
            )}
          </div>
        </div>

        {/* Line items */}
        <div className="form-field">
          <label>
            Dòng hàng <span className="field-required">*</span>
          </label>
          {errors.items?.root && (
            <span className="field-error mb-2 block">
              {errors.items.root.message}
            </span>
          )}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border border-border rounded-lg p-3 bg-surface"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[0.85rem] font-bold text-muted uppercase tracking-wider">
                    Dòng {index + 1}
                  </span>
                  <button
                    className="btn-icon text-danger"
                    type="button"
                    title="Xóa dòng"
                    onClick={() => remove(index)}
                  >
                    <Icon name="X" size={16} />
                  </button>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor={`items.${index}.fabricType`}>
                      Loại vải <span className="field-required">*</span>
                    </label>
                    <Controller
                      name={`items.${index}.fabricType` as const}
                      control={control}
                      render={({ field }) => {
                        const fabricComboOptions = fabricOptions.map((f) => ({
                          value: f.name,
                          label: f.name,
                          code: f.code,
                        }));
                        return (
                          <Combobox
                            options={fabricComboOptions}
                            value={field.value}
                            onChange={(val) => {
                              field.onChange(val);
                              // Auto-fill unit from catalog
                              const selected = fabricOptions.find(
                                (f) => f.name === val,
                              );
                              if (selected?.unit) {
                                setValue(
                                  `items.${index}.unit`,
                                  selected.unit as 'm' | 'kg',
                                );
                              }
                            }}
                            placeholder="Chọn hoặc nhập loại vải"
                            hasError={!!errors.items?.[index]?.fabricType}
                          />
                        );
                      }}
                    />
                    {errors.items?.[index]?.fabricType && (
                      <span className="field-error">
                        {errors.items[index].fabricType.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor={`items.${index}.colorName`}>Màu</label>
                    <Controller
                      name={`items.${index}.colorName` as const}
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={toColorComboboxOptions(colorOptions)}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          placeholder="Chọn hoặc nhập màu..."
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor={`items.${index}.colorCode`}>Mã màu</label>
                    <input
                      id={`items.${index}.colorCode`}
                      className="field-input"
                      type="text"
                      placeholder="VD: TC-01"
                      {...register(`items.${index}.colorCode`)}
                    />
                  </div>

                  <div className="form-grid form-grid-2">
                    <div className="form-field">
                      <label htmlFor={`items.${index}.widthCm`}>
                        Khổ vải (cm)
                      </label>
                      <input
                        id={`items.${index}.widthCm`}
                        className="field-input"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="150"
                        {...register(`items.${index}.widthCm`, {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="form-field">
                      <label htmlFor={`items.${index}.unit`}>Đơn vị</label>
                      <Controller
                        name={`items.${index}.unit` as const}
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={UNIT_OPTIONS.map((opt) => ({
                              value: opt.value,
                              label: opt.label,
                            }))}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-grid form-grid-2">
                  <ItemQuantityFields
                    control={control}
                    index={index}
                    register={register}
                    errors={errors}
                  />
                </div>

                <div className="form-grid form-grid-2">
                  <div className="form-field">
                    <label htmlFor={`items.${index}.leadTimeDays`}>
                      Thời gian SX (ngày)
                    </label>
                    <input
                      id={`items.${index}.leadTimeDays`}
                      className="field-input"
                      type="number"
                      min="0"
                      placeholder="15"
                      {...register(`items.${index}.leadTimeDays`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor={`items.${index}.notes`}>Ghi chú dòng</label>
                    <input
                      id={`items.${index}.notes`}
                      className="field-input"
                      type="text"
                      placeholder="Ghi chú..."
                      {...register(`items.${index}.notes`)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn-secondary w-full mt-2"
            type="button"
            onClick={() => append({ ...emptyQuotationItem })}
          >
            <Icon name="Plus" size={16} /> Thêm dòng hàng
          </button>
        </div>

        {/* Discount + VAT */}
        <div className="form-grid sm:grid-cols-2">
          <div className="form-field">
            <label htmlFor="discountType">Loại chiết khấu</label>
            <Controller
              name="discountType"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={DISCOUNT_TYPE_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>

          <div className="form-field">
            <label htmlFor="discountValue">Giá trị chiết khấu</label>
            <input
              id="discountValue"
              className="field-input"
              type="number"
              step="0.01"
              min="0"
              placeholder="0"
              {...register('discountValue', { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="vatRate">Thuế VAT</label>
          <Controller
            name="vatRate"
            control={control}
            render={({ field }) => (
              <Combobox
                options={VAT_RATE_OPTIONS.map((opt) => ({
                  value: String(opt.value),
                  label: opt.label,
                }))}
                value={String(field.value)}
                onChange={(val) => field.onChange(Number(val))}
              />
            )}
          />
        </div>

        {/* Totals summary */}
        <TotalsSummary control={control} />

        {/* Terms */}
        <div className="form-grid sm:grid-cols-2">
          <div className="form-field">
            <label htmlFor="deliveryTerms">Điều kiện giao hàng</label>
            <textarea
              id="deliveryTerms"
              className="field-textarea"
              rows={2}
              placeholder="VD: Giao tại kho khách..."
              {...register('deliveryTerms')}
            />
          </div>

          <div className="form-field">
            <label htmlFor="paymentTerms">Điều kiện thanh toán</label>
            <textarea
              id="paymentTerms"
              className="field-textarea"
              rows={2}
              placeholder="VD: Thanh toán 50% trước..."
              {...register('paymentTerms')}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="form-field">
          <label htmlFor="notes">Ghi chú</label>
          <textarea
            id="notes"
            className="field-textarea"
            rows={2}
            placeholder="Ghi chú về báo giá..."
            {...register('notes')}
          />
        </div>
      </div>

      <div className="modal-footer mt-6 p-0 border-none bg-transparent">
        <Button
          variant="secondary"
          type="button"
          onClick={onClose}
          disabled={isPending}
        >
          Hủy
        </Button>
        <Button variant="primary" type="submit" disabled={isPending}>
          {isPending ? 'Đang lưu...' : isEditing ? 'Cập nhật' : 'Tạo báo giá'}
        </Button>
      </div>
    </form>
  );
}
