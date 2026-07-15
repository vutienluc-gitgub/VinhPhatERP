import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { AdaptiveSheet, Button, Icon } from '@/shared/components';
import {
  inventoryAdjustmentSchema,
  type InventoryAdjustmentFormValues,
} from '@/schema/inventory.schema';
import { useAdjustInventory } from '@/application/inventory';
import { INVENTORY_MESSAGES } from '@/features/inventory/inventory.constants';

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
      title={INVENTORY_MESSAGES.MODAL_ADJUSTMENT_TITLE}
      maxWidth="600px"
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <Button type="button" variant="ghost" onClick={onClose}>
            {INVENTORY_MESSAGES.BTN_CANCEL}
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
            {INVENTORY_MESSAGES.BTN_SAVE}
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
            <label className="text-sm font-medium">
              {INVENTORY_MESSAGES.LBL_ITEM_TYPE}
            </label>
            <select
              {...form.register('itemType')}
              className="w-full input-field"
            >
              <option value="raw_fabric">
                {INVENTORY_MESSAGES.OPT_RAW_FABRIC}
              </option>
              <option value="finished_fabric">
                {INVENTORY_MESSAGES.OPT_FINISHED_FABRIC}
              </option>
              <option value="yarn">{INVENTORY_MESSAGES.OPT_YARN}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              {INVENTORY_MESSAGES.LBL_ITEM_ID}
            </label>
            <input
              {...form.register('referenceId')}
              className="w-full input-field"
              placeholder="UUID"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {INVENTORY_MESSAGES.LBL_ADJUST_REASON}
          </label>
          <select
            {...form.register('adjustmentType')}
            className="w-full input-field"
          >
            <option value="PHYSICAL_COUNT">
              {INVENTORY_MESSAGES.OPT_REASON_PHYSICAL_COUNT}
            </option>
            <option value="DAMAGE">
              {INVENTORY_MESSAGES.OPT_REASON_DAMAGE}
            </option>
            <option value="QUALITY_REJECTION">
              {INVENTORY_MESSAGES.OPT_REASON_QUALITY_REJECTION}
            </option>
            <option value="SAMPLE_USAGE">
              {INVENTORY_MESSAGES.OPT_REASON_SAMPLE_USAGE}
            </option>
            <option value="PRODUCTION_CONSUMPTION">
              {INVENTORY_MESSAGES.OPT_REASON_PRODUCTION_CONSUMPTION}
            </option>
            <option value="SYSTEM_CORRECTION">
              {INVENTORY_MESSAGES.REASON_SYSTEM_CORRECTION}
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            {INVENTORY_MESSAGES.LBL_ADJUST_TYPE}
          </label>
          <select {...form.register('mode')} className="w-full input-field">
            <option value="quick">{INVENTORY_MESSAGES.OPT_TYPE_QUICK}</option>
            <option value="physical">
              {INVENTORY_MESSAGES.OPT_TYPE_PHYSICAL}
            </option>
          </select>
        </div>

        {mode === 'physical' ? (
          <div className="grid grid-cols-2 gap-4 bg-surface-subtle p-3 rounded">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {INVENTORY_MESSAGES.LBL_SYS_STOCK}
              </label>
              <input
                type="number"
                step="0.01"
                {...form.register('systemQty', { valueAsNumber: true })}
                className="w-full input-field"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {INVENTORY_MESSAGES.LBL_ACTUAL_STOCK}
              </label>
              <input
                type="number"
                step="0.01"
                {...form.register('actualQty', { valueAsNumber: true })}
                className="w-full input-field"
              />
            </div>
            <div className="col-span-2 text-right">
              <span className="text-xs text-muted">
                {INVENTORY_MESSAGES.LBL_DIFF}{' '}
              </span>
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
              {INVENTORY_MESSAGES.LBL_ADJUST_QTY}
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
          <label className="text-sm font-medium">
            {INVENTORY_MESSAGES.LBL_NOTES}
          </label>
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
