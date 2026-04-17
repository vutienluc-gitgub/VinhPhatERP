import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  AdaptiveSheet,
  Icon,
  Combobox,
  CancelButton,
  Button,
} from '@/shared/components';
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
  const { data: suppliers = [] } = useDyeingSuppliers();
  const { data: availableRolls = [] } = useAvailableRawRolls();

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
    }
  }, [editingOrder, reset, isEdit]);

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

  // Danh sach lo vai moc doc lap (lot_number != null)
  const lotOptions = useMemo(() => {
    const lots = new Map<string, { count: number; totalKg: number }>();
    for (const r of availableRolls) {
      const lot = r.lot_number as string | null;
      if (!lot) continue;
      const existing = lots.get(lot);
      if (existing) {
        existing.count += 1;
        existing.totalKg += r.weight_kg ?? 0;
      } else {
        lots.set(lot, {
          count: 1,
          totalKg: r.weight_kg ?? 0,
        });
      }
    }
    return Array.from(lots.entries()).map(([lot, info]) => ({
      value: lot,
      label: `Lô ${lot} — ${info.count} cuộn, ${info.totalKg.toFixed(1)} kg`,
    }));
  }, [availableRolls]);

  const [selectedLot, setSelectedLot] = useState<string>('');

  return (
    <AdaptiveSheet
      open={isOpen}
      onClose={onClose}
      title={isEdit ? 'Sửa lệnh nhuộm' : 'Tạo lệnh nhuộm mới'}
      footer={
        <div className="flex justify-end gap-2 w-full">
          <CancelButton onClick={onClose} label="Hủy" />
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Đang lưu...'
              : isEdit
                ? 'Cập nhật'
                : 'Tạo lệnh nhuộm'}
          </Button>
        </div>
      }
    >
      <form className="flex flex-col gap-6">
        {/* Basic Info */}
        <section className="bg-surface p-4 rounded-xl border border-border">
          <h4 className="flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-wider text-muted">
            <Icon name="Info" size={16} /> Thông tin chung
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                Mã lệnh
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
                  value="Tự động"
                  readOnly
                  disabled
                />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                Nhà nhuộm
              </label>
              <Combobox
                options={supplierOptions}
                value={watch('supplier_id')}
                onChange={(val) => setValue('supplier_id', val)}
                placeholder="Chọn nhà nhuộm..."
              />
              {errors.supplier_id && (
                <span className="text-[10px] text-danger mt-1">
                  {errors.supplier_id.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                Ngày gởi
              </label>
              <input
                type="date"
                {...register('order_date')}
                className="field-input"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                Hẹn trả hàng
              </label>
              <input
                type="date"
                {...register('expected_return_date')}
                className="field-input"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-muted uppercase">
                Đơn giá (đ/kg)
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
              <Icon name="Layers" size={16} /> Danh sách cây vải (
              {fields.length})
            </h4>
            <button
              type="button"
              className="btn-secondary py-1.5 text-xs"
              onClick={() => append({ ...emptyDyeingOrderItem })}
            >
              <Icon name="Plus" size={16} /> Thêm cây vải
            </button>
          </div>

          {/* Bulk select by lot */}
          {lotOptions.length > 0 && (
            <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/15">
              <label className="text-[10px] font-bold text-muted uppercase block mb-2">
                Nhập theo lô vải mộc
              </label>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <Combobox
                    options={lotOptions}
                    value={selectedLot}
                    onChange={(val) => setSelectedLot(val)}
                    placeholder="Chọn lô — tự động thêm toàn bộ cuộn..."
                  />
                </div>
                <button
                  type="button"
                  className="btn-primary py-2 px-3 text-xs whitespace-nowrap flex items-center gap-1"
                  disabled={!selectedLot}
                  onClick={() => {
                    const rolls = availableRolls.filter(
                      (r) => (r.lot_number as string | null) === selectedLot,
                    );
                    for (const r of rolls) {
                      append({
                        ...emptyDyeingOrderItem,
                        raw_fabric_roll_id: r.id,
                        weight_kg: r.weight_kg ?? 0,
                        length_m: r.length_m ?? 0,
                      });
                    }
                    setSelectedLot('');
                  }}
                >
                  <Icon name="PackagePlus" size={16} />
                  {selectedLot
                    ? `Thêm ${availableRolls.filter((r) => (r.lot_number as string | null) === selectedLot).length} cuộn`
                    : 'Thêm'}
                </button>
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
                    <label className="text-[10px] font-bold text-muted uppercase">
                      Cây vải mộc
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
                      placeholder="Chọn cây vải..."
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-muted uppercase">
                      Màu nhuộm mục tiêu
                    </label>
                    <input
                      {...register(`items.${index}.color_name`)}
                      className="field-input h-10"
                      placeholder="Tên màu..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-muted uppercase">
                        Trọng lượng (kg)
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
                        Chiều dài (m)
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
                      Ghi chú item
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
              Tổng trọng lượng:
            </span>
            <span className="text-xl font-extrabold text-primary tabular-nums">
              {totalWeight.toFixed(2)} kg
            </span>
          </div>
        </section>

        {/* Global Notes */}
        <section className="bg-surface p-4 rounded-xl border border-border">
          <label className="text-xs font-bold text-muted uppercase block mb-2">
            Ghi chú chung
          </label>
          <textarea
            {...register('notes')}
            className="field-input min-h-[80px]"
            placeholder="Nội dung ghi chú nếu có..."
          />
        </section>
      </form>
    </AdaptiveSheet>
  );
}
