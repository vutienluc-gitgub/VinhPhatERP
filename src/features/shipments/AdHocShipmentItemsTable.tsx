import {
  Controller,
  type UseFormReturn,
  type UseFieldArrayReturn,
} from 'react-hook-form';

import { Icon } from '@/shared/components';
import { MoneyInput, MoneyText, QuantityInput } from '@/shared/value';
import { VPCombobox, VPSelect } from '@/shared/components';
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
  onItemFieldChange: (
    index: number,
    changedField?: 'quantity' | 'pricePerKg',
    newValue?: number | null,
  ) => void;
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
  onRemoveRow,
  onScanRow,
  isScanning,
  fabricOptions,
}: AdHocShipmentItemsTableProps) {
  const {
    formState: { errors },
    control,
  } = form;
  return (
    <div className="form-field">
      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[30px_1fr_100px_70px_120px_130px_40px] gap-0 bg-[var(--surface-secondary)] border-b border-[var(--border)] px-3 py-2 text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
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
                  <div className="flex flex-col">
                    <VPCombobox
                      options={fabricOptions}
                      value={value}
                      onChange={onChange}
                      onBlur={onBlur}
                      placeholder="VD: Kaki Thun"
                      allowCreatable={true}
                      hasError={!!errors.items?.[index]?.fabricType}
                      className="border-none rounded-none focus:ring-0 shadow-none h-9 bg-transparent"
                    />
                    {value && (
                      <div className="text-[10.5px] text-[var(--muted-foreground)] px-2 pb-1 flex gap-2">
                        <span>
                          Tồn:{' '}
                          <span className="font-semibold text-foreground">
                            245 kg
                          </span>
                        </span>
                        <span className="text-[var(--border)]">|</span>
                        <span>
                          Lô:{' '}
                          <span className="font-semibold text-foreground">
                            L240801
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                )}
              />
              {errors.items?.[index]?.fabricType && (
                <p className="field-error text-[10px] mt-0.5">
                  {errors.items[index].fabricType?.message}
                </p>
              )}
            </div>

            {/* Quantity */}
            <Controller
              name={`items.${index}.quantity`}
              control={control}
              render={({ field }) => {
                const qty = field.value || 0;
                const fabricType = form.getValues(`items.${index}.fabricType`);
                const isOverStock = qty > 245;

                return (
                  <div className="flex flex-col">
                    <QuantityInput
                      className={`field-input text-sm text-right ${errors.items?.[index]?.quantity ? 'border-danger' : ''} ${fabricType && isOverStock ? 'text-danger' : ''}`}
                      step="0.1"
                      placeholder="0"
                      value={field.value}
                      onChange={(val) => {
                        field.onChange(val);
                        onItemFieldChange(index, 'quantity', val);
                      }}
                      onBlur={field.onBlur}
                    />
                    {fabricType && qty > 0 && (
                      <div
                        className={`text-[10px] font-medium px-2 pb-1 text-right ${isOverStock ? 'text-danger' : 'text-success'}`}
                      >
                        {isOverStock
                          ? `⚠ Thiếu ${(qty - 245).toFixed(1)} kg`
                          : '✓ Đủ tồn'}
                      </div>
                    )}
                  </div>
                );
              }}
            />

            {/* Unit */}
            <div className="pr-2">
              <Controller
                name={`items.${index}.unit`}
                control={control}
                render={({ field }) => (
                  <VPSelect
                    size="sm"
                    options={UNIT_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="-"
                    className="border-none rounded-none focus:ring-0 shadow-none bg-transparent"
                  />
                )}
              />
            </div>

            {/* Price per kg */}
            <div className="pr-2">
              <Controller
                name={`items.${index}.pricePerKg` as const}
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    className="field-input text-sm"
                    placeholder="0"
                    value={field.value}
                    onChange={(val) => {
                      field.onChange(val);
                      onItemFieldChange(index, 'pricePerKg', val);
                    }}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            {/* Total amount */}
            <div className="pr-2">
              <Controller
                name={`items.${index}.totalAmount` as const}
                control={control}
                render={({ field }) => (
                  <MoneyInput
                    className="field-input text-sm font-semibold"
                    placeholder="0"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </div>

            {/* Remove */}
            <div className="flex justify-center">
              <button
                type="button"
                className="btn-icon text-[var(--muted-foreground)] hover:text-[var(--danger)]"
                onClick={() => onRemoveRow(index)}
                title={AD_HOC_SHIPMENT_MESSAGES.TITLE_DELETE}
              >
                <Icon name="Trash2" size={14} />
              </button>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 text-[var(--muted-foreground)] text-sm">
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
            <MoneyText value={itemsSummary.totalAmount} />
          </span>
        </div>
      )}
    </div>
  );
}
