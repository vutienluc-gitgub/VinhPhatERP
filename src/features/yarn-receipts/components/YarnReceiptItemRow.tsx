import { Controller, useFormContext } from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import { CurrencyInput } from '@/shared/components/CurrencyInput';
import { FormattedInput } from '@/shared/components/FormattedInput';
import type { YarnReceiptsFormValues } from '@/schema/yarn-receipt.schema';

const YARN_UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'cuộn', label: 'cuộn' },
  { value: 'tấn', label: 'tấn' },
];

type ComboboxOption = { value: string; label: string; code?: string };

export type YarnReceiptItemRowProps = {
  index: number;
  onRemove?: () => void;
  canRemove: boolean;
  yarnCatalogOptions: ComboboxOption[];
  colorComboboxOptions: ComboboxOption[];
  yarnCatalogs: {
    id: string;
    name: string;
    color_name: string | null;
    composition: string | null;
    tensile_strength: string | null;
    origin: string | null;
    grade: string | null;
    unit: string;
  }[];
};

export function YarnReceiptItemRow({
  index,
  onRemove,
  canRemove,
  yarnCatalogOptions,
  colorComboboxOptions,
  yarnCatalogs,
}: YarnReceiptItemRowProps) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = useFormContext<YarnReceiptsFormValues>();

  const itemErrors = errors.items?.[index];

  return (
    <div className="form-item-box">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[0.85rem] font-semibold text-muted">
          Dòng {index + 1}
        </span>
        {canRemove && onRemove && (
          <button
            className="btn-icon danger text-[0.85rem]"
            type="button"
            title="Xóa dòng"
            onClick={onRemove}
          >
            ✕
          </button>
        )}
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.yarnType`}>
            Loại sợi <span className="field-required">*</span>
          </label>
          <Controller
            name={`items.${index}.yarnType` as const}
            control={control}
            render={({ field }) => (
              <Combobox
                options={yarnCatalogOptions}
                value={field.value}
                onChange={(val) => {
                  field.onChange(val);
                  const cat = yarnCatalogs.find((c) => c.name === val);
                  if (cat) {
                    setValue(`items.${index}.yarnCatalogId`, cat.id);
                    setValue(`items.${index}.colorName`, cat.color_name ?? '');
                    setValue(
                      `items.${index}.composition`,
                      cat.composition ?? '',
                    );
                    setValue(
                      `items.${index}.tensileStrength`,
                      cat.tensile_strength ?? '',
                    );
                    setValue(`items.${index}.origin`, cat.origin ?? '');
                    setValue(`items.${index}.grade`, cat.grade ?? '');
                    setValue(`items.${index}.unit`, cat.unit ?? 'kg');
                  } else {
                    setValue(`items.${index}.yarnCatalogId`, '');
                  }
                }}
                placeholder="Chọn hoặc nhập loại sợi..."
                hasError={!!itemErrors?.yarnType}
              />
            )}
          />
          {itemErrors?.yarnType && (
            <span className="field-error">{itemErrors.yarnType.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.colorName`}>Màu sợi</label>
          <Controller
            name={`items.${index}.colorName` as const}
            control={control}
            render={({ field }) => (
              <Combobox
                options={colorComboboxOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder="Chọn hoặc nhập màu..."
              />
            )}
          />
        </div>
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.quantity`}>
            Số lượng <span className="field-required">*</span>
          </label>
          <Controller
            name={`items.${index}.quantity` as const}
            control={control}
            render={({ field }) => (
              <FormattedInput
                id={`items.${index}.quantity`}
                className={`field-input${itemErrors?.quantity ? ' is-error' : ''}`}
                value={field.value}
                onChange={(val) => field.onChange(val ?? 0)}
                onBlur={field.onBlur}
                placeholder="0"
              />
            )}
          />
          {itemErrors?.quantity && (
            <span className="field-error">{itemErrors.quantity.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.unitPrice`}>
            Đơn giá <span className="field-required">*</span>
          </label>
          <Controller
            name={`items.${index}.unitPrice` as const}
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
            <span className="field-error">{itemErrors.unitPrice.message}</span>
          )}
        </div>
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.lotNumber`}>Số lô (Lot)</label>
          <input
            id={`items.${index}.lotNumber`}
            className="field-input"
            type="text"
            placeholder="VD: LOT-2026-03-A"
            {...register(`items.${index}.lotNumber` as const)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.grade`}>Phân loại (Grade)</label>
          <input
            id={`items.${index}.grade`}
            className="field-input"
            type="text"
            placeholder="VD: A, B..."
            {...register(`items.${index}.grade` as const)}
          />
        </div>
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.unit`}>Đơn vị</label>
          <Controller
            name={`items.${index}.unit` as const}
            control={control}
            render={({ field }) => (
              <Combobox
                options={YARN_UNIT_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder="Chọn..."
              />
            )}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.tensileStrength`}>Cường lực</label>
          <input
            id={`items.${index}.tensileStrength`}
            className="field-input"
            type="text"
            placeholder="VD: 18 cN/tex"
            {...register(`items.${index}.tensileStrength` as const)}
          />
        </div>
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.composition`}>Thành phần</label>
          <input
            id={`items.${index}.composition`}
            className="field-input"
            type="text"
            placeholder="VD: 100% Cotton"
            {...register(`items.${index}.composition` as const)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.origin`}>Xuất xứ</label>
          <input
            id={`items.${index}.origin`}
            className="field-input"
            type="text"
            placeholder="VD: Việt Nam"
            {...register(`items.${index}.origin` as const)}
          />
        </div>
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.dtex`}>DTEX/F</label>
          <input
            id={`items.${index}.dtex`}
            className="field-input"
            type="text"
            placeholder="VD: 333dtex/96f"
            {...register(`items.${index}.dtex` as const)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.twist`}>Twist (Xoắn)</label>
          <input
            id={`items.${index}.twist`}
            className="field-input"
            type="text"
            placeholder="VD: Z, S"
            {...register(`items.${index}.twist` as const)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.machineNo`}>Machine No</label>
          <input
            id={`items.${index}.machineNo`}
            className="field-input"
            type="text"
            placeholder="VD: B755"
            {...register(`items.${index}.machineNo` as const)}
          />
        </div>
      </div>

      {/* ── Thông tin từ tem nhãn nhà sản xuất ── */}
      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.netWeight`}>N.W (KL tịnh)</label>
          <Controller
            name={`items.${index}.netWeight` as const}
            control={control}
            render={({ field }) => (
              <FormattedInput
                id={`items.${index}.netWeight`}
                className={`field-input${itemErrors?.netWeight ? ' is-error' : ''}`}
                value={field.value}
                onChange={(val) => field.onChange(val ?? null)}
                onBlur={field.onBlur}
                placeholder="VD: 27.0"
              />
            )}
          />
          {itemErrors?.netWeight && (
            <span className="field-error">{itemErrors.netWeight.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.grossWeight`}>G.W (KL gộp)</label>
          <Controller
            name={`items.${index}.grossWeight` as const}
            control={control}
            render={({ field }) => (
              <FormattedInput
                id={`items.${index}.grossWeight`}
                className={`field-input${itemErrors?.grossWeight ? ' is-error' : ''}`}
                value={field.value}
                onChange={(val) => field.onChange(val ?? null)}
                onBlur={field.onBlur}
                placeholder="VD: 31.0"
              />
            )}
          />
          {itemErrors?.grossWeight && (
            <span className="field-error">
              {itemErrors.grossWeight.message}
            </span>
          )}
        </div>
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.serialNumber`}>Serial Number</label>
          <input
            id={`items.${index}.serialNumber`}
            className="field-input"
            type="text"
            placeholder="VD: 4610037442 DYA5-DA"
            {...register(`items.${index}.serialNumber` as const)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.productionWeek`}>
            Tuần SX (Week)
          </label>
          <input
            id={`items.${index}.productionWeek`}
            className="field-input"
            type="number"
            min={1}
            max={53}
            placeholder="VD: 8"
            {...register(`items.${index}.productionWeek` as const, {
              setValueAs: (v: string) => {
                if (v === '' || v === null || v === undefined) return null;
                const n = Number(v);
                return Number.isNaN(n) ? null : n;
              },
            })}
          />
          {itemErrors?.productionWeek && (
            <span className="field-error">
              {itemErrors.productionWeek.message}
            </span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.dist`}>Dist</label>
          <input
            id={`items.${index}.dist`}
            className="field-input"
            type="text"
            placeholder="VD: A, B..."
            {...register(`items.${index}.dist` as const)}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor={`items.${index}.notes`}>
            Ghi chú (Tự động điền khi quét Barcode)
          </label>
          <input
            id={`items.${index}.notes`}
            className="field-input"
            type="text"
            placeholder="VD: Q'TY: 6 cuộn | Twist: Z | Machine: B755"
            {...register(`items.${index}.notes` as const)}
          />
        </div>
      </div>
    </div>
  );
}
