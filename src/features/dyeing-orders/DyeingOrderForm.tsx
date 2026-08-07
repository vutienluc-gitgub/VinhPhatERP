import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  AdaptiveSheet,
  Icon,
  VPVirtualCombobox,
  VPEntityPicker,
  Button,
} from '@/shared/components';
import { MoneyInput, WeightInput, LengthInput } from '@/shared/value';
import { StepperFooter } from '@/shared/components/StepperFooter';
import { useStepper } from '@/shared/hooks/useStepper';
import {
  dyeingOrderSchema,
  dyeingOrderDefaults,
  emptyDyeingOrderItem,
} from '@/schema/dyeing-order.schema';
import type { DyeingOrderFormValues } from '@/schema/dyeing-order.schema';
import {
  useCreateDyeingOrder,
  useDyeingSuppliers,
  useUpdateDyeingOrder,
} from '@/application/production';
import { useAvailableRawRolls } from '@/application/inventory';
import { useColors } from '@/application/color-catalog';
import { sumBy } from '@/shared/utils/array.util';

import { useRollSelection } from './hooks/useRollSelection';
import { DYEING_ORDER_MESSAGES as MSG } from './dyeing-orders.constants';
import type { DyeingOrder } from './types';
import { RollSelectionDropdown } from './components/RollSelectionDropdown';

type DyeingOrderFormProps = {
  isOpen: boolean;
  onClose: () => void;
  editingOrder?: DyeingOrder | null;
};

export function DyeingOrderForm({
  isOpen,
  onClose,
  editingOrder,
}: DyeingOrderFormProps) {
  const isEdit = !!editingOrder;
  const createMutation = useCreateDyeingOrder();
  const updateMutation = useUpdateDyeingOrder();
  const { data: suppliers = [] } = useDyeingSuppliers();
  const { data: availableRolls = [] } = useAvailableRawRolls();
  const { data: colors = [] } = useColors();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    trigger,
    formState: { errors },
  } = useForm<DyeingOrderFormValues>({
    resolver: zodResolver(dyeingOrderSchema),
    defaultValues: dyeingOrderDefaults,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const watchItems = watch('items');
  const totalWeight = sumBy(watchItems, (it) => it.weight_kg || 0);

  // Initialize form
  useEffect(() => {
    if (editingOrder) {
      reset({
        dyeing_order_number: editingOrder.dyeing_order_number,
        supplier_id: editingOrder.supplier_id,
        order_date: editingOrder.order_date,
        expected_return_date: editingOrder.expected_return_date || '',
        unit_price_per_kg: editingOrder.unit_price_per_kg,
        work_order_id: editingOrder.work_order_id || '',
        notes: editingOrder.notes || '',
        items: editingOrder.dyeing_order_items?.map((it) => ({
          raw_fabric_roll_id: it.raw_fabric_roll_id,
          weight_kg: it.weight_kg,
          length_m: it.length_m || 0,
          color_name: it.color_name,
          color_code: it.color_code || '',
          notes: it.notes || '',
        })) || [{ ...emptyDyeingOrderItem }],
      });
    } else {
      reset(dyeingOrderDefaults);
    }
  }, [editingOrder, reset, isEdit]);

  const onSubmit = (values: DyeingOrderFormValues) => {
    if (isEdit && editingOrder) {
      updateMutation.mutate(
        {
          id: editingOrder.id,
          values,
          expectedUpdatedAt: editingOrder.updated_at ?? undefined,
        },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(values, { onSuccess: onClose });
    }
  };

  const stepper = useStepper({
    totalSteps: 3,
    stepValidation: {
      0: () =>
        trigger([
          'supplier_id',
          'order_date',
          'expected_return_date',
          'unit_price_per_kg',
        ]),
      1: () => trigger(['items']),
    },
    onCancel: onClose,
  });

  const { unselectedRolls, lotSummary, addLot, validate } = useRollSelection(
    availableRolls,
    watchItems,
    setValue,
  );

  const handleFinalSubmit = (values: DyeingOrderFormValues) => {
    if (!stepper.isLast) return;
    if (!validate()) return;
    onSubmit(values);
  };

  const supplierOptions = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code || undefined,
  }));

  const colorOptions = colors.map((c) => ({
    code: c.code,
    name: c.name,
  }));

  const lotOptions = useMemo(() => {
    return Object.entries(lotSummary)
      .filter(([_, summary]) => !summary.disabled)
      .map(([lot, summary]) => ({
        id: lot,
        name: MSG.LBL_LOT_SUMMARY(
          lot,
          summary.remaining,
          summary.remainingWeight,
        ),
      }));
  }, [lotSummary]);

  const [selectedLot, setSelectedLot] = useState<string>('');

  const itemsErrorMessage =
    errors.items?.root?.message ||
    (errors.items as unknown as { message?: string })?.message;

  return (
    <AdaptiveSheet
      open={isOpen}
      onClose={onClose}
      title={isEdit ? MSG.FORM_TITLE_EDIT : MSG.FORM_TITLE_CREATE}
      stepInfo={{ current: stepper.currentStep, total: stepper.totalSteps }}
      footer={
        <StepperFooter
          stepper={stepper}
          onCancel={onClose}
          isPending={createMutation.isPending || updateMutation.isPending}
          submitLabel={isEdit ? MSG.BTN_SUBMIT_EDIT : MSG.BTN_SUBMIT_CREATE}
          formId="dyeing-order-form"
        />
      }
    >
      <form
        id="dyeing-order-form"
        className="flex flex-col gap-6"
        onSubmit={handleSubmit(handleFinalSubmit)}
        onKeyDown={stepper.handleKeyDown}
      >
        {/* Basic Info */}
        <section
          className={`bg-surface p-4 rounded-xl border border-border ${stepper.currentStep === 0 ? 'block' : 'hidden'}`}
        >
          <h4 className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider text-muted">
            <Icon name="Info" size={16} /> {MSG.SECTION_BASIC_INFO}
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                {MSG.LBL_ORDER_NUMBER}
              </label>
              {isEdit ? (
                <input
                  {...register('dyeing_order_number')}
                  className="field-input font-bold text-primary"
                  readOnly
                />
              ) : (
                <input
                  className="field-input text-muted italic"
                  value={MSG.LBL_AUTO}
                  readOnly
                  disabled
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                {MSG.LBL_SUPPLIER}
              </label>
              <VPEntityPicker
                options={supplierOptions}
                value={watch('supplier_id')}
                onChange={(val) => setValue('supplier_id', val)}
                placeholder={MSG.PLACEHOLDER_SUPPLIER}
                variant="standard"
              />
              {errors.supplier_id && (
                <span className="text-[10px] text-danger mt-1">
                  {errors.supplier_id.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                {MSG.LBL_ORDER_DATE}
              </label>
              <input
                type="date"
                {...register('order_date')}
                className="field-input"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                {MSG.LBL_RETURN_DATE}
              </label>
              <input
                type="date"
                {...register('expected_return_date')}
                className="field-input"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                {MSG.LBL_UNIT_PRICE}
              </label>
              <Controller
                name="unit_price_per_kg"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    className="field-input tabular-nums font-bold"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>
          </div>
        </section>

        {/* Items Section */}
        <section
          className={`bg-surface p-4 rounded-xl border border-border ${stepper.currentStep === 1 ? 'block' : 'hidden'}`}
        >
          <div className="flex justify-between items-center mb-4">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
              <Icon name="Layers" size={16} /> {MSG.SECTION_ITEMS} (
              {fields.length})
            </h4>
            <button
              type="button"
              className="btn-secondary py-1.5 text-xs"
              onClick={() => append({ ...emptyDyeingOrderItem })}
            >
              <Icon name="Plus" size={16} /> {MSG.BTN_ADD_ITEM}
            </button>
          </div>

          {itemsErrorMessage && (
            <div className="mb-4 p-3 bg-danger-soft text-danger text-sm rounded-lg flex items-center gap-2">
              <Icon name="AlertTriangle" size={16} />
              {itemsErrorMessage}
            </div>
          )}

          {/* Bulk select by lot */}
          {lotOptions.length > 0 && (
            <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/15">
              <label className="text-[10px] font-bold text-muted uppercase block mb-2">
                {MSG.LBL_BATCH_IMPORT}
              </label>
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <div className="w-full sm:flex-1">
                  <VPVirtualCombobox<{ id: string; name: string }>
                    options={lotOptions}
                    value={selectedLot}
                    onChange={(val) => setSelectedLot(val)}
                    getOptionValue={(opt) => opt.id}
                    getOptionLabel={(opt) => opt.name}
                    placeholder={MSG.PLACEHOLDER_BATCH}
                  />
                </div>
                <Button
                  variant="primary"
                  className="w-full sm:w-auto py-2 px-3 text-xs whitespace-nowrap flex items-center justify-center gap-1"
                  disabled={!selectedLot}
                  onClick={() => {
                    addLot(selectedLot, (r) => ({
                      ...emptyDyeingOrderItem,
                      raw_fabric_roll_id: r.id,
                      weight_kg: r.weight_kg ?? 0,
                      length_m: r.length_m ?? 0,
                    }));
                    setSelectedLot('');
                  }}
                >
                  <Icon name="PackagePlus" size={16} />
                  {selectedLot && lotSummary[selectedLot]
                    ? MSG.BTN_ADD_ROLLS.replace(
                        '{count}',
                        String(lotSummary[selectedLot].remaining),
                      )
                    : MSG.BTN_ADD}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="p-3 bg-surface-strong rounded-lg border border-border relative"
              >
                <button
                  type="button"
                  className="absolute top-2 right-2 text-muted hover:text-danger"
                  onClick={() => remove(index)}
                >
                  <Icon name="X" size={16} />
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted uppercase block mb-1">
                      {MSG.LBL_RAW_ROLL}
                    </label>
                    <RollSelectionDropdown
                      value={watch(`items.${index}.raw_fabric_roll_id`)}
                      onChange={(val) => {
                        setValue(`items.${index}.raw_fabric_roll_id`, val);
                        const roll = availableRolls.find((r) => r.id === val);
                        if (roll) {
                          setValue(
                            `items.${index}.weight_kg`,
                            roll.weight_kg || 0,
                          );
                          setValue(
                            `items.${index}.length_m`,
                            roll.length_m || 0,
                          );
                        }
                      }}
                      unselectedRolls={unselectedRolls}
                      availableRolls={availableRolls}
                      error={errors.items?.[index]?.raw_fabric_roll_id?.message}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted uppercase">
                      {MSG.LBL_TARGET_COLOR}
                    </label>
                    <VPVirtualCombobox<{ code: string; name: string }>
                      options={colorOptions}
                      value={watch(`items.${index}.color_code`) || ''}
                      onChange={(val) => {
                        setValue(`items.${index}.color_code`, val);
                        const selectedColor = colors.find(
                          (c) => c.code === val,
                        );
                        if (selectedColor) {
                          setValue(
                            `items.${index}.color_name`,
                            selectedColor.name,
                          );
                        } else {
                          setValue(`items.${index}.color_name`, '');
                        }
                      }}
                      getOptionValue={(opt) => opt.code}
                      getOptionLabel={(opt) => opt.name}
                      placeholder={MSG.PLACEHOLDER_TARGET_COLOR}
                      hasError={
                        !!errors.items?.[index]?.color_name ||
                        !!errors.items?.[index]?.color_code
                      }
                    />
                    {errors.items?.[index]?.color_name && (
                      <span className="text-[10px] text-danger mt-1">
                        {errors.items[index]?.color_name?.message}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Controller
                      name={`items.${index}.weight_kg`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-col">
                          <WeightInput
                            step="0.01"
                            className="field-input h-10 tabular-nums"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                          {errors.items?.[index]?.weight_kg && (
                            <span className="text-[10px] text-danger mt-1">
                              {errors.items[index]?.weight_kg?.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                    <Controller
                      name={`items.${index}.length_m`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex flex-col">
                          <LengthInput
                            step="0.1"
                            className="field-input h-10 tabular-nums"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          />
                          {errors.items?.[index]?.length_m && (
                            <span className="text-[10px] text-danger mt-1">
                              {errors.items[index]?.length_m?.message}
                            </span>
                          )}
                        </div>
                      )}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted uppercase">
                      {MSG.LBL_ITEM_NOTE}
                    </label>
                    <input
                      {...register(`items.${index}.notes`)}
                      className="field-input h-10"
                      placeholder="..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Summary */}
          <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/10 flex justify-between items-center">
            <span className="text-sm font-bold text-muted italic">
              {MSG.LBL_TOTAL_WEIGHT}
            </span>
            <span className="text-xl font-extrabold text-primary tabular-nums">
              {totalWeight.toFixed(2)} kg
            </span>
          </div>
        </section>

        {/* Global Notes */}
        <section
          className={`bg-surface p-4 rounded-xl border border-border ${stepper.currentStep === 2 ? 'block' : 'hidden'}`}
        >
          <label className="text-xs font-bold text-muted uppercase block mb-2">
            {MSG.LBL_GLOBAL_NOTE}
          </label>
          <textarea
            {...register('notes')}
            className="field-input min-h-[80px]"
            placeholder={MSG.PLACEHOLDER_GLOBAL_NOTE}
          />
        </section>
      </form>
    </AdaptiveSheet>
  );
}
