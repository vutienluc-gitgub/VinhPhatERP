import { useState, useMemo } from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';

import type { PurchaseOrderFormValues } from '@/domain/purchase-orders';
import { Combobox } from '@/shared/components';
import { PO_CONSTANTS } from '@/features/procurement/purchase-orders/purchase-orders.constants';
import type { Supplier } from '@/domain/crm/suppliers.types';
import type { Employee } from '@/schema';

interface POGeneralInfoCardProps {
  form: UseFormReturn<PurchaseOrderFormValues>;
  suppliers: Supplier[];
  employees: Employee[];
}

export function POGeneralInfoCard({
  form,
  suppliers,
  employees,
}: POGeneralInfoCardProps) {
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const supplierOptions = useMemo(
    () =>
      suppliers.map((s) => ({
        value: s.id,
        label: s.name,
        code: s.code,
      })),
    [suppliers],
  );

  const employeeOptions = useMemo(
    () =>
      employees.map((e) => ({
        value: `${e.code ? `${e.code} - ` : ''}${e.name}`,
        label: `${e.code ? `${e.code} - ` : ''}${e.name}`,
      })),
    [employees],
  );

  const incotermsValue = watch('incoterms');
  const [tradeType, setTradeType] = useState<'domestic' | 'import'>(
    incotermsValue ? 'import' : 'domestic',
  );

  const handleTradeTypeChange = (type: 'domestic' | 'import') => {
    setTradeType(type);
    if (type === 'domestic') {
      setValue('incoterms', '');
      setValue('currency', 'VND');
    } else {
      setValue('currency', 'USD');
    }
  };

  return (
    <div className="bg-surface rounded-xl shadow-sm border border-border p-6 space-y-6">
      <h3 className="font-semibold text-lg pb-2 border-b border-border m-0">
        {PO_CONSTANTS.SECTION_GENERAL}
      </h3>

      {/* Nhóm 1: Nhà cung cấp & Giao dịch */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider border-l-2 border-primary pl-2">
          {PO_CONSTANTS.SECTION_TRADE_SUPPLIER}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="form-field">
            <label>
              {PO_CONSTANTS.LABEL_SUPPLIER}{' '}
              <span className="text-danger">*</span>
            </label>
            <Controller
              name="supplier_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={supplierOptions}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    const sup = suppliers.find((s) => s.id === val);
                    if (sup) setValue('supplier_name_snapshot', sup.name);
                  }}
                  placeholder={PO_CONSTANTS.SELECT_SUPPLIER}
                  className="h-9"
                  hasError={!!errors.supplier_id}
                />
              )}
            />
            {errors.supplier_id && (
              <span className="text-danger text-sm mt-1 block">
                {errors.supplier_id.message}
              </span>
            )}
          </div>

          <div className="form-field">
            <label>{PO_CONSTANTS.LABEL_TRADE_TYPE}</label>
            <div className="flex gap-1 bg-surface-secondary p-1 rounded-lg h-9 items-center">
              <button
                type="button"
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all h-7 ${
                  tradeType === 'domestic'
                    ? 'bg-surface text-foreground shadow-sm border border-black/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => handleTradeTypeChange('domestic')}
              >
                {PO_CONSTANTS.TRADE_TYPE_DOMESTIC}
              </button>
              <button
                type="button"
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all h-7 ${
                  tradeType === 'import'
                    ? 'bg-surface text-foreground shadow-sm border border-black/5'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => handleTradeTypeChange('import')}
              >
                {PO_CONSTANTS.TRADE_TYPE_IMPORT}
              </button>
            </div>
          </div>

          <div className="form-field">
            <label>{PO_CONSTANTS.LABEL_SUPPLIER_REF}</label>
            <input
              type="text"
              className="field-input h-9"
              placeholder={PO_CONSTANTS.PLACEHOLDER_SUPPLIER_REF}
              {...register('supplier_ref')}
            />
          </div>

          <div className="form-field">
            <label>{PO_CONSTANTS.LABEL_PIC}</label>
            <Controller
              name="person_in_charge"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={employeeOptions}
                  value={field.value || ''}
                  onChange={(val) => field.onChange(val)}
                  placeholder={PO_CONSTANTS.PLACEHOLDER_PIC}
                  className="h-9"
                />
              )}
            />
          </div>

          <div className="form-field">
            <label>
              {PO_CONSTANTS.LABEL_ORDER_DATE}{' '}
              <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              className={`field-input h-9 ${errors.order_date ? 'border-danger border-danger' : ''}`}
              {...register('order_date')}
            />
            {errors.order_date && (
              <span className="text-danger text-sm mt-1 block">
                {errors.order_date.message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Nhóm 2: Logistics & Vận chuyển */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider border-l-2 border-primary pl-2">
          {PO_CONSTANTS.SECTION_LOGISTICS}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="form-field">
            <label>{PO_CONSTANTS.LABEL_DELIVERY_WAREHOUSE}</label>
            <input
              type="text"
              className="field-input h-9"
              {...register('delivery_warehouse')}
            />
          </div>

          <div className="form-field">
            <label>{PO_CONSTANTS.LABEL_EXPECTED_DATE}</label>
            <input
              type="date"
              className="field-input h-9"
              {...register('expected_date')}
            />
          </div>

          {tradeType === 'import' && (
            <div className="form-field animate-fadeIn">
              <label>{PO_CONSTANTS.LABEL_INCOTERMS}</label>
              <select className="field-select h-9" {...register('incoterms')}>
                <option value="">{PO_CONSTANTS.SELECT_DEFAULT}</option>
                {PO_CONSTANTS.INCOTERMS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-field">
            <label>{PO_CONSTANTS.LABEL_PRIORITY}</label>
            <select className="field-select h-9" {...register('priority')}>
              <option value="normal">{PO_CONSTANTS.PRIORITY_NORMAL}</option>
              <option value="high">{PO_CONSTANTS.PRIORITY_HIGH}</option>
              <option value="urgent">{PO_CONSTANTS.PRIORITY_URGENT}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Nhóm 3: Điều khoản thanh toán */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <h4 className="text-xs font-bold text-foreground/80 uppercase tracking-wider border-l-2 border-primary pl-2">
          {PO_CONSTANTS.SECTION_PAYMENT_TERMS}
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="form-field">
            <label>{PO_CONSTANTS.LABEL_PAYMENT_TERMS}</label>
            <select className="field-select h-9" {...register('payment_terms')}>
              {PO_CONSTANTS.PAYMENT_TERMS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>{PO_CONSTANTS.LABEL_PAYMENT_DEADLINE}</label>
            <input
              type="date"
              className="field-input h-9"
              {...register('payment_deadline')}
            />
          </div>

          <div className="form-field">
            <label>{PO_CONSTANTS.LABEL_VAT_TERMS}</label>
            <input
              type="text"
              className="field-input h-9"
              {...register('vat_terms')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
