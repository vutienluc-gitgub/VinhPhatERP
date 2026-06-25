import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AdaptiveSheet, Button, Icon } from '@/shared/components';
import {
  inventoryAdjustmentSchema,
  type InventoryAdjustmentFormValues,
} from '@/schema/inventory.schema';
import { useAdjustInventory } from '@/application/inventory';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function InventoryAdjustmentModal({ isOpen, onClose }: Props) {
  const { mutateAsync: adjustInventory, isPending } = useAdjustInventory();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<InventoryAdjustmentFormValues>({
    resolver: zodResolver(inventoryAdjustmentSchema),
    defaultValues: {
      adjustmentDate: new Date().toISOString().slice(0, 10),
      itemType: 'raw_fabric',
      referenceId: '',
      adjustmentType: 'PHYSICAL_COUNT',
      mode: 'quick',
      systemQty: 0,
      actualQty: 0,
      adjustmentQty: 0,
      reason: '',
      notes: '',
    },
  });

  const mode = form.watch('mode');

  // Auto-calculate adjustmentQty based on mode
  form.watch((_, { name }) => {
    if (name === 'mode' || name === 'systemQty' || name === 'actualQty') {
      const { mode, systemQty, actualQty } = form.getValues();
      if (mode === 'physical') {
        const sys = Number(systemQty) || 0;
        const act = Number(actualQty) || 0;
        form.setValue('adjustmentQty', act - sys, { shouldValidate: true });
      }
    }
  });

  async function onSubmit(data: InventoryAdjustmentFormValues) {
    try {
      setError(null);
      await adjustInventory({
        itemType: data.itemType,
        itemId: data.referenceId,
        adjustmentType: data.adjustmentType,
        adjustmentQty: data.adjustmentQty,
        reason: data.reason,
        notes: data.notes,
      });
      form.reset();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  }

  return (
    <AdaptiveSheet
      open={isOpen}
      onClose={onClose}
      title="Điều chỉnh tồn kho"
      maxWidth="600px"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isPending}
            form="adj-form"
          >
            {isPending && (
              <Icon name="Loader2" className="animate-spin mr-2" size={16} />
            )}
            Xác nhận
          </Button>
        </div>
      }
    >
      <form
        id="adj-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 pt-4"
      >
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded text-sm mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Loại hàng (*)</label>
            <select
              {...form.register('itemType')}
              className="w-full input-field"
            >
              <option value="raw_fabric">Vải mộc</option>
              <option value="finished_fabric">Vải thành phẩm</option>
              <option value="yarn">Sợi</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mã cuộn / lô (ID) (*)</label>
            <input
              {...form.register('referenceId')}
              className="w-full input-field"
              placeholder="UUID"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Lý do điều chỉnh (*)</label>
          <select
            {...form.register('adjustmentType')}
            className="w-full input-field"
          >
            <option value="PHYSICAL_COUNT">Kiểm kê thực tế</option>
            <option value="DAMAGE">Hàng hỏng / Rách</option>
            <option value="QUALITY_REJECTION">Lỗi chất lượng</option>
            <option value="SAMPLE_USAGE">Cắt mẫu</option>
            <option value="PRODUCTION_CONSUMPTION">Tiêu hao sản xuất</option>
            <option value="SYSTEM_CORRECTION">
              Điều chỉnh sai sót hệ thống
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Hình thức (*)</label>
          <select {...form.register('mode')} className="w-full input-field">
            <option value="quick">Điều chỉnh nhanh (+ / -)</option>
            <option value="physical">Kiểm đếm vật lý (Actual vs System)</option>
          </select>
        </div>

        {mode === 'physical' ? (
          <div className="grid grid-cols-2 gap-4 bg-surface-subtle p-3 rounded">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tồn hệ thống</label>
              <input
                type="number"
                step="0.01"
                {...form.register('systemQty', { valueAsNumber: true })}
                className="w-full input-field"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tồn thực tế</label>
              <input
                type="number"
                step="0.01"
                {...form.register('actualQty', { valueAsNumber: true })}
                className="w-full input-field"
              />
            </div>
            <div className="col-span-2 text-right">
              <span className="text-xs text-muted">Chênh lệch: </span>
              <span
                className={`font-bold ${form.watch('adjustmentQty') > 0 ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {form.watch('adjustmentQty') > 0 ? '+' : ''}
                {form.watch('adjustmentQty')}
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Số lượng điều chỉnh (*)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                {...form.register('adjustmentQty', { valueAsNumber: true })}
                className="w-full input-field pr-12"
                placeholder="-5 hoặc +10"
              />
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Diễn giải / Ghi chú (*)</label>
          <input
            {...form.register('reason')}
            className="w-full input-field"
            placeholder="Mô tả chi tiết..."
          />
        </div>
      </form>
    </AdaptiveSheet>
  );
}
