import { Controller } from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import { MoneyInput, QuantityInput, NumericInput } from '@/shared/value';
import {
  LABEL_ORIGIN,
  ORIGIN_OPTIONS,
  ORIGIN_PLACEHOLDER,
} from '@/shared/constants/origin.constants';
import {
  ITEM_ROW_LABELS as L,
  YARN_UNIT_OPTIONS,
} from '@/features/yarn-receipts/yarn-receipts.constants';
import { useYarnReceiptItemRow } from '@/features/yarn-receipts/hooks/useYarnReceiptItemRow';

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
  const { control, register, itemErrors, handleYarnTypeChange } =
    useYarnReceiptItemRow(index, yarnCatalogs);

  return (
    <div className="form-item-box">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[0.85rem] font-semibold text-muted-foreground">
          {L.ROW} {index + 1}
        </span>
        {canRemove && onRemove && (
          <button
            className="btn-icon danger text-[0.85rem]"
            type="button"
            title={L.DELETE_ROW}
            onClick={onRemove}
          >
            ✕
          </button>
        )}
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.yarnType`}>
            {L.YARN_TYPE} <span className="field-required">*</span>
          </label>
          <Controller
            name={`items.${index}.yarnType` as const}
            control={control}
            render={({ field }) => (
              <Combobox
                options={yarnCatalogOptions}
                value={field.value}
                onChange={(val) => handleYarnTypeChange(val, field.onChange)}
                placeholder={L.YARN_TYPE_PLACEHOLDER}
                hasError={!!itemErrors?.yarnType}
              />
            )}
          />
          {itemErrors?.yarnType && (
            <span className="field-error">{itemErrors.yarnType.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.colorName`}>{L.COLOR}</label>
          <Controller
            name={`items.${index}.colorName` as const}
            control={control}
            render={({ field }) => (
              <Combobox
                options={colorComboboxOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder={L.COLOR_PLACEHOLDER}
              />
            )}
          />
        </div>
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.quantity`}>
            {L.QUANTITY} <span className="field-required">*</span>
          </label>
          <Controller
            name={`items.${index}.quantity` as const}
            control={control}
            render={({ field }) => (
              <QuantityInput
                id={`items.${index}.quantity`}
                className={`field-input${itemErrors?.quantity ? ' border-danger' : ''}`}
                value={field.value}
                onChange={(val) => field.onChange(val ?? 0)}
                onBlur={field.onBlur}
                placeholder="0"
                decimals={4}
              />
            )}
          />
          {itemErrors?.quantity && (
            <span className="field-error">{itemErrors.quantity.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.unitPrice`}>
            {L.UNIT_PRICE} <span className="field-required">*</span>
          </label>
          <Controller
            name={`items.${index}.unitPrice` as const}
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
            <span className="field-error">{itemErrors.unitPrice.message}</span>
          )}
        </div>
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.lotNumber`}>{L.LOT_NUMBER}</label>
          <input
            id={`items.${index}.lotNumber`}
            className="field-input"
            type="text"
            placeholder={L.LOT_NUMBER_PLACEHOLDER}
            {...register(`items.${index}.lotNumber` as const)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.grade`}>{L.GRADE}</label>
          <input
            id={`items.${index}.grade`}
            className="field-input"
            type="text"
            placeholder={L.GRADE_PLACEHOLDER}
            {...register(`items.${index}.grade` as const)}
          />
        </div>
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.unit`}>{L.UNIT}</label>
          <Controller
            name={`items.${index}.unit` as const}
            control={control}
            render={({ field }) => (
              <Combobox
                options={YARN_UNIT_OPTIONS}
                value={field.value}
                onChange={field.onChange}
                placeholder={L.UNIT_PLACEHOLDER}
              />
            )}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.tensileStrength`}>
            {L.TENSILE_STRENGTH}
          </label>
          <input
            id={`items.${index}.tensileStrength`}
            className="field-input"
            type="text"
            placeholder={L.TENSILE_STRENGTH_PLACEHOLDER}
            {...register(`items.${index}.tensileStrength` as const)}
          />
        </div>
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.composition`}>{L.COMPOSITION}</label>
          <input
            id={`items.${index}.composition`}
            className="field-input"
            type="text"
            placeholder={L.COMPOSITION_PLACEHOLDER}
            {...register(`items.${index}.composition` as const)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.origin`}>{LABEL_ORIGIN}</label>
          <Controller
            name={`items.${index}.origin` as const}
            control={control}
            render={({ field }) => (
              <Combobox
                id={`items.${index}.origin`}
                options={ORIGIN_OPTIONS}
                value={field.value ?? undefined}
                onChange={(val) => field.onChange(val || null)}
                allowInput
                placeholder={ORIGIN_PLACEHOLDER}
              />
            )}
          />
        </div>
      </div>

      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.dtex`}>{L.DTEX}</label>
          <input
            id={`items.${index}.dtex`}
            className="field-input"
            type="text"
            placeholder={L.DTEX_PLACEHOLDER}
            {...register(`items.${index}.dtex` as const)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.twist`}>{L.TWIST}</label>
          <input
            id={`items.${index}.twist`}
            className="field-input"
            type="text"
            placeholder={L.TWIST_PLACEHOLDER}
            {...register(`items.${index}.twist` as const)}
          />
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.machineNo`}>{L.MACHINE_NO}</label>
          <input
            id={`items.${index}.machineNo`}
            className="field-input"
            type="text"
            placeholder={L.MACHINE_NO_PLACEHOLDER}
            {...register(`items.${index}.machineNo` as const)}
          />
        </div>
      </div>

      {/* ── Thông tin từ tem nhãn nhà sản xuất ── */}
      <div className="form-grid form-grid-auto">
        <div className="form-field">
          <label htmlFor={`items.${index}.netWeight`}>{L.NET_WEIGHT}</label>
          <Controller
            name={`items.${index}.netWeight` as const}
            control={control}
            render={({ field }) => (
              <QuantityInput
                id={`items.${index}.netWeight`}
                className={`field-input${itemErrors?.netWeight ? ' border-danger' : ''}`}
                value={field.value}
                onChange={(val) => field.onChange(val ?? null)}
                onBlur={field.onBlur}
                placeholder={L.NET_WEIGHT_PLACEHOLDER}
                decimals={4}
              />
            )}
          />
          {itemErrors?.netWeight && (
            <span className="field-error">{itemErrors.netWeight.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor={`items.${index}.grossWeight`}>{L.GROSS_WEIGHT}</label>
          <Controller
            name={`items.${index}.grossWeight` as const}
            control={control}
            render={({ field }) => (
              <QuantityInput
                id={`items.${index}.grossWeight`}
                className={`field-input${itemErrors?.grossWeight ? ' border-danger' : ''}`}
                value={field.value}
                onChange={(val) => field.onChange(val ?? null)}
                onBlur={field.onBlur}
                placeholder={L.GROSS_WEIGHT_PLACEHOLDER}
                decimals={4}
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
          <label htmlFor={`items.${index}.serialNumber`}>
            {L.SERIAL_NUMBER}
          </label>
          <input
            id={`items.${index}.serialNumber`}
            className="field-input"
            type="text"
            placeholder={L.SERIAL_NUMBER_PLACEHOLDER}
            {...register(`items.${index}.serialNumber` as const)}
          />
        </div>

        <Controller
          name={`items.${index}.productionWeek` as const}
          control={control}
          render={({ field }) => (
            <NumericInput
              id={`items.${index}.productionWeek`}
              className="field-input"
              min={1}
              max={53}
              placeholder={L.PROD_WEEK_PLACEHOLDER}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <div className="form-field">
          <label htmlFor={`items.${index}.dist`}>{L.DIST}</label>
          <input
            id={`items.${index}.dist`}
            className="field-input"
            type="text"
            placeholder={L.DIST_PLACEHOLDER}
            {...register(`items.${index}.dist` as const)}
          />
        </div>
      </div>

      {/* ── Quy cách đóng gói ── */}
      <div className="form-grid form-grid-auto">
        <Controller
          name={`items.${index}.conesPerBox` as const}
          control={control}
          render={({ field }) => (
            <NumericInput
              id={`items.${index}.conesPerBox`}
              className={`field-input${itemErrors?.conesPerBox ? ' border-danger' : ''}`}
              min={1}
              placeholder={L.CONES_PER_BOX_PLACEHOLDER}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Controller
          name={`items.${index}.boxCount` as const}
          control={control}
          render={({ field }) => (
            <QuantityInput
              id={`items.${index}.boxCount`}
              className={`field-input${itemErrors?.boxCount ? ' border-danger' : ''}`}
              min={1}
              placeholder={L.BOX_COUNT_PLACEHOLDER}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <div className="form-field">
          <label htmlFor={`items.${index}.boxNo`}>{L.BOX_NO}</label>
          <input
            id={`items.${index}.boxNo`}
            className="field-input"
            type="text"
            placeholder={L.BOX_NO_PLACEHOLDER}
            {...register(`items.${index}.boxNo` as const)}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-field">
          <label htmlFor={`items.${index}.notes`}>{L.NOTES}</label>
          <input
            id={`items.${index}.notes`}
            className="field-input"
            type="text"
            placeholder={L.NOTES_PLACEHOLDER}
            {...register(`items.${index}.notes` as const)}
          />
        </div>
      </div>
    </div>
  );
}
