import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { OrderRequestFormValues } from '@/schema/order-request.schema';
import { Icon, VPCombobox, VPSelect } from '@/shared/components';
import { toColorComboboxOptions } from '@/shared/hooks/useColorOptions';
import { QuantityInput } from '@/shared/value';

export interface OrderRequestItemRowProps {
  index: number;
  control: Control<OrderRequestFormValues>;
  register: UseFormRegister<OrderRequestFormValues>;
  errors: FieldErrors<OrderRequestFormValues>;
  setValue: UseFormSetValue<OrderRequestFormValues>;
  onRemove: () => void;
  canRemove: boolean;
  fabricOptions: Array<{ name: string; unit?: string }>;
  fabricComboOptions: Array<{ value: string; label: string }>;
  colorOptions: Parameters<typeof toColorComboboxOptions>[0];
  unitOptions: Array<{ value: string; label: string }>;
}

export function OrderRequestItemRow({
  index,
  control,
  register,
  errors,
  setValue,
  onRemove,
  canRemove,
  fabricOptions,
  fabricComboOptions,
  colorOptions,
  unitOptions,
}: OrderRequestItemRowProps) {
  const itemErrors = errors.items?.[index];

  return (
    <div className="p-3 rounded-lg border border-border bg-surface relative">
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-danger rounded-lg bg-background"
          aria-label="Xóa dòng"
        >
          <Icon name="X" size={14} />
        </button>
      )}

      <div className="form-grid form-grid-2 mb-3">
        <div className="form-field">
          <label>
            Loại vải <span className="field-required">*</span>
          </label>
          <Controller
            name={`items.${index}.fabric_type`}
            control={control}
            render={({ field }) => (
              <VPCombobox
                options={fabricComboOptions}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  const selected = fabricOptions.find((f) => f.name === val);
                  if (selected?.unit) {
                    const unitVal =
                      selected.unit.toLowerCase() === 'mét'
                        ? 'm'
                        : selected.unit.toLowerCase();
                    setValue(`items.${index}.unit`, unitVal);
                  }
                }}
                placeholder="VD: Cotton 65/35"
                hasError={!!itemErrors?.fabric_type}
                allowCreatable
              />
            )}
          />
          {itemErrors?.fabric_type && (
            <p className="field-error">{itemErrors.fabric_type.message}</p>
          )}
        </div>

        <div className="form-field">
          <label>Màu sắc</label>
          <Controller
            name={`items.${index}.color_name`}
            control={control}
            render={({ field }) => (
              <VPCombobox
                options={toColorComboboxOptions(colorOptions)}
                value={field.value || ''}
                onChange={field.onChange}
                placeholder="VD: Trắng tiêu chuẩn, Xanh đen"
                allowCreatable
              />
            )}
          />
        </div>
      </div>

      <div className="form-grid form-grid-3">
        <div className="form-field">
          <label>
            Số lượng <span className="field-required">*</span>
          </label>
          <Controller
            name={`items.${index}.quantity`}
            control={control}
            render={({ field }) => (
              <QuantityInput
                min="1"
                className={`field-input${itemErrors?.quantity ? ' border-danger' : ''}`}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
              />
            )}
          />
          {itemErrors?.quantity && (
            <p className="field-error">{itemErrors.quantity.message}</p>
          )}
        </div>

        <div className="form-field">
          <label>Đơn vị</label>
          <Controller
            name={`items.${index}.unit`}
            control={control}
            render={({ field }) => (
              <VPSelect
                options={unitOptions}
                value={field.value}
                onValueChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="form-field">
          <label>Ghi chú mặt hàng</label>
          <input
            {...register(`items.${index}.notes`)}
            placeholder="VD: Định lượng 220gsm"
            className="form-input"
          />
        </div>
      </div>
    </div>
  );
}
