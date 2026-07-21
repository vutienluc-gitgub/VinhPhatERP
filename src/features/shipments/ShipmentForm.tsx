import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import { MoneyInput } from '@/shared/value';
import type { ShippingRate } from '@/shared/hooks/useShippingRateOptions';
import { useActiveShippingRates } from '@/shared/hooks/useShippingRateOptions';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { useEmployees } from '@/shared/hooks/useEmployeeOptions';
import {
  useAvailableFinishedRolls,
  useCreateShipment,
  useDeliveryStaffList,
} from '@/application/shipments';
import { useOrder } from '@/application/orders';
import { Badge } from '@/shared/components/Badge';
import {
  shipmentsDefaultValues,
  shipmentsSchema,
  type ShipmentsFormValues,
} from '@/schema/shipment.schema';
import { sumBy } from '@/shared/utils/array.util';

import { ShipmentRollPicker, type AvailableRoll } from './ShipmentRollPicker';
import {
  SHIPMENT_FORM_MESSAGES as MSG,
  AD_HOC_SHIPMENT_LABELS as FIELD_MSG,
} from './shipments.constants';

type ShipmentFormProps = {
  orderId: string;
  customerId: string;
  orderNumber: string;
  onClose: () => void;
};

function computeShippingCost(
  rate: ShippingRate | undefined,
  totalMeters: number,
): { shippingCost: number; loadingFee: number } {
  if (!rate)
    return {
      shippingCost: 0,
      loadingFee: 0,
    };

  let cost = 0;
  if (rate.rate_per_trip != null) {
    cost = rate.rate_per_trip;
  } else if (rate.rate_per_meter != null) {
    cost = rate.rate_per_meter * totalMeters;
  }

  const total = cost + (rate.loading_fee ?? 0);
  const finalCost =
    rate.min_charge > 0 ? Math.max(total, rate.min_charge) : total;

  return {
    shippingCost: Math.round(finalCost - (rate.loading_fee ?? 0)),
    loadingFee: rate.loading_fee ?? 0,
  };
}

export function ShipmentForm({
  orderId,
  customerId,
  orderNumber,
  onClose,
}: ShipmentFormProps) {
  const { data: order } = useOrder(orderId);
  const isTrading = order?.order_type === 'trading';

  const { data: availableRolls = [] } = useAvailableFinishedRolls(orderId);
  const { data: shippingRates = [] } = useActiveShippingRates();
  const { data: deliveryStaff = [] } = useDeliveryStaffList();
  const { data: warehouseEmployees = [] } = useEmployees({
    role: 'warehouse',
    status: 'active',
  });
  const createMutation = useCreateShipment();

  // Selected rolls state (Set of roll IDs)
  const [selectedRollIds, setSelectedRollIds] = useState<Set<string>>(
    new Set(),
  );

  const shippingRateById = useMemo(
    () => new Map(shippingRates.map((r) => [r.id, r])),
    [shippingRates],
  );

  const shippingRateOptions = useMemo(
    () =>
      shippingRates.map((rate) => ({
        value: rate.id,
        label: `${rate.name} — ${rate.destination_area}`,
      })),
    [shippingRates],
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShipmentsFormValues>({
    resolver: zodResolver(shipmentsSchema),
    defaultValues: {
      ...shipmentsDefaultValues,
      orderId,
      customerId,
    },
  });

  const watchedRateId = watch('shippingRateId');

  // Compute total from selected rolls
  const selectedRollsSummary = useMemo(() => {
    const selected = availableRolls.filter((r) => selectedRollIds.has(r.id));
    return {
      count: selected.length,
      totalWeight: sumBy(selected, (r) => r.weight_kg ?? 0),
      totalLength: sumBy(selected, (r) => r.length_m ?? 0),
      rolls: selected,
    };
  }, [availableRolls, selectedRollIds]);

  const tradingItemsSummary = useMemo(() => {
    if (!isTrading || !order) return null;
    const items = order.order_items ?? [];
    return {
      count: items.length,
      totalWeight: sumBy(items, (r) =>
        r.unit === 'kg' ? (r.quantity ?? 0) : 0,
      ),
      totalLength: sumBy(items, (r) =>
        r.unit === 'm' ? (r.quantity ?? 0) : 0,
      ),
      items: items,
    };
  }, [isTrading, order]);

  // Sync selected rolls → form items
  useEffect(() => {
    if (isTrading && tradingItemsSummary) {
      const items = tradingItemsSummary.items.map((item) => ({
        finishedRollId: '', // Allow empty for trading orders
        fabricType: item.fabric_type,
        quantity: item.quantity ?? 0,
      }));
      setValue(
        'items',
        items.length > 0
          ? items
          : [{ finishedRollId: '', fabricType: '', quantity: 0 }],
      );
      return;
    }

    const items = selectedRollsSummary.rolls.map((roll) => ({
      finishedRollId: roll.id,
      fabricType: roll.fabric_type,
      quantity: roll.weight_kg || roll.length_m || 0,
    }));

    // Always have at least one empty item if none selected
    if (items.length === 0) {
      setValue('items', [
        {
          finishedRollId: '',
          fabricType: '',
          quantity: 0,
        },
      ]);
    } else {
      setValue('items', items);
    }
  }, [selectedRollsSummary.rolls, setValue, isTrading, tradingItemsSummary]);

  // Auto-compute shipping cost when rate or items change
  useEffect(() => {
    if (!watchedRateId) return;
    const rate = shippingRateById.get(watchedRateId);
    const totalMeters =
      isTrading && tradingItemsSummary
        ? tradingItemsSummary.totalLength
        : selectedRollsSummary.totalLength;
    const { shippingCost, loadingFee } = computeShippingCost(rate, totalMeters);
    setValue('shippingCost', shippingCost);
    setValue('loadingFee', loadingFee);
  }, [
    watchedRateId,
    selectedRollsSummary.totalLength,
    isTrading,
    tradingItemsSummary,
    setValue,
    shippingRateById,
  ]);

  const handleToggleRoll = useCallback((roll: AvailableRoll) => {
    setSelectedRollIds((prev) => {
      const next = new Set(prev);
      if (next.has(roll.id)) {
        next.delete(roll.id);
      } else {
        next.add(roll.id);
      }
      return next;
    });
  }, []);

  async function onSubmit(values: ShipmentsFormValues) {
    if (!isTrading && selectedRollIds.size === 0) {
      toast.error(MSG.SELECT_ROLL_REQUIRED);
      return;
    }

    try {
      await createMutation.mutateAsync(values);
      toast.success(MSG.CREATE_SUCCESS);
      reset();
      setSelectedRollIds(new Set());
      onClose();
    } catch {
      toast.error(MSG.CREATE_ERROR);
    }
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={MSG.TITLE(orderNumber)}
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting || createMutation.isPending}
          >
            {MSG.CANCEL}
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="shipment-form"
            disabled={
              isSubmitting ||
              createMutation.isPending ||
              (!isTrading && selectedRollIds.size === 0) ||
              (isTrading &&
                (!tradingItemsSummary || tradingItemsSummary.count === 0))
            }
          >
            {createMutation.isPending
              ? MSG.SAVING
              : MSG.CREATE_BTN(
                  isTrading
                    ? tradingItemsSummary?.count || 0
                    : selectedRollIds.size,
                  isTrading,
                )}
          </Button>
        </>
      }
    >
      <form id="shipment-form" onSubmit={handleSubmit(onSubmit)}>
        {createMutation.error && (
          <p className="error-inline mb-4">
            {MSG.ERR_TITLE}{' '}
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : String(createMutation.error)}
          </p>
        )}

        <div className="form-grid">
          {/* Shipment number + date */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>{FIELD_MSG.SHIPMENT_NUMBER}</label>
              <input
                className="field-input italic bg-[var(--surface-disabled)] text-[var(--text-tertiary)]"
                value={MSG.AUTO_NUMBER}
                readOnly
                disabled
              />
            </div>
            <div className="form-field">
              <label>
                {FIELD_MSG.SHIPMENT_DATE}{' '}
                <span className="field-required">*</span>
              </label>
              <input
                className={`field-input${errors.shipmentDate ? ' border-danger' : ''}`}
                type="date"
                {...register('shipmentDate')}
              />
              {errors.shipmentDate && (
                <p className="field-error">{errors.shipmentDate.message}</p>
              )}
            </div>
          </div>

          {/* Employee & Delivery address */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>{FIELD_MSG.EMPLOYEE}</label>
              <Controller
                name="employeeId"
                control={control}
                render={({ field }) => {
                  const empOptions = warehouseEmployees.map((emp) => ({
                    value: emp.id,
                    label: emp.name,
                    code: emp.code,
                  }));
                  return (
                    <Combobox
                      options={empOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder={MSG.PLACEHOLDER_WAREHOUSE}
                    />
                  );
                }}
              />
            </div>
            <div className="form-field">
              <label>{FIELD_MSG.DELIVERY_ADDRESS}</label>
              <input
                className="field-input"
                {...register('deliveryAddress')}
                placeholder={MSG.PLACEHOLDER_DELIVERY_ADDR}
              />
            </div>
          </div>

          {/* Delivery staff + vehicle */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>{FIELD_MSG.DELIVERY_STAFF}</label>
              <Controller
                name="deliveryStaffId"
                control={control}
                render={({ field }) => {
                  const staffOptions = deliveryStaff.map((staff) => ({
                    value: staff.id,
                    label: staff.full_name,
                    phone: staff.phone || undefined,
                  }));
                  return (
                    <Combobox
                      options={staffOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder={MSG.PLACEHOLDER_STAFF}
                    />
                  );
                }}
              />
            </div>
            <div className="form-field">
              <label>{FIELD_MSG.VEHICLE_INFO}</label>
              <input
                className="field-input"
                {...register('vehicleInfo')}
                placeholder="VD: 51C-12345"
              />
            </div>
          </div>

          {/* Shipping rate + cost */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>{FIELD_MSG.SHIPPING_RATE}</label>
              <Controller
                name="shippingRateId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={shippingRateOptions}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={MSG.PLACEHOLDER_NO_APPLY}
                  />
                )}
              />
            </div>
            <div className="form-field">
              <label>{FIELD_MSG.SHIPPING_COST}</label>
              <Controller
                name="shippingCost"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    className="field-input"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="0"
                  />
                )}
              />
            </div>
          </div>

          {/* Loading fee */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>{FIELD_MSG.LOADING_FEE}</label>
              <Controller
                name="loadingFee"
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    className="field-input"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="0"
                  />
                )}
              />
            </div>
            <div />
          </div>

          {/* ─── Roll Picker Grid ─── */}
          <div className="form-field">
            <label className="m-0 mb-2 block">
              {isTrading ? MSG.TRADING_ITEM_LABEL : MSG.SELECT_ROLL_LABEL}{' '}
              <span className="field-required">*</span>
            </label>

            {isTrading ? (
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                  <span>{MSG.TRADING_FROM_ORDER}</span>
                  <Badge variant="info">{MSG.TRADING_AUTO_DEDUCT}</Badge>
                </div>
                {tradingItemsSummary?.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <div className="font-semibold text-sm">
                        {item.fabric_type}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.color_name || MSG.COLOR_RAW}
                      </div>
                    </div>
                    <div className="font-medium text-sm text-right">
                      {item.quantity} {item.unit}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ShipmentRollPicker
                availableRolls={availableRolls}
                selectedRollIds={selectedRollIds}
                onToggleRoll={handleToggleRoll}
              />
            )}

            {/* Selection summary */}
            {!isTrading && selectedRollsSummary.count > 0 && (
              <div className="mt-3 px-4 py-3 rounded-[var(--radius)] bg-[#ecfdf5] border border-[#a7f3d0] flex justify-between items-center flex-wrap gap-2">
                <span className="text-[0.85rem] font-semibold text-[#065f46]">
                  {MSG.ROLL_SELECTED(selectedRollsSummary.count)}
                </span>
                <span className="text-[0.85rem] text-[#047857]">
                  {MSG.TOTAL_WEIGHT(
                    selectedRollsSummary.totalWeight.toFixed(1),
                  )}
                  {selectedRollsSummary.totalLength > 0 &&
                    ` • ${selectedRollsSummary.totalLength.toFixed(1)} m`}
                </span>
              </div>
            )}

            {isTrading &&
              tradingItemsSummary &&
              tradingItemsSummary.count > 0 && (
                <div className="mt-3 px-4 py-3 rounded-[var(--radius)] bg-[#ecfdf5] border border-[#a7f3d0] flex justify-between items-center flex-wrap gap-2">
                  <span className="text-[0.85rem] font-semibold text-[#065f46]">
                    {MSG.TOTAL_TRADING(tradingItemsSummary.count)}
                  </span>
                  <span className="text-[0.85rem] text-[#047857]">
                    {tradingItemsSummary.totalWeight > 0 &&
                      `${tradingItemsSummary.totalWeight.toFixed(1)} kg`}
                    {tradingItemsSummary.totalWeight > 0 &&
                      tradingItemsSummary.totalLength > 0 &&
                      ' • '}
                    {tradingItemsSummary.totalLength > 0 &&
                      `${tradingItemsSummary.totalLength.toFixed(1)} m`}
                  </span>
                </div>
              )}

            {errors.items?.root && (
              <p className="field-error">{errors.items.root.message}</p>
            )}
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
