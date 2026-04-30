import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
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
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
  finishedFabricDefaults,
  finishedFabricSchema,
} from '@/schema/finished-fabric.schema';
import type { FinishedFabricFormValues } from '@/schema/finished-fabric.schema';

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
    raw_roll_id: roll.raw_roll_id,
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
  };
}

export function FinishedFabricForm({ roll, onClose }: FinishedFabricFormProps) {
  const isEditing = roll !== null;
  const lockReason = isEditing ? editBlockReason(roll.status) : null;
  const isLocked = lockReason !== null;
  const createMutation = useCreateFinishedFabric();
  const updateMutation = useUpdateFinishedFabric();
  const { data: rawRollOptions = [] } = useRawRollOptions();
  const { data: colorOptions = [] } = useColorOptions();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();

  const fabricComboOptions = useMemo(
    () =>
      fabricOptions.map((f) => ({
        value: f.name,
        label: f.code ? `${f.name} (${f.code})` : f.name,
      })),
    [fabricOptions],
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
    formState: { errors, isSubmitting },
  } = useForm<FinishedFabricFormValues>({
    resolver: zodResolver(finishedFabricSchema),
    defaultValues: isEditing ? rollToFormValues(roll) : finishedFabricDefaults,
  });

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

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={
        isEditing
          ? `Sửa cuộn: ${roll.roll_number}`
          : 'Nhập cuộn vải thành phẩm mới'
      }
    >
      <form
        id="finished-fabric-form"
        onSubmit={handleSubmit(onSubmit)}
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
            Lỗi: {(mutationError as Error).message}
          </p>
        )}

        <fieldset disabled={isLocked} className="border-none p-0 m-0">
          <div className="form-grid">
            {/* Hàng 1: Mã cuộn + Loại vải */}
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label htmlFor="roll_number">
                  Mã cuộn <span className="field-required">*</span>
                </label>
                <input
                  id="roll_number"
                  className={`field-input${errors.roll_number ? ' is-error' : ''}`}
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

            {/* Cuộn mộc nguồn — bắt buộc */}
            <div className="form-field">
              <label htmlFor="raw_roll_id">
                Cuộn vải mộc nguồn <span className="field-required">*</span>
              </label>
              <Controller
                name="raw_roll_id"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={rawRollComboOptions}
                    value={field.value}
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
                Bắt buộc liên kết cuộn mộc để truy vết nguồn gốc và đối chiếu
                lô.
              </span>
            </div>

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
                  className={`field-input${errors.width_cm ? ' is-error' : ''}`}
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
                <label htmlFor="length_m">Độ dài (m)</label>
                <input
                  id="length_m"
                  className={`field-input${errors.length_m ? ' is-error' : ''}`}
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="VD: 50"
                  {...register('length_m')}
                />
                {errors.length_m && (
                  <span className="field-error">{errors.length_m.message}</span>
                )}
              </div>
            </div>

            {/* Hàng 4: Trọng lượng + Chất lượng */}
            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
              <div className="form-field">
                <label htmlFor="weight_kg">Trọng lượng (kg)</label>
                <input
                  id="weight_kg"
                  className={`field-input${errors.weight_kg ? ' is-error' : ''}`}
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
        </fieldset>

        <div className="modal-footer mt-6 p-0 border-none">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Đóng
          </Button>
          {!isLocked && (
            <button
              className="primary-button btn-standard"
              type="submit"
              disabled={isPending}
            >
              {isPending
                ? 'Đang lưu...'
                : isEditing
                  ? 'Lưu thay đổi'
                  : 'Nhập kho'}
            </button>
          )}
        </div>
      </form>
    </AdaptiveSheet>
  );
}
