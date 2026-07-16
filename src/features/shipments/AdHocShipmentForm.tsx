import { useMemo, useState } from 'react';
import { Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import { useActiveShippingRates } from '@/shared/hooks/useShippingRateOptions';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import { useEmployees } from '@/shared/hooks/useEmployeeOptions';
import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import {
  useCreateAdHocShipment,
  useDeliveryStaffList,
  useActiveCustomerOptions,
} from '@/application/shipments';
import type { AdHocShipmentFormValues } from '@/schema/shipment.schema';
import { Icon } from '@/shared/components/Icon';

import { useAdHocShipmentForm } from './useAdHocShipmentForm';
import { AdHocShipmentItemsTable } from './AdHocShipmentItemsTable';
import {
  AD_HOC_SHIPMENT_MESSAGES as MESSAGES,
  AD_HOC_SHIPMENT_LABELS as LABELS,
  SHIPMENT_FORM_MESSAGES,
  AD_HOC_PURPOSE_OPTIONS,
} from './shipments.constants';

type AdHocShipmentFormProps = {
  onClose: () => void;
};

export function AdHocShipmentForm({ onClose }: AdHocShipmentFormProps) {
  const { data: customerOptions = [] } = useActiveCustomerOptions();
  const { data: shippingRates = [] } = useActiveShippingRates();
  const { data: deliveryStaff = [] } = useDeliveryStaffList();
  const { data: warehouseEmployees = [] } = useEmployees({
    role: 'warehouse',
    status: 'active',
  });
  const { data: fabricCatalogOptions = [] } = useFabricCatalogOptions();
  const fabricOptions = useMemo(
    () =>
      fabricCatalogOptions.map((f) => ({
        label: f.name,
        value: f.name,
      })),
    [fabricCatalogOptions],
  );
  const createMutation = useCreateAdHocShipment();

  const [shipmentNumber] = useState(SHIPMENT_FORM_MESSAGES.AUTO_NUMBER);

  const {
    form,
    fieldArray,
    itemsSummary,
    isScanning,
    handleItemFieldChange,
    handleAddRow,
    handleRemoveRow,
    handleScanRow,
  } = useAdHocShipmentForm(shippingRates);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const shippingRateOptions = useMemo(
    () =>
      shippingRates.map((rate) => ({
        value: rate.id,
        label: `${rate.name} — ${rate.destination_area}`,
      })),
    [shippingRates],
  );

  const customerComboOptions = useMemo(
    () =>
      customerOptions.map((c) => ({
        value: c.value,
        label: c.label,
        code: c.code,
      })),
    [customerOptions],
  );

  async function onSubmit(values: AdHocShipmentFormValues) {
    try {
      await createMutation.mutateAsync(values);
      toast.success(MESSAGES.SUCCESS);
      reset();
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`${MESSAGES.ERROR}: ${message}`);
    }
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={MESSAGES.TITLE}
      maxWidth="1000px"
      footer={
        <div className="flex w-full justify-end items-center gap-3 border-t border-[var(--border)] pt-4 px-4 bg-[var(--surface)]">
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            {MESSAGES.CANCEL}
          </Button>
          <Button
            type="submit"
            form="adhoc-shipment-form"
            disabled={
              isSubmitting ||
              createMutation.isPending ||
              fieldArray.fields.length === 0
            }
          >
            {createMutation.isPending
              ? MESSAGES.SAVING
              : `${MESSAGES.CREATE} (${itemsSummary.count} ${MESSAGES.SUMMARY_LINES})`}
          </Button>
        </div>
      }
    >
      <form id="adhoc-shipment-form" onSubmit={handleSubmit(onSubmit)}>
        {/* Subtitle */}
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {MESSAGES.SUBTITLE}
        </p>

        {createMutation.error && (
          <p className="error-inline mb-4">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : String(createMutation.error)}
          </p>
        )}

        <div className="space-y-8 pb-8">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Icon name="FileText" className="w-5 h-5 text-indigo-500" />
              {LABELS.SEC_GENERAL}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="form-field">
                <label>{LABELS.SHIPMENT_NUMBER}</label>
                <input
                  className="field-input italic bg-[var(--surface-disabled)] text-[var(--text-tertiary)]"
                  value={shipmentNumber}
                  readOnly
                  disabled
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-field">
                  <label>
                    {LABELS.SHIPMENT_DATE}{' '}
                    <span className="field-required">*</span>
                  </label>
                  <input
                    type="date"
                    className={`field-input ${errors.shipmentDate ? 'border-danger' : ''}`}
                    {...register('shipmentDate')}
                  />
                  {errors.shipmentDate && (
                    <p className="field-error">{errors.shipmentDate.message}</p>
                  )}
                </div>

                <div className="form-field">
                  <label>
                    {LABELS.PURPOSE} <span className="field-required">*</span>
                  </label>
                  <select className="field-input" {...register('purpose')}>
                    {AD_HOC_PURPOSE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.purpose && (
                    <p className="field-error">{errors.purpose.message}</p>
                  )}
                </div>
              </div>

              <div className="form-field">
                <label>
                  {LABELS.CUSTOMER} <span className="field-required">*</span>
                </label>
                <Controller
                  name="customerId"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={customerComboOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder={LABELS.PLC_CUSTOMER}
                    />
                  )}
                />
                {errors.customerId && (
                  <p className="field-error">{errors.customerId.message}</p>
                )}
              </div>

              <div className="form-field flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer w-fit">
                  <input
                    type="checkbox"
                    className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                    {...register('syncDebt')}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {LABELS.CHK_DEBT}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <hr className="border-t border-dashed border-[var(--border)]" />

          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Icon name="Truck" className="w-5 h-5 text-indigo-500" />
              {LABELS.SEC_LOGISTICS}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="form-field">
                <label>{LABELS.EMPLOYEE}</label>
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
                        placeholder={LABELS.PLC_WAREHOUSE}
                      />
                    );
                  }}
                />
              </div>

              <div className="form-field">
                <label>{LABELS.DELIVERY_STAFF}</label>
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
                        placeholder={LABELS.PLC_STAFF}
                      />
                    );
                  }}
                />
              </div>

              <div className="form-field">
                <label>{LABELS.DELIVERY_ADDRESS}</label>
                <input
                  className="field-input"
                  {...register('deliveryAddress')}
                  placeholder={LABELS.PLC_ADDRESS}
                />
              </div>

              <div className="form-field">
                <label>{LABELS.VEHICLE_INFO}</label>
                <input
                  className="field-input"
                  {...register('vehicleInfo')}
                  placeholder="VD: 51C-12345"
                />
              </div>

              <div className="form-field">
                <label>{LABELS.SHIPPING_RATE}</label>
                <Controller
                  name="shippingRateId"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={shippingRateOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={LABELS.PLC_NO_APPLY}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-field">
                  <label>{LABELS.SHIPPING_COST}</label>
                  <input
                    className="field-input"
                    type="number"
                    {...register('shippingCost', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
                <div className="form-field">
                  <label>{LABELS.LOADING_FEE}</label>
                  <input
                    className="field-input"
                    type="number"
                    {...register('loadingFee', { valueAsNumber: true })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-field md:col-span-2">
                <label>{LABELS.NOTES}</label>
                <input
                  className="field-input"
                  {...register('notes')}
                  placeholder={LABELS.PLC_NOTES}
                />
              </div>
            </div>
          </div>

          <hr className="border-t border-dashed border-[var(--border)]" />

          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Icon name="Package" className="w-5 h-5 text-indigo-500" />
              {LABELS.SEC_DETAILS} <span className="field-required">*</span>
            </h3>
            <div className="w-full overflow-x-auto pb-4">
              <AdHocShipmentItemsTable
                form={form}
                fieldArray={fieldArray}
                itemsSummary={itemsSummary}
                isScanning={isScanning}
                fabricOptions={fabricOptions}
                onItemFieldChange={handleItemFieldChange}
                onAddRow={handleAddRow}
                onRemoveRow={(idx) =>
                  handleRemoveRow(idx, () => toast.error(MESSAGES.AT_LEAST_ONE))
                }
                onScanRow={handleScanRow}
              />
            </div>
          </div>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
