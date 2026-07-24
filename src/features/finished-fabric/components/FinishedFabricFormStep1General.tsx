import { Controller } from 'react-hook-form';
import type {
  UseFormRegister,
  Control,
  FieldErrors,
  UseFormReset,
  UseFormSetValue,
} from 'react-hook-form';
import type { UseMutationResult } from '@tanstack/react-query';

import { Combobox } from '@/shared/components/Combobox';
import { AdvancedImageUploader } from '@/shared/components';
import type { FinishedFabricFormValues } from '@/schema/finished-fabric.schema';
import { FINISHED_FABRIC_FORM_LABELS as MSG } from '@/features/finished-fabric/finished-fabric.constants';

type FinishedFabricFormStep1GeneralProps = {
  register: UseFormRegister<FinishedFabricFormValues>;
  control: Control<FinishedFabricFormValues>;
  errors: FieldErrors<FinishedFabricFormValues>;
  reset: UseFormReset<FinishedFabricFormValues>;
  setValue: UseFormSetValue<FinishedFabricFormValues>;
  isLocked: boolean;
  currentImageUrl: string | null;
  uploadImageMutation: UseMutationResult<string, Error, File, unknown>;
  deleteImageMutation: UseMutationResult<void, Error, string, unknown>;
  fabricComboOptions: { value: string; label: string }[];
  rawRollComboOptions: { value: string; label: string }[];
  supplierComboOptions: { value: string; label: string }[];
  sourceType: 'produced' | 'purchased';
  setSourceType: (type: 'produced' | 'purchased') => void;
};

export function FinishedFabricFormStep1General({
  register,
  control,
  errors,
  reset,
  setValue,
  isLocked,
  currentImageUrl,
  uploadImageMutation,
  deleteImageMutation,
  fabricComboOptions,
  rawRollComboOptions,
  supplierComboOptions,
  sourceType,
  setSourceType,
}: FinishedFabricFormStep1GeneralProps) {
  return (
    <div className="form-grid">
      <div className="form-field">
        <label>Ảnh sản phẩm</label>
        <AdvancedImageUploader
          value={currentImageUrl}
          uploadFn={async (file) => uploadImageMutation.mutateAsync(file)}
          onSuccess={(url) => setValue('image_url', url)}
          onRemove={() => {
            const currentUrl = currentImageUrl;
            setValue('image_url', null);
            if (currentUrl) {
              deleteImageMutation.mutate(currentUrl);
            }
          }}
          disabled={isLocked}
        />
      </div>

      <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        <div className="form-field">
          <label htmlFor="roll_number">
            {MSG.LBL_ROLL_NUMBER} <span className="field-required">*</span>
          </label>
          <input
            id="roll_number"
            className={`field-input${errors.roll_number ? ' border-danger' : ''}`}
            type="text"
            placeholder="VD: FN-2026-001"
            {...register('roll_number')}
          />
          {errors.roll_number && (
            <span className="field-error">{errors.roll_number.message}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="fabric_type">
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

      <div className="form-field mb-4 pb-4 border-b border-border">
        <label>Nguồn gốc nhập kho</label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="sourceType"
              value="produced"
              checked={sourceType === 'produced'}
              onChange={() => {
                setSourceType('produced');
                reset({
                  ...control._formValues,
                  supplier_id: null,
                  purchase_price: undefined,
                } as FinishedFabricFormValues);
              }}
              disabled={isLocked}
            />
            Tự sản xuất (từ cuộn mộc)
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="sourceType"
              value="purchased"
              checked={sourceType === 'purchased'}
              onChange={() => {
                setSourceType('purchased');
                reset({
                  ...control._formValues,
                  raw_roll_id: '',
                } as FinishedFabricFormValues);
              }}
              disabled={isLocked}
            />
            Mua trực tiếp (thương mại)
          </label>
        </div>
      </div>

      {sourceType === 'produced' ? (
        <div className="form-field">
          <label htmlFor="raw_roll_id">
            {MSG.LBL_RAW_ROLL} <span className="field-required">*</span>
          </label>
          <Controller
            name="raw_roll_id"
            control={control}
            render={({ field }) => (
              <Combobox
                options={rawRollComboOptions}
                value={field.value ?? ''}
                onChange={field.onChange}
                placeholder={MSG.VAL_CHOOSE_RAW}
                hasError={!!errors.raw_roll_id}
              />
            )}
          />
          {errors.raw_roll_id && (
            <span className="field-error">{errors.raw_roll_id.message}</span>
          )}
          <span className="field-hint">{MSG.HINT_RAW_ROLL}</span>
        </div>
      ) : (
        <div className="form-field">
          <label htmlFor="supplier_id">
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
          <span className="field-hint">
            Đơn giá mua được quản lý bởi phòng Kế toán/Mua hàng.
          </span>
        </div>
      )}
    </div>
  );
}
