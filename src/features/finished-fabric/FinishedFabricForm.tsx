import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
import { useStepper } from '@/shared/hooks/useStepper';
import { Combobox } from '@/shared/components/Combobox';
import { ImagePicker } from '@/shared/components/ImagePicker';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import {
  useCreateFinishedFabric,
  useRawRollOptions,
  useUpdateFinishedFabric,
} from '@/application/inventory';
import {
  useUploadFabricImage,
  useDeleteFabricImage,
} from '@/application/inventory/useFabricImage';
import { useAllSuppliers } from '@/shared/hooks';
import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
  finishedFabricDefaults,
  finishedFabricSchema,
} from '@/schema/finished-fabric.schema';
import type { FinishedFabricFormValues } from '@/schema/finished-fabric.schema';
import { getErrorMessage } from '@/shared/utils/error';

import { editBlockReason, getAllowedStatusTransitions } from './transitions';
import type { FinishedFabricRoll, RollStatus } from './types';

type FinishedFabricFormProps = {
  roll: FinishedFabricRoll | null;
  onClose: () => void;
};

const QUALITY_OPTIONS = [
  { value: '', label: 'Chưa kiểm định' },
  ...QUALITY_GRADES.map((g) => ({
    value: g,
    label: QUALITY_GRADE_LABELS[g],
  })),
];

function rollToFormValues(roll: FinishedFabricRoll): FinishedFabricFormValues {
  return {
    roll_number: roll.roll_number,
    raw_roll_id: roll.raw_roll_id ?? '',
    supplier_id: roll.supplier_id ?? null,
    purchase_price: roll.purchase_price
      ? Number(roll.purchase_price)
      : undefined,
    lot_number: roll.lot_number ?? '',
    fabric_type: roll.fabric_type,
    color_name: roll.color_name ?? '',
    color_code: roll.color_code ?? '',
    width_cm: roll.width_cm ?? undefined,
    length_m: roll.length_m ?? undefined,
    weight_kg: roll.weight_kg ?? undefined,
    quality_grade:
      (roll.quality_grade as FinishedFabricFormValues['quality_grade']) ??
      undefined,
    status: roll.status,
    warehouse_location: roll.warehouse_location ?? '',
    production_date: roll.production_date ?? '',
    notes: roll.notes ?? '',
    image_url: roll.image_url ?? null,
  };
}

export function FinishedFabricForm({ roll, onClose }: FinishedFabricFormProps) {
  const isEditing = roll !== null;
  const lockReason = isEditing ? editBlockReason(roll.status) : null;
  const isLocked = lockReason !== null;
  const createMutation = useCreateFinishedFabric();
  const updateMutation = useUpdateFinishedFabric();
  const uploadImageMutation = useUploadFabricImage();
  const deleteImageMutation = useDeleteFabricImage();
  const { data: rawRollOptions = [] } = useRawRollOptions();
  const { data: colorOptions = [] } = useColorOptions();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();
  const [sourceType, setSourceType] = useState<'produced' | 'purchased'>(
    roll?.supplier_id ? 'purchased' : 'produced',
  );

  const fabricComboOptions = useMemo(
    () =>
      fabricOptions.map((f) => ({
        value: f.name,
        label: f.code ? `${f.name} (${f.code})` : f.name,
      })),
    [fabricOptions],
  );

  const { data: suppliersData } = useAllSuppliers({ status: 'active' });
  const supplierComboOptions = useMemo(
    () =>
      (suppliersData || []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.code})`,
      })),
    [suppliersData],
  );

  const rawRollComboOptions = useMemo(
    () =>
      rawRollOptions.map((r) => ({
        value: r.id,
        label: `${r.roll_number} — ${r.fabric_type}${r.color_name ? ` (${r.color_name})` : ''}${r.lot_number ? ` [Lô: ${r.lot_number}]` : ''}`,
      })),
    [rawRollOptions],
  );

  const statusOptions = useMemo(() => {
    const allowedStatuses: RollStatus[] = isEditing
      ? getAllowedStatusTransitions(roll.status)
      : [...ROLL_STATUSES];
    return allowedStatuses.map((s) => ({
      value: s,
      label: ROLL_STATUS_LABELS[s],
    }));
  }, [isEditing, roll?.status]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FinishedFabricFormValues>({
    resolver: zodResolver(finishedFabricSchema),
    defaultValues: isEditing ? rollToFormValues(roll) : finishedFabricDefaults,
  });

  const currentImageUrl = watch('image_url');

  useEffect(() => {
    reset(isEditing ? rollToFormValues(roll) : finishedFabricDefaults);
  }, [roll, isEditing, reset]);

  async function onSubmit(values: FinishedFabricFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: roll.id,
          values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch {
      // Lỗi hiển thị qua mutationError bên dưới
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const stepper = useStepper({
    totalSteps: 3,
    stepValidation: {
      0: () =>
        trigger(['roll_number', 'fabric_type', 'raw_roll_id', 'supplier_id']),
      1: () =>
        trigger([
          'color_name',
          'color_code',
          'width_cm',
          'length_m',
          'weight_kg',
        ]),
    },
    onCancel: onClose,
  });

  async function handleFinalSubmit(values: FinishedFabricFormValues) {
    if (!stepper.isLast) return;
    await onSubmit(values);
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={
        isEditing
          ? `Sửa cuộn: ${roll.roll_number}`
          : 'Nhập cuộn vải thành phẩm mới'
      }
      stepInfo={{ current: stepper.currentStep, total: stepper.totalSteps }}
      footer={
        <StepperFooter
          stepper={stepper}
          onCancel={onClose}
          isPending={isPending}
          submitLabel={isEditing ? 'Lưu thay đổi' : 'Nhập kho'}
          submitDisabled={isLocked}
          formId="finished-fabric-form"
        />
      }
    >
      <form
        id="finished-fabric-form"
        onSubmit={handleSubmit(handleFinalSubmit)}
        onKeyDown={stepper.handleKeyDown}
        noValidate
      >
        {lockReason && (
          <div
            role="alert"
            className="bg-[#fff3cd] border border-[#ffc107] rounded-md py-[0.6rem] px-[0.9rem] mb-4 text-sm text-[#856404] flex items-center gap-[0.4rem]"
          >
            🔒 {lockReason}
          </div>
        )}

        {mutationError && (
          <p className="error-inline mb-4">
            Lỗi: {getErrorMessage(mutationError)}
          </p>
        )}

        <fieldset disabled={isLocked} className="border-none p-0 m-0">
          <div className="form-grid">
            {/* === BƯỚC 1: THÔNG TIN CƠ BẢN & NGUỒN GỐC === */}
            <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
              <div className="form-grid">
                {/* Ảnh sản phẩm */}
                <div className="form-field">
                  <label>Ảnh sản phẩm</label>
                  <ImagePicker
                    value={currentImageUrl}
                    onUpload={(file) =>
                      uploadImageMutation.mutate(file, {
                        onSuccess: (url) => setValue('image_url', url),
                      })
                    }
                    onRemove={() => {
                      const currentUrl = currentImageUrl;
                      setValue('image_url', null);
                      if (currentUrl) {
                        deleteImageMutation.mutate(currentUrl);
                      }
                    }}
                    isUploading={uploadImageMutation.isPending}
                    error={
                      uploadImageMutation.error instanceof Error
                        ? uploadImageMutation.error.message
                        : uploadImageMutation.error
                          ? String(uploadImageMutation.error)
                          : null
                    }
                    disabled={isLocked}
                  />
                </div>

                {/* Hàng 1: Mã cuộn + Loại vải */}
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="roll_number">
                      Mã cuộn <span className="field-required">*</span>
                    </label>
                    <input
                      id="roll_number"
                      className={`field-input${errors.roll_number ? ' border-danger' : ''}`}
                      type="text"
                      placeholder="VD: FN-2026-001"
                      {...register('roll_number')}
                    />
                    {errors.roll_number && (
                      <span className="field-error">
                        {errors.roll_number.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="fabric_type">
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
                      <span className="field-error">
                        {errors.fabric_type.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Nguồn gốc */}
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
                      Cuộn vải mộc nguồn{' '}
                      <span className="field-required">*</span>
                    </label>
                    <Controller
                      name="raw_roll_id"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={rawRollComboOptions}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          placeholder="— Chọn cuộn mộc —"
                          hasError={!!errors.raw_roll_id}
                        />
                      )}
                    />
                    {errors.raw_roll_id && (
                      <span className="field-error">
                        {errors.raw_roll_id.message}
                      </span>
                    )}
                    <span className="field-hint">
                      Bắt buộc liên kết cuộn mộc để truy vết nguồn gốc và đối
                      chiếu lô.
                    </span>
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
                      <span className="field-error">
                        {errors.supplier_id.message}
                      </span>
                    )}
                    <span className="field-hint">
                      Đơn giá mua được quản lý bởi phòng Kế toán/Mua hàng.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* === BƯỚC 2: ĐẶC TÍNH SẢN PHẨM === */}
            <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
              <div className="form-grid">
                {/* Hàng 2: Màu */}
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="color_name">Màu vải</label>
                    <Controller
                      name="color_name"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={toColorComboboxOptions(colorOptions)}
                          value={field.value ?? ''}
                          onChange={(val) => {
                            field.onChange(val);
                            // Auto-fill mã màu từ danh mục
                            const selected = colorOptions.find(
                              (c) => c.name === val,
                            );
                            if (selected) {
                              // setValue không available ở đây → dùng register pattern
                            }
                          }}
                          placeholder="Chọn hoặc nhập màu..."
                        />
                      )}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="color_code">Mã màu</label>
                    <input
                      id="color_code"
                      className="field-input"
                      type="text"
                      placeholder="VD: TC-01"
                      {...register('color_code')}
                    />
                  </div>
                </div>

                {/* Hàng 3: Khổ + Dài */}
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="width_cm">Khổ vải (cm)</label>
                    <input
                      id="width_cm"
                      className={`field-input${errors.width_cm ? ' border-danger' : ''}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="VD: 150"
                      {...register('width_cm')}
                    />
                    {errors.width_cm && (
                      <span className="field-error">
                        {errors.width_cm.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="length_m">Độ dài (m)</label>
                    <input
                      id="length_m"
                      className={`field-input${errors.length_m ? ' border-danger' : ''}`}
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="VD: 50"
                      {...register('length_m')}
                    />
                    {errors.length_m && (
                      <span className="field-error">
                        {errors.length_m.message}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hàng 4: Trọng lượng + Chất lượng */}
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="weight_kg">Trọng lượng (kg)</label>
                    <input
                      id="weight_kg"
                      className={`field-input${errors.weight_kg ? ' border-danger' : ''}`}
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="VD: 25.5"
                      {...register('weight_kg')}
                    />
                    {errors.weight_kg && (
                      <span className="field-error">
                        {errors.weight_kg.message}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* === BƯỚC 3: PHÂN LOẠI & LƯU KHO === */}
              <div className={stepper.currentStep === 2 ? 'block' : 'hidden'}>
                <div className="form-grid">
                  <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                    <div className="form-field">
                      <label htmlFor="quality_grade">Chất lượng</label>
                      <Controller
                        name="quality_grade"
                        control={control}
                        render={({ field }) => (
                          <Combobox
                            options={QUALITY_OPTIONS}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Hàng 5: Trạng thái + Ngày sản xuất */}
                  <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                    <div className="form-field">
                      <label htmlFor="status">Trạng thái</label>
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
                      <label htmlFor="production_date">Ngày hoàn thành</label>
                      <input
                        id="production_date"
                        className="field-input"
                        type="date"
                        {...register('production_date')}
                      />
                    </div>
                  </div>

                  {/* Vị trí kho */}
                  <div className="form-field">
                    <label htmlFor="warehouse_location">Vị trí kho</label>
                    <input
                      id="warehouse_location"
                      className="field-input"
                      type="text"
                      placeholder="VD: B2-R1-S4"
                      {...register('warehouse_location')}
                    />
                  </div>

                  {/* Ghi chú */}
                  <div className="form-field">
                    <label htmlFor="notes">Ghi chú</label>
                    <textarea
                      id="notes"
                      className="field-textarea"
                      placeholder="Ghi chú thêm về cuộn thành phẩm..."
                      {...register('notes')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      </form>
    </AdaptiveSheet>
  );
}
