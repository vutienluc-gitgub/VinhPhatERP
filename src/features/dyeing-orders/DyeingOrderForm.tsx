import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';

import { AdaptiveSheet, Icon, Combobox } from '@/shared/components';
import { fetchRawFabricAll } from '@/api/raw-fabric.api';
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
  useNextDyeingOrderNumber,
} from './useDyeingOrders';
import type { DyeingOrder } from './types';

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
  const { data: nextNumber } = useNextDyeingOrderNumber();
  const { data: suppliers = [] } = useDyeingSuppliers();
  const { data: availableRolls = [] } = useQuery({
    queryKey: ['raw-fabric', 'available'],
    queryFn: () => fetchRawFabricAll({ status: 'in_stock' }),
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
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
  const totalWeight = watchItems.reduce((s, it) => s + (it.weight_kg || 0), 0);

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
      if (nextNumber && !isEdit) {
        setValue('dyeing_order_number', nextNumber);
      }
    }
  }, [editingOrder, nextNumber, reset, setValue, isEdit]);

  const onSubmit = (values: DyeingOrderFormValues) => {
    if (isEdit && editingOrder) {
      updateMutation.mutate(
        {
          id: editingOrder.id,
          values,
        },
        { onSuccess: onClose },
      );
    } else {
      createMutation.mutate(values, { onSuccess: onClose });
    }
  };

  const supplierOptions = suppliers.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.code})`,
  }));

  const rollOptions = availableRolls.map((r) => ({
    value: r.id,
    label: `${r.roll_number} - ${r.fabric_type} (${r.weight_kg}kg)`,
    roll: r,
  }));

  return (
    <AdaptiveSheet
      open={isOpen}
      onClose={onClose}
      title={isEdit ? 'Sua lenh nhuom' : 'Tao lenh nhuom moi'}
      footer={
        <div className="flex justify-end gap-2 w-full">
          <button className="btn-secondary" onClick={onClose} type="button">
            Huy
          </button>
          <button
            className="btn-primary"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Dang luu...'
              : isEdit
                ? 'Cap nhat'
                : 'Tao lenh nhuom'}
          </button>
        </div>
      }
    >
      <form className="flex flex-col gap-6">
        {/* Basic Info */}
        <section className="bg-surface p-4 rounded-xl border border-border">
          <h4 className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider text-muted">
            <Icon name="Info" size={16} /> Thong tin chung
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                Ma lenh
              </label>
              <input
                {...register('dyeing_order_number')}
                className="field-input font-bold text-primary"
                placeholder="VD: DN2404-001"
              />
              {errors.dyeing_order_number && (
                <span className="text-[10px] text-danger mt-1">
                  {errors.dyeing_order_number.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                Nha nhuom
              </label>
              <Combobox
                options={supplierOptions}
                value={watch('supplier_id')}
                onChange={(val) => setValue('supplier_id', val)}
                placeholder="Chon nha nhuom..."
              />
              {errors.supplier_id && (
                <span className="text-[10px] text-danger mt-1">
                  {errors.supplier_id.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                Ngay gui
              </label>
              <input
                type="date"
                {...register('order_date')}
                className="field-input"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                Hen tra hang
              </label>
              <input
                type="date"
                {...register('expected_return_date')}
                className="field-input"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                Don gia (d/kg)
              </label>
              <input
                type="number"
                {...register('unit_price_per_kg', { valueAsNumber: true })}
                className="field-input tabular-nums font-bold"
              />
            </div>
          </div>
        </section>

        {/* Items Section */}
        <section className="bg-surface p-4 rounded-xl border border-border">
          <div className="flex justify-between items-center mb-4">
            <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted">
              <Icon name="Layers" size={16} /> Danh sach cay vai (
              {fields.length})
            </h4>
            <button
              type="button"
              className="btn-secondary py-1.5 text-xs"
              onClick={() => append({ ...emptyDyeingOrderItem })}
            >
              <Icon name="Plus" size={14} /> Them cay vai
            </button>
          </div>

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
                    <label className="text-[10px] font-bold text-muted uppercase">
                      Cay vai moc
                    </label>
                    <Combobox
                      options={rollOptions}
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
                      placeholder="Chon cay vai..."
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted uppercase">
                      Mau nhuộm muc tieu
                    </label>
                    <input
                      {...register(`items.${index}.color_name`)}
                      className="field-input h-10"
                      placeholder="Ten mau..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-muted uppercase">
                        Trong luong (kg)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register(`items.${index}.weight_kg`, {
                          valueAsNumber: true,
                        })}
                        className="field-input h-10 tabular-nums"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-muted uppercase">
                        Chieu dai (m)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        {...register(`items.${index}.length_m`, {
                          valueAsNumber: true,
                        })}
                        className="field-input h-10 tabular-nums"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted uppercase">
                      Ghi chu item
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
              Tong trong luong:
            </span>
            <span className="text-xl font-extrabold text-primary tabular-nums">
              {totalWeight.toFixed(2)} kg
            </span>
          </div>
        </section>

        {/* Global Notes */}
        <section className="bg-surface p-4 rounded-xl border border-border">
          <label className="text-xs font-bold text-muted uppercase block mb-2">
            Ghi chu chung
          </label>
          <textarea
            {...register('notes')}
            className="field-input min-h-[80px]"
            placeholder="Noi dung ghi chu neu co..."
          />
        </section>
      </form>
    </AdaptiveSheet>
  );
}
