import { useMemo } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import { MoneyInput, MoneyText } from '@/shared/value';
import { useActiveShippingRates } from '@/shared/hooks/useShippingRateOptions';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { VPCombobox, VPEntityPicker, VPSelect } from '@/shared/components';
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

  const shipmentNumber = SHIPMENT_FORM_MESSAGES.AUTO_NUMBER;

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
        id: c.value,
        name: c.label,
        code: c.code,
      })),
    [customerOptions],
  );

  const warehouseEmpOptions = useMemo(
    () =>
      warehouseEmployees.map((emp) => ({
        id: emp.id,
        name: emp.name,
        code: emp.code,
      })),
    [warehouseEmployees],
  );

  const deliveryStaffOptions = useMemo(
    () =>
      deliveryStaff.map((staff) => ({
        id: staff.id,
        name: staff.full_name,
        phone: staff.phone || undefined,
      })),
    [deliveryStaff],
  );

  const purposeOptions = useMemo(
    () =>
      AD_HOC_PURPOSE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: opt.label,
        icon: (
          <Icon
            name={opt.iconName}
            className="w-4 h-4 text-[var(--muted-foreground)]"
          />
        ),
      })),
    [],
  );

  const watchedCustomerId = useWatch({ control, name: 'customerId' });
  const watchedPurpose = useWatch({ control, name: 'purpose' });
  const watchedEmployeeId = useWatch({ control, name: 'employeeId' });
  const watchedSyncDebt = useWatch({ control, name: 'syncDebt' });
  const watchedShippingCost = useWatch({ control, name: 'shippingCost' }) || 0;
  const watchedLoadingFee = useWatch({ control, name: 'loadingFee' }) || 0;

  const totalPayment =
    itemsSummary.totalAmount + watchedShippingCost + watchedLoadingFee;

  const selectedCustomerName = customerComboOptions.find(
    (c) => c.id === watchedCustomerId,
  )?.name;
  const selectedWarehouseName = warehouseEmpOptions.find(
    (e) => e.id === watchedEmployeeId,
  )?.name;

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
        <div className="flex flex-col w-full border-t border-[var(--border)] bg-[var(--surface)]">
          {/* Footer Summary */}
          {itemsSummary.count > 0 && (
            <div className="px-4 py-2 bg-[var(--surface-secondary)] border-b border-[var(--border)] flex justify-between items-center text-sm">
              <div className="flex items-center gap-4 text-[var(--muted-foreground)]">
                <span>
                  <span className="font-semibold text-foreground">
                    {itemsSummary.count}
                  </span>{' '}
                  dòng
                </span>
                <span>
                  <span className="font-semibold text-foreground">
                    {itemsSummary.totalQty.toFixed(1)}
                  </span>{' '}
                  kg/m
                </span>
                <span>
                  Tiền hàng:{' '}
                  <span className="font-semibold text-foreground">
                    <MoneyText value={itemsSummary.totalAmount} />
                  </span>
                </span>
                <span>
                  Phí VC:{' '}
                  <span className="font-semibold text-foreground">
                    <MoneyText
                      value={watchedShippingCost + watchedLoadingFee}
                    />
                  </span>
                </span>
              </div>
              <div className="font-bold text-lg text-[var(--primary)] flex items-center gap-2">
                Tổng thanh toán: <MoneyText value={totalPayment} />
              </div>
            </div>
          )}
          <div className="flex w-full justify-end items-center gap-3 py-3 px-4">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
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
        </div>
      }
    >
      <form id="adhoc-shipment-form" onSubmit={handleSubmit(onSubmit)}>
        {/* Subtitle */}
        <p className="text-sm text-[var(--muted-foreground)] mb-4">
          {MESSAGES.SUBTITLE}
        </p>

        {createMutation.error && (
          <p className="error-inline mb-4">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : String(createMutation.error)}
          </p>
        )}

        <div className="space-y-6 pb-6">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-default flex items-center gap-2">
              <Icon name="FileText" className="w-5 h-5 text-info" />
              {LABELS.SEC_GENERAL}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="form-field">
                <label>{LABELS.SHIPMENT_NUMBER}</label>
                <input
                  className="field-input italic bg-[var(--surface-disabled)] text-[var(--muted-foreground)]"
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
                  <Controller
                    name="purpose"
                    control={control}
                    render={({ field }) => (
                      <VPSelect
                        options={purposeOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={LABELS.PURPOSE}
                      />
                    )}
                  />
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
                    <VPEntityPicker
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
            </div>
          </div>

          {/* Sticky Summary Bar */}
          <div className="sticky top-0 z-10 p-3 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-[var(--radius)] flex flex-wrap gap-x-6 gap-y-2 text-sm shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted-foreground)]">
                Khách hàng:
              </span>
              <span className="font-medium text-foreground">
                {selectedCustomerName || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted-foreground)]">Công nợ:</span>
              <span
                className={`font-medium ${watchedSyncDebt ? 'text-[var(--success)]' : 'text-[var(--muted-foreground)]'}`}
              >
                {watchedSyncDebt ? 'Có ghi nhận' : 'Không'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted-foreground)]">Loại xuất:</span>
              <span className="font-medium text-foreground">
                {watchedPurpose || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--muted-foreground)]">Kho xuất:</span>
              <span className="font-medium text-foreground">
                {selectedWarehouseName || '—'}
              </span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-default">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Icon name="Package" className="w-5 h-5 text-info" />
                {LABELS.SEC_DETAILS} <span className="field-required">*</span>
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="text-[var(--primary)] hover:bg-blue-50"
              >
                <Icon name="Plus" className="w-4 h-4 mr-1" />
                {MESSAGES.ADD_ROW}
              </Button>
            </div>
            <div className="w-full overflow-x-auto">
              <AdHocShipmentItemsTable
                form={form}
                fieldArray={fieldArray}
                itemsSummary={itemsSummary}
                isScanning={isScanning}
                fabricOptions={fabricOptions}
                onItemFieldChange={handleItemFieldChange}
                onRemoveRow={(idx) =>
                  handleRemoveRow(idx, () => toast.error(MESSAGES.AT_LEAST_ONE))
                }
                onScanRow={handleScanRow}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-default flex items-center gap-2">
              <Icon name="CreditCard" className="w-5 h-5 text-info" />
              {LABELS.SEC_PAYMENT}
            </h3>
            <div className="form-field flex items-center">
              <label className="flex items-center gap-2 cursor-pointer w-fit">
                <input
                  type="checkbox"
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                  {...register('syncDebt')}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {LABELS.CHK_DEBT}
                </span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-default flex items-center gap-2">
              <Icon name="Truck" className="w-5 h-5 text-info" />
              {LABELS.SEC_LOGISTICS}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="form-field">
                <label>{LABELS.EMPLOYEE}</label>
                <Controller
                  name="employeeId"
                  control={control}
                  render={({ field }) => (
                    <VPEntityPicker
                      options={warehouseEmpOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder={LABELS.PLC_WAREHOUSE}
                    />
                  )}
                />
              </div>

              <div className="form-field">
                <label>{LABELS.DELIVERY_STAFF}</label>
                <Controller
                  name="deliveryStaffId"
                  control={control}
                  render={({ field }) => (
                    <VPEntityPicker
                      options={deliveryStaffOptions}
                      value={field.value || ''}
                      onChange={field.onChange}
                      placeholder={LABELS.PLC_STAFF}
                    />
                  )}
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
                  placeholder={LABELS.PLC_VEHICLE}
                />
              </div>

              <div className="form-field">
                <label>{LABELS.SHIPPING_RATE}</label>
                <Controller
                  name="shippingRateId"
                  control={control}
                  render={({ field }) => (
                    <VPCombobox
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
                <div className="form-field">
                  <label>{LABELS.LOADING_FEE}</label>
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
        </div>
      </form>
    </AdaptiveSheet>
  );
}
