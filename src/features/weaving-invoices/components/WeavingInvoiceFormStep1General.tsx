import { useEffect, useRef } from 'react';
import { useWatch, Controller } from 'react-hook-form';
import type {
  Control,
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
} from 'react-hook-form';

import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import { Combobox } from '@/shared/components/Combobox';
import { MoneyInput } from '@/shared/value';
import {
  useNextWeavingInvoiceNumber,
  useWeavingSuppliers,
  useWorkOrders,
} from '@/application/production';
import type { WeavingInvoiceFormValues } from '@/schema/weaving-invoice.schema';
import { WEAVING_INVOICE_MESSAGES as MSG } from '@/features/weaving-invoices/weaving-invoices.constants';

type Props = {
  isEdit: boolean;
  control: Control<WeavingInvoiceFormValues>;
  register: UseFormRegister<WeavingInvoiceFormValues>;
  errors: FieldErrors<WeavingInvoiceFormValues>;
  setValue: UseFormSetValue<WeavingInvoiceFormValues>;
};

export function WeavingInvoiceFormStep1General({
  isEdit,
  control,
  register,
  errors,
  setValue,
}: Props) {
  const { data: nextNumber = '' } = useNextWeavingInvoiceNumber();
  const { data: suppliers = [] } = useWeavingSuppliers();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();

  // ── TARGETED FIELD SUBSCRIPTIONS (avoid full-form re-render) ──
  const selectedSupplierId = useWatch({ control, name: 'supplier_id' });

  const { data: woData } = useWorkOrders(
    selectedSupplierId
      ? {
          supplier_id: selectedSupplierId,
          status: 'in_progress',
        }
      : undefined,
  );

  const workOrderOptions = (woData?.data || [])
    .filter((wo) => wo.supplier_id === selectedSupplierId)
    .map((wo) => ({
      label: `${wo.work_order_number} ${wo.bom_template?.target_fabric ? `(${wo.bom_template.target_fabric.name})` : ''}`,
      value: wo.id,
      raw: wo,
    }));

  const supplierOptions = suppliers.map((s) => ({
    label: s.name,
    value: s.id,
    code: s.code,
  }));

  const fabricComboOptions = fabricOptions.map((f) => ({
    label: f.name,
    value: f.name,
    code: f.code,
  }));

  /**
   * Auto-fill invoice number for new invoices.
   * Uses a ref to track whether auto-fill has happened, preventing
   * the fragile dependency on formValues.invoice_number which could
   * cause an infinite re-render loop if nextNumber ever returned "".
   */
  const hasAutoFilledInvoiceRef = useRef(false);
  useEffect(() => {
    if (!isEdit && nextNumber && !hasAutoFilledInvoiceRef.current) {
      hasAutoFilledInvoiceRef.current = true;
      setValue('invoice_number', nextNumber);
    }
  }, [nextNumber, isEdit, setValue]);

  return (
    <fieldset className="bulk-section">
      <legend>{MSG.SECTION_INFO}</legend>
      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        {/* Số phiếu */}
        <div className="form-field">
          <label>
            {MSG.LABEL_INVOICE_NO} <span className="field-required">*</span>
          </label>
          <input
            className={`field-input${errors.invoice_number ? ' border-danger' : ''}`}
            {...register('invoice_number')}
          />
          {errors.invoice_number && (
            <span className="field-error">{errors.invoice_number.message}</span>
          )}
        </div>

        {/* Nhà dệt */}
        <div className="form-field">
          <label>
            {MSG.LABEL_SUPPLIER} <span className="field-required">*</span>
          </label>
          <Controller
            control={control}
            name="supplier_id"
            render={({ field }) => (
              <Combobox
                options={supplierOptions}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={MSG.PLACEHOLDER_SUPPLIER}
                hasError={!!errors.supplier_id}
              />
            )}
          />
          {errors.supplier_id && (
            <span className="field-error">{errors.supplier_id.message}</span>
          )}
        </div>

        {/* Ngày */}
        <div className="form-field">
          <label>
            {MSG.LABEL_DATE} <span className="field-required">*</span>
          </label>
          <input
            type="date"
            className={`field-input${errors.invoice_date ? ' border-danger' : ''}`}
            {...register('invoice_date')}
          />
          {errors.invoice_date && (
            <span className="field-error">{errors.invoice_date.message}</span>
          )}
        </div>

        {/* Lệnh dệt (Tùy chọn) */}
        <div className="form-field">
          <label>{MSG.LABEL_WORK_ORDER}</label>
          <Controller
            control={control}
            name="work_order_id"
            render={({ field }) => (
              <Combobox
                options={workOrderOptions}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  // Auto-fill fabric & price from Work Order
                  const wo = workOrderOptions.find((o) => o.value === val)?.raw;
                  if (wo) {
                    if (wo.bom_template?.target_fabric) {
                      setValue(
                        'fabric_type',
                        wo.bom_template.target_fabric.name,
                      );
                    }
                    if (wo.weaving_unit_price) {
                      setValue('unit_price_per_kg', wo.weaving_unit_price);
                    }
                  }
                }}
                onBlur={field.onBlur}
                placeholder={
                  selectedSupplierId
                    ? MSG.PLACEHOLDER_WORK_ORDER
                    : MSG.PLACEHOLDER_WORK_ORDER_DISABLED
                }
                hasError={!!errors.work_order_id}
                disabled={!selectedSupplierId || workOrderOptions.length === 0}
              />
            )}
          />
          {errors.work_order_id && (
            <span className="field-error">{errors.work_order_id.message}</span>
          )}
        </div>

        {/* Loại vải */}
        <div className="form-field">
          <label>
            {MSG.LABEL_FABRIC} <span className="field-required">*</span>
          </label>
          <Controller
            control={control}
            name="fabric_type"
            render={({ field }) => (
              <Combobox
                options={fabricComboOptions}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                placeholder={MSG.PLACEHOLDER_FABRIC_INPUT}
                hasError={!!errors.fabric_type}
                allowInput
              />
            )}
          />
          {errors.fabric_type && (
            <span className="field-error">{errors.fabric_type.message}</span>
          )}
        </div>

        {/* Đơn giá */}
        <div className="form-field">
          <label>
            {MSG.LABEL_UNIT_PRICE} <span className="field-required">*</span>
          </label>
          <Controller
            control={control}
            name="unit_price_per_kg"
            render={({ field }) => (
              <MoneyInput
                className={`field-input${errors.unit_price_per_kg ? ' border-danger' : ''}`}
                value={field.value}
                onChange={(v) => field.onChange(v ?? 0)}
                onBlur={field.onBlur}
                placeholder="0"
                suffix=" đ/kg"
              />
            )}
          />
          {errors.unit_price_per_kg && (
            <span className="field-error">
              {errors.unit_price_per_kg.message}
            </span>
          )}
        </div>

        {/* Ghi chú */}
        <div className="form-field col-span-full">
          <label>{MSG.LABEL_NOTES}</label>
          <textarea className="field-input" rows={2} {...register('notes')} />
        </div>
      </div>
    </fieldset>
  );
}
