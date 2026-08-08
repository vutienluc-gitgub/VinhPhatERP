import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';

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
import { loadDraft, clearDraft } from '@/shared/hooks/useAutoSave';
import DraftBanner from '@/shared/components/DraftBanner';
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
import { getErrorMessage } from '@/shared/utils/error';

import { CreditOverrideDialog } from './CreditOverrideDialog';
import { TradingItemRow } from './components/TradingItemRow';
import { ProductionItemRow } from './components/ProductionItemRow';
import {
  AutoSaveSubscriber,
  LineTotals,
  DRAFT_KEY,
} from './components/OrderFormHelpers';
import type { Order } from './types';
import { ORDERS_FORM_LABELS } from './orders.constants';

const UNIT_COMBO_OPTIONS = UNIT_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

export type OrderFormProps = {
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
        if (!window.confirm(ORDERS_FORM_LABELS.UNSAVED_WARNING)) {
          return false;
        }
      }
      onClose();
      return true;
    },
  });

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (!window.confirm(ORDERS_FORM_LABELS.UNSAVED_WARNING)) {
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
          isEditing
            ? `${ORDERS_FORM_LABELS.TITLE_EDIT}${order.order_number}`
            : ORDERS_FORM_LABELS.TITLE_NEW
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
              {ORDERS_FORM_LABELS.ERROR_PREFIX}
              {getErrorMessage(mutationError)}
            </p>
          )}

          <div className="form-grid">
            {/* ── BƯỚC 1: THÔNG TIN CHUNG ── */}
            <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
              <div className="form-grid">
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="orderNumber">
                      {ORDERS_FORM_LABELS.FIELD_ORDER_NUMBER}
                    </label>
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
                        className="field-input italic bg-[var(--surface-disabled)] text-[var(--muted-foreground)]"
                        type="text"
                        value={ORDERS_FORM_LABELS.AUTO_NUMBER}
                        readOnly
                        disabled
                      />
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="orderType">
                      {ORDERS_FORM_LABELS.FIELD_ORDER_TYPE}{' '}
                      <span className="field-required">*</span>
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
                      {ORDERS_FORM_LABELS.FIELD_ORDER_DATE}{' '}
                      <span className="field-required">*</span>
                    </label>
                    <input
                      id="orderDate"
                      className={`field-input${errors.orderDate ? ' border-danger' : ''}`}
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
                      {ORDERS_FORM_LABELS.FIELD_CUSTOMER}{' '}
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
                            placeholder={
                              ORDERS_FORM_LABELS.PLACEHOLDER_CUSTOMER
                            }
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
                    <label htmlFor="deliveryDate">
                      {ORDERS_FORM_LABELS.FIELD_DELIVERY_DATE}
                    </label>
                    <input
                      id="deliveryDate"
                      className={`field-input${errors.deliveryDate ? ' border-danger' : ''}`}
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
                  <label htmlFor="notes">
                    {ORDERS_FORM_LABELS.FIELD_NOTES}
                  </label>
                  <textarea
                    id="notes"
                    className="field-textarea"
                    rows={3}
                    placeholder={ORDERS_FORM_LABELS.PLACEHOLDER_NOTES}
                    {...register('notes')}
                  />
                </div>
              </div>
            </div>

            {/* ── BƯỚC 2: CHI TIẾT HÀNG HÓA ── */}
            <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
              <div className="form-field">
                <label>
                  {ORDERS_FORM_LABELS.SECTION_ITEMS}{' '}
                  <span className="field-required">*</span>
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
                      <ProductionItemRow
                        key={field.id}
                        index={index}
                        control={control}
                        setValue={setValue}
                        errors={errors as Record<string, unknown>}
                        register={register}
                        fabricComboOptions={fabricComboOptions}
                        fabricOptions={fabricOptions}
                        colorComboOptions={colorComboOptions}
                        unitComboOptions={UNIT_COMBO_OPTIONS}
                        onRemove={() => remove(index)}
                        canRemove={fields.length > 1}
                      />
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
                  {ORDERS_FORM_LABELS.BTN_ADD_ITEM}
                </Button>

                <LineTotals control={control} />
              </div>
            </div>
          </div>
          <StepperFooter
            stepper={stepper}
            onCancel={handleCancel}
            isPending={isPending}
            submitLabel={
              isEditing
                ? ORDERS_FORM_LABELS.BTN_SAVE
                : ORDERS_FORM_LABELS.BTN_CREATE
            }
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
