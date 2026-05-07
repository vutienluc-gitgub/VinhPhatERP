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
import { useMemo } from 'react';

import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { Badge } from '@/shared/components/Badge';
import { formatQuantity } from '@/shared/utils/format';
import {
  useTradingYarnStock,
  useTradingYarnLots,
  useTradingRawFabricRolls,
  useTradingFinishedFabricRolls,
} from '@/application/orders';
import { PRODUCT_CATEGORY_OPTIONS } from '@/schema/order.schema';
import type { OrdersFormValues, ProductCategory } from '@/schema/order.schema';

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
  const { data: yarnStock = [] } = useTradingYarnStock();
  const { data: rawRolls = [] } = useTradingRawFabricRolls();
  const { data: finishedRolls = [] } = useTradingFinishedFabricRolls();

  // Current sourceStockId for yarn lot lookup
  const currentSourceStockId =
    (control._formValues as OrdersFormValues).items?.[index]?.sourceStockId ??
    '';
  const { data: yarnLots = [] } = useTradingYarnLots(
    productCategory === 'yarn' ? currentSourceStockId : '',
  );

  const lotOptions = useMemo(
    () =>
      yarnLots.map((lot) => ({
        value: lot.lot_number ?? lot.receipt_item_id,
        label: lot.lot_number
          ? `${lot.lot_number} (${lot.receipt_number})`
          : `Khong co lo — ${lot.receipt_number}`,
        badge: `${formatQuantity(lot.quantity)} ${lot.unit}`,
      })),
    [yarnLots],
  );

  const itemErrors = (errors.items as Record<string, unknown>[] | undefined)?.[
    index
  ] as Record<string, { message?: string }> | undefined;

  // Build combobox options based on selected category
  const stockOptions = useMemo(() => {
    switch (productCategory) {
      case 'yarn':
        return yarnStock.map((y) => ({
          value: y.id,
          label: `${y.code} — ${y.name}`,
          badge: `${formatQuantity(y.available_qty)} ${y.unit}`,
        }));
      case 'raw_fabric':
        return rawRolls.map((r) => ({
          value: r.id,
          label: `${r.roll_number} — ${r.fabric_type}`,
          badge: r.weight_kg
            ? `${formatQuantity(r.weight_kg)} kg`
            : r.length_m
              ? `${formatQuantity(r.length_m)} m`
              : '',
        }));
      case 'finished_fabric':
        return finishedRolls.map((r) => ({
          value: r.id,
          label: `${r.roll_number} — ${r.fabric_type}`,
          badge: r.weight_kg
            ? `${formatQuantity(r.weight_kg)} kg`
            : r.length_m
              ? `${formatQuantity(r.length_m)} m`
              : '',
        }));
      default:
        return [];
    }
  }, [productCategory, yarnStock, rawRolls, finishedRolls]);

  // When stock item is selected, auto-fill fields
  function handleStockSelect(stockId: string) {
    setValue(`items.${index}.sourceStockId`, stockId);

    if (productCategory === 'yarn') {
      const yarn = yarnStock.find((y) => y.id === stockId);
      if (yarn) {
        setValue(`items.${index}.fabricType`, yarn.name);
        setValue(`items.${index}.colorName`, yarn.color_name ?? '');
        setValue(`items.${index}.unit`, yarn.unit === 'm' ? 'm' : 'kg');
      }
    } else if (productCategory === 'raw_fabric') {
      const roll = rawRolls.find((r) => r.id === stockId);
      if (roll) {
        setValue(`items.${index}.fabricType`, roll.fabric_type);
        setValue(`items.${index}.colorName`, roll.color_name ?? '');
        setValue(`items.${index}.colorCode`, roll.color_code ?? '');
        if (roll.weight_kg) {
          setValue(`items.${index}.quantity`, roll.weight_kg);
          setValue(`items.${index}.unit`, 'kg');
        } else if (roll.length_m) {
          setValue(`items.${index}.quantity`, roll.length_m);
          setValue(`items.${index}.unit`, 'm');
        }
      }
    } else if (productCategory === 'finished_fabric') {
      const roll = finishedRolls.find((r) => r.id === stockId);
      if (roll) {
        setValue(`items.${index}.fabricType`, roll.fabric_type);
        setValue(`items.${index}.colorName`, roll.color_name ?? '');
        setValue(`items.${index}.colorCode`, roll.color_code ?? '');
        if (roll.weight_kg) {
          setValue(`items.${index}.quantity`, roll.weight_kg);
          setValue(`items.${index}.unit`, 'kg');
        } else if (roll.length_m) {
          setValue(`items.${index}.quantity`, roll.length_m);
          setValue(`items.${index}.unit`, 'm');
        }
      }
    }
  }

  // Get available qty for selected stock (for display + validation)
  function getMaxAvailableQty(): { label: string; max: number } | null {
    const sourceId = (control._formValues as OrdersFormValues).items?.[index]
      ?.sourceStockId;
    if (!sourceId) return null;

    if (productCategory === 'yarn') {
      const yarn = yarnStock.find((y) => y.id === sourceId);
      if (yarn)
        return {
          label: `Khả dụng: ${formatQuantity(yarn.available_qty)} ${yarn.unit}`,
          max: yarn.available_qty,
        };
    } else if (productCategory === 'raw_fabric') {
      const roll = rawRolls.find((r) => r.id === sourceId);
      if (roll) {
        const qty = roll.weight_kg ?? roll.length_m ?? 0;
        const unit = roll.weight_kg ? 'kg' : 'm';
        return { label: `Cuộn: ${formatQuantity(qty)} ${unit}`, max: qty };
      }
    } else if (productCategory === 'finished_fabric') {
      const roll = finishedRolls.find((r) => r.id === sourceId);
      if (roll) {
        const qty = roll.weight_kg ?? roll.length_m ?? 0;
        const unit = roll.weight_kg ? 'kg' : 'm';
        return { label: `Cuộn: ${formatQuantity(qty)} ${unit}`, max: qty };
      }
    }
    return null;
  }

  const stockInfo = getMaxAvailableQty();
  const currentQty =
    (control._formValues as OrdersFormValues).items?.[index]?.quantity ?? 0;
  const isOverStock = stockInfo !== null && currentQty > stockInfo.max;

  return (
    <div className="form-item-box">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted">
            Dòng Hàng #{index + 1}
          </span>
          <Badge variant="info">Thương mại</Badge>
        </div>
        {canRemove && (
          <button
            className="btn-icon danger"
            type="button"
            title="Xóa dòng"
            onClick={onRemove}
          >
            Xóa
          </button>
        )}
      </div>

      <div className="form-grid">
        {/* Row 1: Product Category + Stock Picker */}
        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
          <div className="form-field">
            <label>
              Loại sản phẩm <span className="field-required">*</span>
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
              Chọn từ kho <span className="field-required">*</span>
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
                      ? 'Chọn loại sợi...'
                      : 'Chọn cuộn vải...'
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
              <label htmlFor={`items.${index}.sourceLotNumber`}>
                Số lô (Lot)
              </label>
              {lotOptions.length > 0 ? (
                <Controller
                  name={`items.${index}.sourceLotNumber`}
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={lotOptions}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="Chọn lô..."
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
              <label>Tên sợi (tự động)</label>
              <input
                className="field-input bg-[var(--surface-disabled)]"
                type="text"
                readOnly
                {...register(`items.${index}.fabricType`)}
              />
            </div>
          </div>
        )}

        {/* Row 3: Fabric info (auto-filled, readonly for roll-based) */}
        {productCategory !== 'yarn' && (
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>Loại vải</label>
              <input
                className="field-input bg-[var(--surface-disabled)]"
                type="text"
                readOnly
                {...register(`items.${index}.fabricType`)}
              />
            </div>
            <div className="form-field">
              <label>Màu</label>
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
              Số lượng <span className="field-required">*</span>
            </label>
            <input
              id={`items.${index}.quantity`}
              className={`field-input${itemErrors?.quantity ? ' is-error' : ''}`}
              type="number"
              step="0.001"
              min="0"
              placeholder="0"
              {...register(`items.${index}.quantity`, { valueAsNumber: true })}
            />
            {isOverStock && (
              <span className="field-error">
                Vượt quá tồn kho khả dụng ({formatQuantity(stockInfo?.max ?? 0)}
                )
              </span>
            )}
            {itemErrors?.quantity && (
              <span className="field-error">{itemErrors.quantity.message}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor={`items.${index}.unitPrice`}>
              Đơn giá (đ) <span className="field-required">*</span>
            </label>
            <Controller
              name={`items.${index}.unitPrice`}
              control={control}
              render={({ field }) => (
                <CurrencyInput
                  id={`items.${index}.unitPrice`}
                  className={`field-input${itemErrors?.unitPrice ? ' is-error' : ''}`}
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
