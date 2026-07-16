import {
  Controller,
  type UseFormReturn,
  type UseFieldArrayReturn,
} from 'react-hook-form';

import { Icon } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { MoneyText } from '@/shared/value';
import type { AdHocShipmentFormValues } from '@/schema/shipment.schema';

import { AD_HOC_SHIPMENT_MESSAGES } from './shipments.constants';

const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'm', label: 'm' },
];

type AdHocShipmentItemsTableProps = {
  form: UseFormReturn<AdHocShipmentFormValues>;
  fieldArray: UseFieldArrayReturn<AdHocShipmentFormValues, 'items', 'id'>;
  itemsSummary: { count: number; totalQty: number; totalAmount: number };
  onItemFieldChange: (index: number) => void;
  onAddRow: () => void;
  onRemoveRow: (index: number) => void;
  onScanRow: (index: number, barcode: string) => void;
  isScanning: boolean;
  fabricOptions: { label: string; value: string }[];
};

export function AdHocShipmentItemsTable({
  form,
  fieldArray: { fields },
  itemsSummary,
  onItemFieldChange,
  onAddRow,
  onRemoveRow,
  onScanRow,
  isScanning,
  fabricOptions,
}: AdHocShipmentItemsTableProps) {
  const {
    register,
    formState: { errors },
    control,
  } = form;
  return (
    <div className="form-field">
      <div className="flex items-center justify-between mb-2">
        <label className="m-0">
          {AD_HOC_SHIPMENT_MESSAGES.LBL_TRADING_ITEMS}{' '}
          <span className="field-required">*</span>
        </label>
        <button
          type="button"
          className="btn-secondary text-xs flex items-center gap-1 px-3 py-1.5"
          onClick={onAddRow}
        >
          <Icon name="Plus" size={14} />
          {AD_HOC_SHIPMENT_MESSAGES.ADD_ROW}
        </button>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[30px_1fr_100px_70px_120px_130px_40px] gap-0 bg-[var(--surface-secondary)] border-b border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
          <span className="text-center">#</span>
          <span>{AD_HOC_SHIPMENT_MESSAGES.COL_FABRIC}</span>
          <span className="text-right">{AD_HOC_SHIPMENT_MESSAGES.COL_QTY}</span>
          <span className="text-center">
            {AD_HOC_SHIPMENT_MESSAGES.COL_UNIT}
          </span>
          <span className="text-right">
            {AD_HOC_SHIPMENT_MESSAGES.COL_PRICE}
          </span>
          <span className="text-right">
            {AD_HOC_SHIPMENT_MESSAGES.COL_TOTAL}
          </span>
          <span />
        </div>

        {/* Table rows */}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-[30px_1fr_100px_70px_120px_130px_40px] gap-0 items-center border-b border-[var(--border)] last:border-b-0 px-3 py-2"
          >
            {/* Scan */}
            <div className="flex justify-center pr-2">
              <button
                type="button"
                className="btn-icon text-[var(--primary)] hover:bg-[var(--primary-light)] p-1 rounded transition-colors disabled:opacity-50"
                disabled={isScanning}
                onClick={() => {
                  const barcode = window.prompt(
                    AD_HOC_SHIPMENT_MESSAGES.SCAN_PROMPT,
                  );
                  if (barcode) onScanRow(index, barcode);
                }}
                title={AD_HOC_SHIPMENT_MESSAGES.TITLE_SCAN}
              >
                <Icon name="ScanLine" size={16} />
              </button>
            </div>

            {/* Fabric type */}
            <div className="pr-2">
              <Controller
                control={control}
                name={`items.${index}.fabricType`}
                render={({ field: { value, onChange, onBlur } }) => (
                  <Combobox
                    variant="table-cell"
                    options={fabricOptions}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder="VD: Kaki Thun"
                    allowInput={true}
                    hasError={!!errors.items?.[index]?.fabricType}
                  />
                )}
              />
              {errors.items?.[index]?.fabricType && (
                <p className="field-error text-[10px] mt-0.5">
                  {errors.items[index].fabricType?.message}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div className="pr-2">
              <input
                className={`field-input text-sm text-right ${errors.items?.[index]?.quantity ? 'border-danger' : ''}`}
                type="number"
                step="0.1"
                placeholder="0"
                {...register(`items.${index}.quantity`, {
                  valueAsNumber: true,
                  onChange: () => onItemFieldChange(index),
                })}
              />
            </div>

            {/* Unit */}
            <div className="pr-2">
              <select
                className="field-input text-sm text-center"
                {...register(`items.${index}.unit`)}
              >
                {UNIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Price per kg */}
            <div className="pr-2">
              <input
                className="field-input text-sm text-right"
                type="number"
                step="100"
                placeholder="0"
                {...register(`items.${index}.pricePerKg`, {
                  valueAsNumber: true,
                  onChange: () => onItemFieldChange(index),
                })}
              />
            </div>

            {/* Total amount */}
            <div className="pr-2">
              <input
                className="field-input text-sm text-right font-semibold"
                type="number"
                step="100"
                placeholder="0"
                {...register(`items.${index}.totalAmount`, {
                  valueAsNumber: true,
                })}
              />
            </div>

            {/* Remove */}
            <div className="flex justify-center">
              <button
                type="button"
                className="btn-icon text-[var(--text-tertiary)] hover:text-[var(--danger)]"
                onClick={() => onRemoveRow(index)}
                title={AD_HOC_SHIPMENT_MESSAGES.TITLE_DELETE}
              >
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
            {AD_HOC_SHIPMENT_MESSAGES.EMPTY_ITEMS} &quot;
            {AD_HOC_SHIPMENT_MESSAGES.ADD_ROW}
            &quot; {AD_HOC_SHIPMENT_MESSAGES.EMPTY_ITEMS_ACTION}
          </div>
        )}
      </div>

      {errors.items?.root && (
        <p className="field-error">{errors.items.root.message}</p>
      )}

      {/* Summary bar */}
      {itemsSummary.count > 0 && (
        <div className="mt-3 px-4 py-3 rounded-[var(--radius)] bg-[#ecfdf5] border border-[#a7f3d0] flex justify-between items-center flex-wrap gap-2">
          <span className="text-[0.85rem] font-semibold text-[#065f46]">
            {itemsSummary.count} {AD_HOC_SHIPMENT_MESSAGES.SUMMARY_LINES} •{' '}
            {itemsSummary.totalQty.toFixed(1)} kg/m
          </span>
          <span className="text-[0.85rem] font-bold text-[#047857]">
            {AD_HOC_SHIPMENT_MESSAGES.SUMMARY_TOTAL}:{' '}
            <MoneyText value={itemsSummary.totalAmount} />đ
          </span>
        </div>
      )}
    </div>
  );
}
