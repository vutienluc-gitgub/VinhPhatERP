/**
 * TradingItemRow
 *
 * Dòng hàng cho đơn thương mại. Cho phép chọn:
 * - Loại sản phẩm (Sợi / Vải mộc / Vải thành phẩm)
 * - Nguồn kho: chọn từ dropdown tồn kho khả dụng
 * - Số lô (cho sợi)
 * - Số lượng & đơn giá
 */
import { Controller } from 'react-hook-form';
import type { Control, UseFormSetValue } from 'react-hook-form';

import { ORDERS_FORM_LABELS } from '@/features/orders/orders.constants';
import { Combobox } from '@/shared/components/Combobox';
import { Badge, Icon } from '@/shared/components';
import { MoneyInput, QuantityInput } from '@/shared/value';
import {} from '@/shared/utils/format';
import { PRODUCT_CATEGORY_OPTIONS } from '@/schema/order.schema';
import type { OrdersFormValues, ProductCategory } from '@/schema/order.schema';
import { useTradingItemStock } from '@/features/orders/hooks/useTradingItemStock';

type TradingItemRowProps = {
  index: number;
  control: Control<OrdersFormValues>;
  setValue: UseFormSetValue<OrdersFormValues>;
  errors: Record<string, unknown>;
  register: ReturnType<
    typeof import('react-hook-form').useForm<OrdersFormValues>
  >['register'];
  productCategory: ProductCategory;
  onRemove: () => void;
  canRemove: boolean;
};

const CATEGORY_COMBO_OPTIONS = PRODUCT_CATEGORY_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

export function TradingItemRow({
  index,
  control,
  setValue,
  errors,
  register,
  productCategory,
  onRemove,
  canRemove,
}: TradingItemRowProps) {
  const { lotOptions, stockOptions, handleStockSelect, getMaxAvailableQty } =
    useTradingItemStock(index, control, setValue, productCategory);

  const itemErrors = (errors.items as Record<string, unknown>[] | undefined)?.[
    index
  ] as Record<string, { message?: string }> | undefined;

  const stockInfo = getMaxAvailableQty();
  const currentQty =
    (control._formValues as OrdersFormValues).items?.[index]?.quantity ?? 0;
  const isOverStock = stockInfo !== null && currentQty > stockInfo.max;

  return (
    <div className="form-item-box">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">
            {ORDERS_FORM_LABELS.ITEM_ROW_PREFIX}
            {index + 1}
          </span>
          <Badge variant="info">{ORDERS_FORM_LABELS.BADGE_TRADING}</Badge>
        </div>
        {canRemove && (
          <button
            className="btn-icon danger"
            type="button"
            title={ORDERS_FORM_LABELS.BTN_REMOVE_TITLE}
            onClick={onRemove}
          >
            <Icon name="Trash2" size={16} />
            {ORDERS_FORM_LABELS.BTN_REMOVE.replace(' ✕', '')}
          </button>
        )}
      </div>

      <div className="form-grid">
        {/* Row 1: Product Category + Stock Picker */}
        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <div className="form-field">
            <label>
              {ORDERS_FORM_LABELS.FIELD_PRODUCT_CATEGORY}{' '}
              <span className="field-required">*</span>
            </label>
            <Controller
              name={`items.${index}.productCategory`}
              control={control}
              render={({ field }) => (
                <Combobox
                  options={CATEGORY_COMBO_OPTIONS}
                  value={field.value}
                  onChange={(val) => {
                    field.onChange(val);
                    // Reset stock selection when category changes
                    setValue(`items.${index}.sourceStockId`, '');
                    setValue(`items.${index}.fabricType`, '');
                    setValue(`items.${index}.colorName`, '');
                    setValue(`items.${index}.quantity`, 0);
                  }}
                />
              )}
            />
          </div>

          <div className="form-field">
            <label>
              {ORDERS_FORM_LABELS.FIELD_STOCK_SOURCE}{' '}
              <span className="field-required">*</span>
            </label>
            <Controller
              name={`items.${index}.sourceStockId`}
              control={control}
              render={({ field }) => (
                <Combobox
                  options={stockOptions}
                  value={field.value ?? ''}
                  onChange={(val) => {
                    field.onChange(val);
                    handleStockSelect(val);
                  }}
                  placeholder={
                    productCategory === 'yarn'
                      ? ORDERS_FORM_LABELS.PLACEHOLDER_SELECT_YARN
                      : ORDERS_FORM_LABELS.PLACEHOLDER_SELECT_FABRIC
                  }
                  hasError={!!itemErrors?.sourceStockId}
                />
              )}
            />
            {stockInfo && (
              <span
                className={`text-xs font-medium mt-1 ${isOverStock ? 'text-danger' : 'text-success'}`}
              >
                {stockInfo.label}
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Lot number (only for yarn) */}
        {productCategory === 'yarn' && (
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>{ORDERS_FORM_LABELS.FIELD_LOT}</label>
              {lotOptions.length > 0 ? (
                <Controller
                  name={`items.${index}.sourceLotNumber`}
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={lotOptions}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder={ORDERS_FORM_LABELS.PLACEHOLDER_LOT}
                    />
                  )}
                />
              ) : (
                <input
                  id={`items.${index}.sourceLotNumber`}
                  className="field-input"
                  type="text"
                  placeholder="VD: LOT-2026-05"
                  {...register(`items.${index}.sourceLotNumber`)}
                />
              )}
            </div>
            <div className="form-field">
              <label>{ORDERS_FORM_LABELS.FIELD_AUTO_YARN_NAME}</label>
              <input
                className={`field-input bg-[var(--surface-disabled)]${itemErrors?.fabricType ? ' border-danger' : ''}`}
                type="text"
                readOnly
                {...register(`items.${index}.fabricType`)}
              />
              {itemErrors?.fabricType && (
                <span className="field-error">
                  {itemErrors.fabricType.message}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Row 3: Fabric info (auto-filled, readonly for roll-based) */}
        {productCategory !== 'yarn' && (
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>{ORDERS_FORM_LABELS.FIELD_FABRIC_TYPE}</label>
              <input
                className={`field-input bg-[var(--surface-disabled)]${itemErrors?.fabricType ? ' border-danger' : ''}`}
                type="text"
                readOnly
                {...register(`items.${index}.fabricType`)}
              />
              {itemErrors?.fabricType && (
                <span className="field-error">
                  {itemErrors.fabricType.message}
                </span>
              )}
            </div>
            <div className="form-field">
              <label>{ORDERS_FORM_LABELS.FIELD_COLOR}</label>
              <input
                className="field-input bg-[var(--surface-disabled)]"
                type="text"
                readOnly
                {...register(`items.${index}.colorName`)}
              />
            </div>
          </div>
        )}

        {/* Row 4: Quantity + Unit Price */}
        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))]">
          <div className="form-field">
            <label htmlFor={`items.${index}.quantity`}>
              {ORDERS_FORM_LABELS.FIELD_QUANTITY}{' '}
              <span className="field-required">*</span>
            </label>
            <Controller
              name={`items.${index}.quantity`}
              control={control}
              render={({ field }) => (
                <QuantityInput
                  id={`items.${index}.quantity`}
                  className={`field-input${itemErrors?.quantity ? ' border-danger' : ''}`}
                  step="0.001"
                  min="0"
                  placeholder="0"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {itemErrors?.quantity && (
              <span className="field-error">{itemErrors.quantity.message}</span>
            )}
          </div>

          <div className="form-field">
            <label>
              {ORDERS_FORM_LABELS.FIELD_PRICE} (đ){' '}
              <span className="field-required">*</span>
            </label>
            <Controller
              name={`items.${index}.unitPrice`}
              control={control}
              render={({ field }) => (
                <MoneyInput
                  id={`items.${index}.unitPrice`}
                  className={`field-input${itemErrors?.unitPrice ? ' border-danger' : ''}`}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="0"
                />
              )}
            />
            {itemErrors?.unitPrice && (
              <span className="field-error">
                {itemErrors.unitPrice.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
