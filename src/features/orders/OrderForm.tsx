import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useFieldArray, useForm, useWatch, Controller } from 'react-hook-form';
import type { UseFormWatch } from 'react-hook-form';

import { Button } from '@/shared/components';
import { useAuth } from '@/shared/hooks/useAuth';
import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
import { Combobox } from '@/shared/components/Combobox';
import { useActiveCustomers } from '@/shared/hooks/useActiveCustomers';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import { useStepper } from '@/shared/hooks/useStepper';
import { useAutoSave, loadDraft, clearDraft } from '@/shared/hooks/useAutoSave';
import DraftBanner from '@/shared/components/DraftBanner';
import SaveStatus from '@/shared/components/SaveStatus';
import { MoneyInput, MoneyText } from '@/shared/value';
import {
  useCreateOrderV2,
  isCreditWarning,
  type CreateOrderError,
  type CreateOrderInput,
} from '@/application/orders';
import { useUpdateOrder } from '@/application/orders';
import {
  emptyOrderItem,
  emptyTradingItem,
  ordersDefaultValues,
  ordersSchema,
  ordersSchemaEdit,
  UNIT_OPTIONS,
  ORDER_TYPE_OPTIONS,
} from '@/schema/order.schema';
import type { OrdersFormValues } from '@/schema/order.schema';
import { calculateOrderTotal } from '@/domain/orders';
import { getErrorMessage } from '@/shared/utils/error';

import { CreditOverrideDialog } from './CreditOverrideDialog';
import { TradingItemRow } from './components/TradingItemRow';
import type { Order } from './types';

const DRAFT_KEY = 'order-draft';

/**
 * Isolated sub-component that subscribes to ALL form values for auto-save.
 * By extracting this, the re-renders caused by watch() are confined here
 * and do NOT propagate to the main OrderForm tree.
 */
function AutoSaveSubscriber({
  watch,
}: {
  watch: UseFormWatch<OrdersFormValues>;
}) {
  const formValues = watch();
  const { status: saveStatus, lastSavedAt } = useAutoSave({
    key: DRAFT_KEY,
    data: formValues,
    delay: 800,
  });
  return <SaveStatus status={saveStatus} lastSavedAt={lastSavedAt} />;
}

const UNIT_LABELS: Record<string, string> = {
  m: 'm',
  kg: 'kg',
};

const UNIT_COMBO_OPTIONS = UNIT_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

type OrderFormProps = {
  order: Order | null;
  onClose: () => void;
};

function orderToFormValues(order: Order): OrdersFormValues {
  return {
    orderNumber: order.order_number,
    orderType: (order.order_type as 'production' | 'trading') ?? 'production',
    customerId: order.customer_id,
    orderDate: order.order_date,
    deliveryDate: order.delivery_date ?? '',
    notes: order.notes ?? '',
    items: (order.order_items ?? []).map((it) => ({
      productCategory:
        ((it as Record<string, unknown>).product_category as
          | 'fabric'
          | 'yarn'
          | 'raw_fabric'
          | 'finished_fabric') ?? 'fabric',
      sourceStockId:
        ((it as Record<string, unknown>).source_stock_id as string) ?? '',
      sourceLotNumber:
        ((it as Record<string, unknown>).source_lot_number as string) ?? '',
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
  const total = calculateOrderTotal(items);
  return (
    <div className="text-right font-semibold text-base py-2 border-t-2 border-border mt-3 flex items-center justify-end gap-1">
      Tổng cộng: <MoneyText value={total} suffix="đ" />
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
            <MoneyInput
              id={`items.${index}.unitPrice`}
              className={`field-input${errors.items?.[index]?.unitPrice ? ' is-error' : ''}`}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder="0"
              suffix={` đ/${unitLabel}`}
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

  // Draft restoration state
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [savedDraft, setSavedDraft] = useState<OrdersFormValues | null>(null);

  const createMutationV2 = useCreateOrderV2();
  const updateMutation = useUpdateOrder();
  const { data: customers = [] } = useActiveCustomers();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();
  const { data: colorOptions = [] } = useColorOptions();

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

  const colorComboOptions = useMemo(
    () => toColorComboboxOptions(colorOptions),
    [colorOptions],
  );

  // ── DRAFT RESTORATION ──
  const draftCheckedRef = useRef(false);
  useEffect(() => {
    if (isEditing || draftCheckedRef.current) return;
    draftCheckedRef.current = true;
    const draft = loadDraft<OrdersFormValues>(DRAFT_KEY);
    if (draft && draft.customerId) {
      setSavedDraft(draft);
      setShowDraftBanner(true);
    }
  }, [isEditing]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<OrdersFormValues>({
    resolver: zodResolver(isEditing ? ordersSchemaEdit : ordersSchema),
    defaultValues: isEditing ? orderToFormValues(order) : ordersDefaultValues,
  });

  const stepper = useStepper({
    totalSteps: 2,
    stepValidation: {
      0: () =>
        trigger([
          'orderNumber',
          'orderDate',
          'customerId',
          'deliveryDate',
          'notes',
        ]),
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

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'items',
  });

  function handleRestoreDraft() {
    if (!savedDraft) return;
    reset(savedDraft);
    if (savedDraft.items?.length) {
      replace(savedDraft.items);
    }
    setShowDraftBanner(false);
    setSavedDraft(null);
  }

  function handleDiscardDraft() {
    clearDraft(DRAFT_KEY);
    setShowDraftBanner(false);
    setSavedDraft(null);
  }

  async function onSubmit(values: OrdersFormValues) {
    // Guard bằng ref để tránh stale closure khi stepper vừa next()
    if (stepRef.current !== stepper.totalSteps - 1) return;

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: order.id,
          values,
          expectedUpdatedAt: order.updated_at ?? undefined,
        });
      } else {
        await createMutationV2.mutateAsync(values);
      }
      clearDraft(DRAFT_KEY);
      onClose();
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
        onClose={handleCancel}
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
          onKeyDown={stepper.handleKeyDown}
          noValidate
        >
          {showDraftBanner && (
            <DraftBanner
              onRestore={handleRestoreDraft}
              onDiscard={handleDiscardDraft}
            />
          )}

          {mutationError && (
            <p className="error-inline mb-4">
              Lỗi: {getErrorMessage(mutationError)}
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
                    <label htmlFor="orderType">
                      Loại đơn hàng <span className="field-required">*</span>
                    </label>
                    <Controller
                      name="orderType"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={
                            ORDER_TYPE_OPTIONS as unknown as {
                              label: string;
                              value: string;
                            }[]
                          }
                          value={field.value}
                          onChange={(val) => {
                            const prev = field.value;
                            field.onChange(val);
                            // Reset items when switching order type
                            if (val !== prev) {
                              const newEmpty =
                                val === 'trading'
                                  ? { ...emptyTradingItem }
                                  : { ...emptyOrderItem };
                              setValue('items', [newEmpty]);
                            }
                          }}
                          disabled={isEditing && order?.status !== 'draft'}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
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
                  {fields.map((field, index) => {
                    const currentOrderType = control._formValues?.orderType;
                    const currentCategory =
                      control._formValues?.items?.[index]?.productCategory;
                    const isTrading = currentOrderType === 'trading';

                    if (isTrading) {
                      return (
                        <TradingItemRow
                          key={field.id}
                          index={index}
                          control={control}
                          setValue={setValue}
                          errors={errors as Record<string, unknown>}
                          register={register}
                          productCategory={currentCategory ?? 'yarn'}
                          onRemove={() => remove(index)}
                          canRemove={fields.length > 1}
                        />
                      );
                    }

                    return (
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
                                Loại vải{' '}
                                <span className="field-required">*</span>
                              </label>
                              <Controller
                                name={`items.${index}.fabricType` as const}
                                control={control}
                                render={({ field }) => (
                                  <Combobox
                                    options={fabricComboOptions}
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
                                    hasError={
                                      !!errors.items?.[index]?.fabricType
                                    }
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
                                    options={colorComboOptions}
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
                                    options={UNIT_COMBO_OPTIONS}
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
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  className="w-full mt-4"
                  type="button"
                  onClick={() => {
                    const isTrading =
                      control._formValues?.orderType === 'trading';
                    append({
                      ...(isTrading ? emptyTradingItem : emptyOrderItem),
                    });
                  }}
                >
                  {' '}
                  + Thêm dòng hàng mới
                </Button>

                <LineTotals control={control} />
              </div>
            </div>
          </div>
          <StepperFooter
            stepper={stepper}
            onCancel={handleCancel}
            isPending={isPending}
            submitLabel={isEditing ? 'Lưu thay đổi' : 'Tạo đơn mới'}
          >
            <AutoSaveSubscriber watch={watch} />
          </StepperFooter>
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
