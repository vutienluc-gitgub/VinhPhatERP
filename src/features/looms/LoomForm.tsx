import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import {
  useCreateLoom,
  useNextLoomCode,
  useUpdateLoom,
} from '@/application/settings';
import { useWeavingSuppliers } from '@/application/production';

import {
  loomDefaultValues,
  loomSchema,
  LOOM_STATUS_LABELS,
  LOOM_TYPE_LABELS,
  LOOM_TYPES,
  LOOM_STATUSES,
} from './loom.module';
import type { LoomFormValues } from './loom.module';
import type { LoomWithSupplier } from './types';

type LoomFormProps = {
  loom: LoomWithSupplier | null;
  onClose: () => void;
};

function loomToFormValues(loom: LoomWithSupplier): LoomFormValues {
  return {
    code: loom.code,
    name: loom.name,
    loom_type: loom.loom_type,
    supplier_id: loom.supplier_id,
    max_width_cm: loom.max_width_cm,
    max_speed_rpm: loom.max_speed_rpm,
    daily_capacity_m: loom.daily_capacity_m,
    year_manufactured: loom.year_manufactured,
    status: loom.status,
    notes: loom.notes ?? '',
  };
}

export function LoomForm({ loom, onClose }: LoomFormProps) {
  const isEditing = loom !== null;
  const createMutation = useCreateLoom();
  const updateMutation = useUpdateLoom();
  const { data: nextCode } = useNextLoomCode();
  const { data: suppliers, isLoading: loadingSuppliers } =
    useWeavingSuppliers();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoomFormValues>({
    resolver: zodResolver(loomSchema),
    defaultValues: isEditing ? loomToFormValues(loom) : loomDefaultValues,
  });

  useEffect(() => {
    reset(isEditing ? loomToFormValues(loom) : loomDefaultValues);
  }, [loom, isEditing, reset]);

  useEffect(() => {
    if (!isEditing && nextCode && !getValues('code')) {
      setValue('code', nextCode);
    }
  }, [isEditing, nextCode, setValue, getValues]);

  async function onSubmit(values: LoomFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: loom.id, values });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch {
      // Error displayed via mutationError below
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const supplierOptions = (suppliers ?? []).map((s) => ({
    value: s.id,
    label: `${s.code} — ${s.name}`,
  }));

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={isEditing ? `Sửa: ${loom.name}` : 'Thêm máy dệt'}
    >
      {mutationError && (
        <p className="error-inline mb-4">
          {mutationError instanceof Error
            ? mutationError.message
            : typeof mutationError === 'object' &&
                mutationError !== null &&
                'message' in mutationError
              ? String((mutationError as Record<string, unknown>).message)
              : String(mutationError)}
        </p>
      )}

      <form id="loom-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-grid">
          {/* Ma + Ten */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label htmlFor="loom-code">
                Mã máy <span className="field-required">*</span>
              </label>
              <input
                id="loom-code"
                className={`field-input${errors.code ? ' is-error' : ''}`}
                type="text"
                placeholder="VD: LOOM-001"
                readOnly={!isEditing}
                {...register('code')}
              />
              {errors.code && (
                <span className="field-error">{errors.code.message}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="loom-name">
                Tên máy dệt <span className="field-required">*</span>
              </label>
              <input
                id="loom-name"
                className={`field-input${errors.name ? ' is-error' : ''}`}
                type="text"
                placeholder="VD: Toyota JAT 810"
                {...register('name')}
              />
              {errors.name && (
                <span className="field-error">{errors.name.message}</span>
              )}
            </div>
          </div>

          {/* Loai may + Nha det */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>
                Loại máy <span className="field-required">*</span>
              </label>
              <Controller
                name="loom_type"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={LOOM_TYPES.map((t) => ({
                      value: t,
                      label: LOOM_TYPE_LABELS[t],
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.loom_type}
                    placeholder="Chọn loại máy..."
                  />
                )}
              />
              {errors.loom_type && (
                <span className="field-error">{errors.loom_type.message}</span>
              )}
            </div>

            <div className="form-field">
              <label>
                Nhà dệt <span className="field-required">*</span>
              </label>
              <Controller
                name="supplier_id"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={supplierOptions}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.supplier_id}
                    placeholder={
                      loadingSuppliers ? 'Đang tải...' : 'Chọn nhà dệt...'
                    }
                  />
                )}
              />
              {errors.supplier_id && (
                <span className="field-error">
                  {errors.supplier_id.message}
                </span>
              )}
            </div>
          </div>

          {/* Thong so ky thuat */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
            <div className="form-field">
              <label htmlFor="loom-width">Khổ dệt tối đa (cm)</label>
              <input
                id="loom-width"
                className={`field-input${errors.max_width_cm ? ' is-error' : ''}`}
                type="number"
                step="0.1"
                min="0"
                placeholder="VD: 360"
                {...register('max_width_cm', {
                  setValueAs: (v) =>
                    v === '' || Number.isNaN(Number(v)) ? null : Number(v),
                })}
              />
              {errors.max_width_cm && (
                <span className="field-error">
                  {errors.max_width_cm.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="loom-speed">Tốc độ (vòng/phút)</label>
              <input
                id="loom-speed"
                className={`field-input${errors.max_speed_rpm ? ' is-error' : ''}`}
                type="number"
                step="1"
                min="0"
                placeholder="VD: 600"
                {...register('max_speed_rpm', {
                  setValueAs: (v) =>
                    v === '' || Number.isNaN(Number(v)) ? null : Number(v),
                })}
              />
              {errors.max_speed_rpm && (
                <span className="field-error">
                  {errors.max_speed_rpm.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="loom-capacity">Công suất (m/ngày)</label>
              <input
                id="loom-capacity"
                className={`field-input${errors.daily_capacity_m ? ' is-error' : ''}`}
                type="number"
                step="0.1"
                min="0"
                placeholder="VD: 200"
                {...register('daily_capacity_m', {
                  setValueAs: (v) =>
                    v === '' || Number.isNaN(Number(v)) ? null : Number(v),
                })}
              />
              {errors.daily_capacity_m && (
                <span className="field-error">
                  {errors.daily_capacity_m.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="loom-year">Năm sản xuất</label>
              <input
                id="loom-year"
                className={`field-input${errors.year_manufactured ? ' is-error' : ''}`}
                type="number"
                step="1"
                min="1950"
                max="2100"
                placeholder="VD: 2020"
                {...register('year_manufactured', {
                  setValueAs: (v) =>
                    v === '' || Number.isNaN(Number(v)) ? null : Number(v),
                })}
              />
              {errors.year_manufactured && (
                <span className="field-error">
                  {errors.year_manufactured.message}
                </span>
              )}
            </div>
          </div>

          {/* Trang thai */}
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
            <div className="form-field">
              <label>Trạng thái</label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={LOOM_STATUSES.map((s) => ({
                      value: s,
                      label: LOOM_STATUS_LABELS[s],
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.status}
                  />
                )}
              />
            </div>
          </div>

          {/* Ghi chu */}
          <div className="form-field">
            <label htmlFor="loom-notes">Ghi chú</label>
            <textarea
              id="loom-notes"
              className="field-textarea"
              rows={2}
              placeholder="Ghi chú về máy dệt..."
              {...register('notes')}
            />
          </div>
        </div>

        <div className="modal-footer mt-6 p-0 border-none">
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </Button>
          <button
            className="primary-button btn-standard"
            type="submit"
            disabled={isPending}
          >
            {isPending
              ? 'Đang lưu...'
              : isEditing
                ? 'Cập nhật'
                : 'Thêm máy dệt'}
          </button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
