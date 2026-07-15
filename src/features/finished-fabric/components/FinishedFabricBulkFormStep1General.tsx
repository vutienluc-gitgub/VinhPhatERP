import { Controller } from 'react-hook-form';
import type {
  UseFormRegister,
  Control,
  FieldErrors,
  UseFormReset,
  UseFormSetValue,
} from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import type {
  BulkFinishedInputFormValues,
  BulkFinishedRollRowInput,
} from '@/schema/finished-fabric.schema';

type FinishedFabricBulkFormStep1GeneralProps = {
  register: UseFormRegister<BulkFinishedInputFormValues>;
  control: Control<BulkFinishedInputFormValues>;
  errors: FieldErrors<BulkFinishedInputFormValues>;
  reset: UseFormReset<BulkFinishedInputFormValues>;
  setValue: UseFormSetValue<BulkFinishedInputFormValues>;
  sourceType: 'produced' | 'purchased' | undefined;
  supplierComboOptions: { value: string; label: string }[];
  fabricComboOptions: { value: string; label: string }[];
  colorComboboxOptions: { value: string; label: string; code?: string }[];
  qualityOptions: { value: string; label: string }[];
  statusOptions: { value: string; label: string }[];
  rawRollsForLotLength: number;
};

export function FinishedFabricBulkFormStep1General({
  register,
  control,
  errors,
  reset,
  setValue,
  sourceType,
  supplierComboOptions,
  fabricComboOptions,
  colorComboboxOptions,
  qualityOptions,
  statusOptions,
  rawRollsForLotLength,
}: FinishedFabricBulkFormStep1GeneralProps) {
  return (
    <fieldset className="bulk-section">
      <legend>Thông tin lô & chung</legend>

      <div className="form-field mb-4 pb-4 border-b border-border">
        <label>Nguồn gốc nhập kho</label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="source_type"
              value="produced"
              checked={sourceType === 'produced' || !sourceType}
              onChange={() => {
                setValue('source_type', 'produced');
                reset({
                  ...control._formValues,
                  source_type: 'produced',
                  supplier_id: null,
                  purchase_price: undefined,
                } as BulkFinishedInputFormValues);
              }}
            />
            Tự sản xuất (từ cuộn mộc)
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="source_type"
              value="purchased"
              checked={sourceType === 'purchased'}
              onChange={() => {
                setValue('source_type', 'purchased');
                reset({
                  ...control._formValues,
                  source_type: 'purchased',
                } as BulkFinishedInputFormValues);
                const currentRolls = control._formValues.rolls || [];
                const updatedRolls = currentRolls.map(
                  (r: BulkFinishedRollRowInput) => ({
                    ...r,
                    raw_roll_id: '',
                  }),
                );
                setValue(
                  'rolls',
                  updatedRolls as unknown as BulkFinishedInputFormValues['rolls'],
                );
              }}
            />
            Mua trực tiếp (thương mại)
          </label>
        </div>
      </div>

      {sourceType === 'purchased' && (
        <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] mb-4 pb-4 border-b border-border bg-[#f8fafc] p-4 rounded-md">
          <div className="form-field">
            <label htmlFor="bulk_supplier_id">
              Nhà cung cấp <span className="field-required">*</span>
            </label>
            <Controller
              name="supplier_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={supplierComboOptions}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  placeholder="— Chọn nhà cung cấp —"
                  hasError={!!errors.supplier_id}
                />
              )}
            />
            {errors.supplier_id && (
              <span className="field-error">{errors.supplier_id.message}</span>
            )}
          </div>
          <div className="form-field">
            <label htmlFor="bulk_purchase_price">Giá nhập lô (VNĐ)</label>
            <input
              id="bulk_purchase_price"
              className={`field-input${errors.purchase_price ? ' border-danger' : ''}`}
              type="number"
              min="0"
              placeholder="VD: 50000"
              {...register('purchase_price')}
            />
            {errors.purchase_price && (
              <span className="field-error">
                {errors.purchase_price.message}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="bulk_lot_number">
            Số lô (Lot number) <span className="field-required">*</span>
          </label>
          <input
            id="bulk_lot_number"
            className={`field-input${errors.lot_number ? ' border-danger' : ''}`}
            type="text"
            placeholder="VD: LOT-2026-001"
            {...register('lot_number')}
          />
          {errors.lot_number && (
            <span className="field-error">{errors.lot_number.message}</span>
          )}
          <span className="field-hint mt-1 block">
            Bắt buộc. Hệ thống sẽ đối chiếu với lô cuộn mộc nguồn.
            {rawRollsForLotLength > 0 && (
              <strong>
                {' '}
                — Tìm thấy {rawRollsForLotLength} cuộn mộc trong lô này.
              </strong>
            )}
          </span>
        </div>

        <div className="form-field">
          <label htmlFor="bulk_fabric_type">
            Loại vải <span className="field-required">*</span>
          </label>
          <Controller
            name="fabric_type"
            control={control}
            render={({ field }) => (
              <Combobox
                options={fabricComboOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="Chọn loại vải..."
                hasError={!!errors.fabric_type}
              />
            )}
          />
          {errors.fabric_type && (
            <span className="field-error">{errors.fabric_type.message}</span>
          )}
        </div>
      </div>

      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="bulk_color_name">Màu vải</label>
          <Controller
            name="color_name"
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
        <div className="form-field">
          <label htmlFor="bulk_color_code">Mã màu</label>
          <input
            id="bulk_color_code"
            className="field-input"
            type="text"
            placeholder="VD: TC-01"
            {...register('color_code')}
          />
        </div>
      </div>

      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="bulk_width_cm">Khổ vải (cm)</label>
          <input
            id="bulk_width_cm"
            className={`field-input${errors.width_cm ? ' border-danger' : ''}`}
            type="number"
            step="0.01"
            min="0"
            placeholder="VD: 150"
            {...register('width_cm')}
          />
          {errors.width_cm && (
            <span className="field-error">{errors.width_cm.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="bulk_quality_grade">Chất lượng mặc định</label>
          <Controller
            name="quality_grade"
            control={control}
            render={({ field }) => (
              <Combobox
                options={qualityOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="bulk_status">Trạng thái</label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Combobox
                options={statusOptions}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="form-field">
          <label htmlFor="bulk_production_date">Ngày hoàn thành</label>
          <input
            id="bulk_production_date"
            className="field-input"
            type="date"
            {...register('production_date')}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="bulk_warehouse_location">Vị trí kho</label>
        <input
          id="bulk_warehouse_location"
          className="field-input"
          type="text"
          placeholder="VD: B2-R1-S4"
          {...register('warehouse_location')}
        />
      </div>
    </fieldset>
  );
}
