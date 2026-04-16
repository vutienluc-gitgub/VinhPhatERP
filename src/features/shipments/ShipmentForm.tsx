import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
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
import {
  shipmentsDefaultValues,
  shipmentsSchema,
  type ShipmentsFormValues,
} from '@/schema/shipment.schema';

import { ShipmentRollPicker, type AvailableRoll } from './ShipmentRollPicker';

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
      totalWeight: selected.reduce((sum, r) => sum + (r.weight_kg ?? 0), 0),
      totalLength: selected.reduce((sum, r) => sum + (r.length_m ?? 0), 0),
      rolls: selected,
    };
  }, [availableRolls, selectedRollIds]);

  // Sync selected rolls → form items
  useEffect(() => {
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
  }, [selectedRollsSummary.rolls, setValue]);

  // Auto-compute shipping cost when rate or items change
  useEffect(() => {
    if (!watchedRateId) return;
    const rate = shippingRateById.get(watchedRateId);
    const totalMeters = selectedRollsSummary.totalLength;
    const { shippingCost, loadingFee } = computeShippingCost(rate, totalMeters);
    setValue('shippingCost', shippingCost);
    setValue('loadingFee', loadingFee);
  }, [
    watchedRateId,
    selectedRollsSummary.totalLength,
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
    if (selectedRollIds.size === 0) {
      toast.error('Vui lòng chọn ít nhất một cuộn vải để xuất.');
      return;
    }

    try {
      await createMutation.mutateAsync(values);
      toast.success('Tạo phiếu xuất thành công');
      reset();
      setSelectedRollIds(new Set());
      onClose();
    } catch {
      toast.error('Có lỗi xảy ra khi tạo phiếu xuất');
    }
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={`Tạo phiếu xuất — ${orderNumber}`}
    >
      <form id="shipment-form" onSubmit={handleSubmit(onSubmit)}>
        {createMutation.error && (
          <p className="error-inline" style={{ marginBottom: '1rem' }}>
            Lỗi: {(createMutation.error as Error).message}
          </p>
        )}

        <div className="form-grid">
          {/* Shipment number + date */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>Số phiếu xuất</label>
              <input
                className="field-input"
                value="Tự động"
                readOnly
                disabled
                style={{
                  background: 'var(--surface-disabled)',
                  color: 'var(--text-tertiary)',
                  fontStyle: 'italic',
                }}
              />
            </div>
            <div className="form-field">
              <label>
                Ngày giao <span className="field-required">*</span>
              </label>
              <input
                className={`field-input${errors.shipmentDate ? ' is-error' : ''}`}
                type="date"
                {...register('shipmentDate')}
              />
              {errors.shipmentDate && (
                <p className="field-error">{errors.shipmentDate.message}</p>
              )}
            </div>
          </div>

          {/* Employee & Delivery address */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>Nhân viên kho</label>
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
                      placeholder="— Kho xuất —"
                    />
                  );
                }}
              />
            </div>
            <div className="form-field">
              <label>Địa chỉ giao</label>
              <input
                className="field-input"
                {...register('deliveryAddress')}
                placeholder="Địa chỉ giao hàng..."
              />
            </div>
          </div>

          {/* Delivery staff + vehicle */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>Nhân viên giao hàng</label>
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
                      placeholder="— Chưa phân công —"
                    />
                  );
                }}
              />
            </div>
            <div className="form-field">
              <label>Biển số xe</label>
              <input
                className="field-input"
                {...register('vehicleInfo')}
                placeholder="VD: 51C-12345"
              />
            </div>
          </div>

          {/* Shipping rate + cost */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>Bảng giá cước</label>
              <Controller
                name="shippingRateId"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={shippingRates.map((rate) => ({
                      value: rate.id,
                      label: `${rate.name} — ${rate.destination_area}`,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="— Không áp dụng —"
                  />
                )}
              />
            </div>
            <div className="form-field">
              <label>Chi phí vận chuyển (VNĐ)</label>
              <input
                className="field-input"
                type="number"
                {...register('shippingCost', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          {/* Loading fee */}
          <div
            className="form-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            }}
          >
            <div className="form-field">
              <label>Phí bốc xếp (VNĐ)</label>
              <input
                className="field-input"
                type="number"
                {...register('loadingFee', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
            <div />
          </div>

          {/* ─── Roll Picker Grid ─── */}
          <div className="form-field">
            <label
              style={{
                margin: 0,
                marginBottom: '0.5rem',
              }}
            >
              Chọn cuộn xuất kho <span className="field-required">*</span>
            </label>

            <ShipmentRollPicker
              availableRolls={availableRolls}
              selectedRollIds={selectedRollIds}
              onToggleRoll={handleToggleRoll}
            />

            {/* Selection summary */}
            {selectedRollsSummary.count > 0 && (
              <div
                style={{
                  marginTop: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius)',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#065f46',
                  }}
                >
                  ✓ {selectedRollsSummary.count} cuộn đã chọn
                </span>
                <span
                  style={{
                    fontSize: '0.85rem',
                    color: '#047857',
                  }}
                >
                  Tổng: {selectedRollsSummary.totalWeight.toFixed(1)} kg
                  {selectedRollsSummary.totalLength > 0 &&
                    ` • ${selectedRollsSummary.totalLength.toFixed(1)} m`}
                </span>
              </div>
            )}

            {errors.items?.root && (
              <p className="field-error">{errors.items.root.message}</p>
            )}
          </div>
        </div>
        <div
          className="modal-footer"
          style={{
            marginTop: '1.5rem',
            padding: 0,
            border: 'none',
          }}
        >
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSubmitting || createMutation.isPending}
          >
            Hủy
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={
              isSubmitting ||
              createMutation.isPending ||
              selectedRollIds.size === 0
            }
          >
            {createMutation.isPending
              ? 'Đang lưu...'
              : `Tạo phiếu xuất (${selectedRollIds.size} cuộn)`}
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
