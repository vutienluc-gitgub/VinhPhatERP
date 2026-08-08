import { Controller } from 'react-hook-form';
import type {
  UseFormRegister,
  Control,
  FieldErrors,
  UseFormReset,
  UseFormSetValue,
} from 'react-hook-form';

import { Combobox } from '@/shared/components/Combobox';
import { MoneyInput, LengthInput } from '@/shared/value';
import type {
  BulkFinishedInputFormValues,
  BulkFinishedRollRowInput,
} from '@/schema/finished-fabric.schema';
import type { PurchaseOrderItem } from '@/domain/purchase-orders/purchase-order.types';
import { FINISHED_FABRIC_BULK_CONFIG_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';

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
  poComboOptions?: { value: string; label: string }[];
  poItemComboOptions?: {
    value: string;
    label: string;
    itemDetails?: PurchaseOrderItem;
  }[];
  importFromPo?: boolean;
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
  poComboOptions = [],
  poItemComboOptions = [],
  importFromPo = false,
}: FinishedFabricBulkFormStep1GeneralProps) {
  return (
    <fieldset className="bulk-section">
      <legend>{MSG.TITLE}</legend>

      <div className="form-field mb-4 pb-4 border-b border-border">
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
                  status: 'in_stock',
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
                  status: 'pending_qc',
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
        <div className="mb-4 pb-4 border-b border-border bg-[#f8fafc] p-4 rounded-md flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="bulk_import_from_po"
              {...register('import_from_po')}
            />
            <label
              htmlFor="bulk_import_from_po"
              className="font-medium cursor-pointer"
            >
              Nhập từ Đơn đặt hàng (PO)
            </label>
          </div>

          {importFromPo && (
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] p-3 bg-surface border border-border rounded-md">
              <div className="form-field">
                <label>{MSG.LBL_DYEING_PO}</label>
                <Controller
                  name="po_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={poComboOptions}
                      value={field.value ?? ''}
                      onChange={(val) => {
                        field.onChange(val);
                        // Reset item selection when PO changes
                        setValue('po_item_id', null);
                      }}
                      placeholder="{MSG.VAL_CHOOSE_PO}"
                    />
                  )}
                />
              </div>

              <div className="form-field">
                <label>{MSG.LBL_PO_ITEM}</label>
                <Controller
                  name="po_item_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={poItemComboOptions}
                      value={field.value ?? ''}
                      onChange={(val) => {
                        field.onChange(val);
                      }}
                      placeholder="{MSG.VAL_CHOOSE_PO_ITEM}"
                      disabled={
                        !control._formValues.po_id ||
                        poItemComboOptions.length === 0
                      }
                    />
                  )}
                />
              </div>
            </div>
          )}

          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="bulk_supplier_id">
                {MSG.LBL_DYEING_PARTNER}{' '}
                <span className="field-required">*</span>
              </label>
              <Controller
                name="supplier_id"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={supplierComboOptions}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="{MSG.VAL_CHOOSE_DYER}"
                    hasError={!!errors.supplier_id}
                    disabled={importFromPo}
                  />
                )}
              />
              {errors.supplier_id && (
                <span className="field-error">
                  {errors.supplier_id.message}
                </span>
              )}
            </div>
            <div className="form-field">
              <label htmlFor="bulk_document_number">
                Số chứng từ (Hóa đơn/Phiếu giao)
              </label>
              <input
                id="bulk_document_number"
                className="field-input"
                type="text"
                placeholder="VD: HD-12345"
                {...register('document_number')}
              />
            </div>
            <div className="form-field">
              <label htmlFor="bulk_purchase_price">Giá nhập lô</label>
              <div className="flex">
                <Controller
                  name="purchase_price"
                  control={control}
                  render={({ field }) => (
                    <MoneyInput
                      id="bulk_purchase_price"
                      className={`field-input rounded-r-none border-r-0 ${errors.purchase_price ? ' border-danger' : ''}`}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="VD: 50000"
                    />
                  )}
                />
                {/* eslint-disable-next-line no-restricted-syntax */}
                <select
                  className="field-input rounded-l-none bg-muted/50 w-[110px]"
                  {...register('purchase_price_unit')}
                >
                  <option value="VND/m">VNĐ / Mét</option>
                  <option value="VND/kg">VNĐ / Kg</option>
                </select>
              </div>
              {errors.purchase_price && (
                <span className="field-error">
                  {errors.purchase_price.message}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="bulk_lot_number">
            {MSG.LBL_LOT_NUMBER} <span className="field-required">*</span>
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
            {sourceType === 'produced'
              ? 'Bắt buộc. Hệ thống sẽ đối chiếu với lô cuộn mộc nguồn.'
              : 'Nhập mã lô của nhà cung cấp hoặc mã lô quản lý nội bộ.'}

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
            {MSG.LBL_FABRIC_TYPE} <span className="field-required">*</span>
          </label>
          <Controller
            name="fabric_type"
            control={control}
            render={({ field }) => (
              <Combobox
                options={fabricComboOptions}
                value={field.value}
                onChange={field.onChange}
                placeholder="{MSG.VAL_CHOOSE_FABRIC}"
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
          <label htmlFor="bulk_color_name">{MSG.LBL_COLOR}</label>
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
        <Controller
          name="width_cm"
          control={control}
          render={({ field }) => (
            <LengthInput
              id="bulk_width_cm"
              className={`field-input${errors.width_cm ? ' border-danger' : ''}`}
              step="0.01"
              min="0"
              placeholder="VD: 150"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

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
          <label htmlFor="bulk_production_date">
            {MSG.LBL_PRODUCTION_DATE}
          </label>
          <input
            id="bulk_production_date"
            className="field-input"
            type="date"
            {...register('production_date')}
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="bulk_warehouse_location">{MSG.LBL_WAREHOUSE}</label>
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
