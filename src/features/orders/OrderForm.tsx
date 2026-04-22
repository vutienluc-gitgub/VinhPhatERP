import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useFieldArray, useForm, useWatch, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { useActiveCustomers } from '@/shared/hooks/useActiveCustomers';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import { useStepper } from '@/shared/hooks/useStepper';
import { formatCurrency } from '@/shared/utils/format';
import {
  useCreateOrderV2,
  isCreditWarning,
  type CreateOrderError,
  type CreateOrderInput,
} from '@/application/orders';
import { useUpdateOrder } from '@/application/orders';
import { sumBy } from '@/shared/utils/array.util';

import { CreditOverrideDialog } from './CreditOverrideDialog';
import {
  emptyOrderItem,
  ordersDefaultValues,
  ordersSchema,
  ordersSchemaEdit,
  UNIT_OPTIONS,
} from './orders.module';
import type { OrdersFormValues } from './orders.module';
import type { Order } from './types';

const UNIT_LABELS: Record<string, string> = {
  m: 'm',
  kg: 'kg',
};

type OrderFormProps = {
  order: Order | null;
  onClose: () => void;
};

function orderToFormValues(order: Order): OrdersFormValues {
  return {
    orderNumber: order.order_number,
    customerId: order.customer_id,
    orderDate: order.order_date,
    deliveryDate: order.delivery_date ?? '',
    notes: order.notes ?? '',
    items: (order.order_items ?? []).map((it) => ({
      fabricType: it.fabric_type,
      colorName: it.color_name ?? '',
      colorCode: it.color_code ?? '',
      unit: (it.unit === 'm' ? 'm' : 'kg') as 'm' | 'kg',
      quantity: Number(it.quantity),
      unitPrice: Number(it.unit_price),
    })),
  };
}

/* ── Realtime totals ── */

function LineTotals({
  control,
}: {
  control: ReturnType<typeof useForm<OrdersFormValues>>['control'];
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
    <div className="text-right font-semibold text-base py-2 border-t-2 border-border mt-3">
      Tổng cộng: {formatCurrency(total)} đ
    </div>
  );
}

/* ── Quantity + Unit Price with dynamic unit label ── */

type ItemFieldsProps = {
  control: ReturnType<typeof useForm<OrdersFormValues>>['control'];
  index: number;
  register: ReturnType<typeof useForm<OrdersFormValues>>['register'];
  errors: ReturnType<typeof useForm<OrdersFormValues>>['formState']['errors'];
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
        <Controller
          name={`items.${index}.unitPrice` as const}
          control={control}
          render={({ field }) => (
            <CurrencyInput
              id={`items.${index}.unitPrice`}
              className={`field-input${errors.items?.[index]?.unitPrice ? ' is-error' : ''}`}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="0"
            />
          )}
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

export function OrderForm({ order, onClose }: OrderFormProps) {
  const isEditing = order !== null;
  const { profile } = useAuth();
  const [overrideWarning, setOverrideWarning] =
    useState<CreateOrderError | null>(null);

  const createMutationV2 = useCreateOrderV2();
  const updateMutation = useUpdateOrder();
  const { data: customers = [] } = useActiveCustomers();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();
  const { data: colorOptions = [] } = useColorOptions();

  const stepper = useStepper({ totalSteps: 2 });
  // Ref để track step trong onSubmit, tránh stale closure
  const stepRef = useRef(stepper.currentStep);
  useEffect(() => {
    stepRef.current = stepper.currentStep;
  }, [stepper.currentStep]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<OrdersFormValues>({
    resolver: zodResolver(isEditing ? ordersSchemaEdit : ordersSchema),
    defaultValues: isEditing ? orderToFormValues(order) : ordersDefaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // Dùng state để track ID, tránh reset liên tục gây re-render loop
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    const currentId = isEditing ? order.id : 'new';
    if (currentId !== lastOrderId) {
      reset(isEditing ? orderToFormValues(order) : ordersDefaultValues);
      setLastOrderId(currentId);
    }
  }, [order, isEditing, reset, lastOrderId]);

  async function handleNextStep(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (stepper.currentStep === 0) {
      const isValid = await trigger([
        'orderNumber',
        'orderDate',
        'customerId',
        'deliveryDate',
        'notes',
      ]);
      if (isValid) {
        stepper.next();
      }
    }
  }

  async function onSubmit(values: OrdersFormValues) {
    // Guard bằng ref để tránh stale closure khi stepper vừa next()
    if (stepRef.current !== stepper.totalSteps - 1) return;

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: order.id,
          values,
        });
        onClose();
      } else {
        await createMutationV2.mutateAsync(values);
        onClose();
      }
    } catch (err) {
      if (!isEditing && err && typeof err === 'object' && 'code' in err) {
        const e = err as CreateOrderError;
        if (isCreditWarning(e.code)) {
          setOverrideWarning(e);
        } else {
          // Error handled via mutationError
        }
      }
    }
  }

  async function handleOverride() {
    try {
      if (overrideWarning) {
        const values = control._formValues as OrdersFormValues;
        await createMutationV2.mutateAsync({
          ...values,
          managerOverride: true,
        } as CreateOrderInput);
        setOverrideWarning(null);
        onClose();
      }
    } catch (_err) {
      // Error handled via mutationError
    }
  }

  const mutationError = isEditing
    ? updateMutation.error
    : createMutationV2.error;
  const isPending =
    isSubmitting || createMutationV2.isPending || updateMutation.isPending;

  return (
    <>
      <AdaptiveSheet
        open={true}
        onClose={onClose}
        title={
          isEditing ? `Sửa đơn: ${order.order_number}` : 'Tạo đơn hàng mới'
        }
        stepInfo={{
          current: stepper.currentStep,
          total: stepper.totalSteps,
        }}
        maxWidth={720}
      >
        <form
          id="order-form"
          onSubmit={handleSubmit(onSubmit)}
          onKeyDown={(e) => {
            if (
              e.key === 'Enter' &&
              (e.target as HTMLElement).tagName !== 'TEXTAREA' &&
              !stepper.isLast
            ) {
              e.preventDefault();
            }
          }}
          noValidate
        >
          {mutationError && (
            <p className="error-inline mb-4">
              Lỗi: {(mutationError as Error).message}
            </p>
          )}

          <div className="form-grid">
            {/* ── BƯỚC 1: THÔNG TIN CHUNG ── */}
            <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
              <div className="form-grid">
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="orderNumber">Số đơn hàng</label>
                    {isEditing ? (
                      <input
                        id="orderNumber"
                        className="field-input bg-[var(--surface)]"
                        type="text"
                        readOnly
                        {...register('orderNumber')}
                      />
                    ) : (
                      <input
                        id="orderNumber"
                        className="field-input italic bg-[var(--surface-disabled)] text-[var(--text-tertiary)]"
                        type="text"
                        value="Tự động"
                        readOnly
                        disabled
                      />
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="orderDate">
                      Ngày đặt hàng <span className="field-required">*</span>
                    </label>
                    <input
                      id="orderDate"
                      className={`field-input${errors.orderDate ? ' is-error' : ''}`}
                      type="date"
                      {...register('orderDate')}
                    />
                    {errors.orderDate && (
                      <span className="field-error">
                        {errors.orderDate.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
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
                      <span className="field-error">
                        {errors.customerId.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="deliveryDate">Ngày giao dự kiến</label>
                    <input
                      id="deliveryDate"
                      className={`field-input${errors.deliveryDate ? ' is-error' : ''}`}
                      type="date"
                      {...register('deliveryDate')}
                    />
                    {errors.deliveryDate && (
                      <span className="field-error">
                        {errors.deliveryDate.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="notes">Ghi chú đơn hàng</label>
                  <textarea
                    id="notes"
                    className="field-textarea"
                    rows={3}
                    placeholder="Ghi chú về đơn hàng..."
                    {...register('notes')}
                  />
                </div>
              </div>
            </div>

            {/* ── BƯỚC 2: CHI TIẾT HÀNG HÓA ── */}
            <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
              <div className="form-field">
                <label>
                  Dòng hàng <span className="field-required">*</span>
                </label>
                {errors.items?.root && (
                  <span className="field-error block mb-2">
                    {errors.items.root.message}
                  </span>
                )}

                <div className="flex flex-col gap-4 mt-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="form-item-box">
                      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
                        <span className="text-sm font-semibold text-muted">
                          Dòng Hàng #{index + 1}
                        </span>
                        {fields.length > 1 && (
                          <button
                            className="btn-icon danger"
                            type="button"
                            title="Xóa dòng"
                            onClick={() => remove(index)}
                          >
                            Xóa ✕
                          </button>
                        )}
                      </div>

                      <div className="form-grid">
                        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                          <div className="form-field">
                            <label htmlFor={`items.${index}.fabricType`}>
                              Loại vải <span className="field-required">*</span>
                            </label>
                            <Controller
                              name={`items.${index}.fabricType` as const}
                              control={control}
                              render={({ field }) => (
                                <Combobox
                                  options={fabricOptions.map((f) => ({
                                    value: f.name,
                                    label: f.name,
                                    code: f.code,
                                  }))}
                                  value={field.value}
                                  onChange={(val) => {
                                    field.onChange(val);
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
                              )}
                            />
                            {errors.items?.[index]?.fabricType && (
                              <span className="field-error">
                                {errors.items[index].fabricType.message}
                              </span>
                            )}
                          </div>

                          <div className="form-field">
                            <label htmlFor={`items.${index}.colorName`}>
                              Màu
                            </label>
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

                        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
                          <div className="form-field">
                            <label htmlFor={`items.${index}.colorCode`}>
                              Mã màu
                            </label>
                            <input
                              id={`items.${index}.colorCode`}
                              className="field-input"
                              type="text"
                              placeholder="VD: TC-01"
                              {...register(`items.${index}.colorCode`)}
                            />
                          </div>
                          <div className="form-field">
                            <label htmlFor={`items.${index}.unit`}>
                              Đơn vị
                            </label>
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

                        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
                          <ItemQuantityFields
                            control={control}
                            index={index}
                            register={register}
                            errors={errors}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="secondary"
                  className="w-full mt-4"
                  type="button"
                  onClick={() => append({ ...emptyOrderItem })}
                >
                  {' '}
                  + Thêm dòng hàng mới
                </Button>

                <LineTotals control={control} />
              </div>
            </div>
          </div>

          <div className="modal-footer mt-6 p-0 border-none justify-between">
            <div>
              {!stepper.isFirst && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={stepper.prev}
                  disabled={isPending}
                >
                  Quay lại
                </Button>
              )}
              {stepper.isFirst && (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                >
                  Hủy
                </Button>
              )}
            </div>

            <div>
              {!stepper.isLast ? (
                <button
                  className="primary-button btn-standard"
                  type="button"
                  onClick={handleNextStep}
                  disabled={isPending}
                >
                  Tiếp tục
                </button>
              ) : (
                <button
                  className="primary-button btn-standard"
                  type="submit"
                  disabled={isPending}
                >
                  {isPending
                    ? 'Đang lưu...'
                    : isEditing
                      ? 'Lưu thay đổi'
                      : 'Tạo đơn mới'}
                </button>
              )}
            </div>
          </div>
        </form>
      </AdaptiveSheet>

      <CreditOverrideDialog
        open={!!overrideWarning}
        code={overrideWarning?.code || 'CREDIT_LIMIT_EXCEEDED'}
        message={overrideWarning?.message || ''}
        detail={overrideWarning?.detail}
        userRole={profile?.role || 'staff'}
        onConfirm={handleOverride}
        onCancel={() => setOverrideWarning(null)}
        isLoading={createMutationV2.isPending}
      />
    </>
  );
}
