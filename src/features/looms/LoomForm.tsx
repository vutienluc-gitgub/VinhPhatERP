import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';

import { Icon, Button } from '@/shared/components';
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
} from '@/schema/loom.schema';
import type { LoomFormValues } from '@/schema/loom.schema';

import type { LoomWithSupplier } from './types';

const TYPE_OPTIONS = LOOM_TYPES.map((t) => ({
  value: t,
  label: LOOM_TYPE_LABELS[t],
}));

const STATUS_OPTIONS = LOOM_STATUSES.map((s) => ({
  value: s,
  label: LOOM_STATUS_LABELS[s],
}));

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
    diameter_inch: loom.diameter_inch ?? null,
    gauge: loom.gauge ?? null,
    feeders: loom.feeders ?? null,
    motor_power_kw: loom.motor_power_kw ?? null,
    voltage: loom.voltage ?? '',
    weight_kg: loom.weight_kg ?? null,
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
    watch,
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

  const supplierOptions = useMemo(
    () =>
      (suppliers ?? []).map((s) => ({
        value: s.id,
        label: `${s.code} — ${s.name}`,
      })),
    [suppliers],
  );

  const currentStatus = watch('status');
  const isTechnicalLocked = isEditing && currentStatus === 'active';

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

      {isTechnicalLocked && (
        <div className="warning-inline mb-4 text-sm bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 p-3 rounded-lg flex items-start gap-2 border border-amber-200 dark:border-amber-500/20">
          <div className="mt-0.5">
            <Icon name="AlertTriangle" size={16} />
          </div>
          <div>
            <strong>Máy đang HOẠT ĐỘNG!</strong>
            <br />
            Không thể sửa đổi thông số kỹ thuật (Loại máy, số kim, v.v.) để
            tránh sai lệch dữ liệu sản xuất. Hãy chuyển trạng thái sang "Bảo
            trì" hoặc "Ngừng dùng" nếu muốn chỉnh sửa.
          </div>
        </div>
      )}

      <form
        id="loom-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-8 pb-4"
      >
        {/* === SECTION 1: THÔNG TIN CHUNG === */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <Icon name="Info" size={16} className="text-indigo-500" />
            Thông tin chung
          </h3>
          <div className="form-grid">
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

            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] mt-4">
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
                      disabled={isTechnicalLocked}
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

              <div className="form-field">
                <label>Trạng thái</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      options={STATUS_OPTIONS}
                      value={field.value}
                      onChange={field.onChange}
                      hasError={!!errors.status}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        {/* === SECTION 2: NĂNG LỰC SẢN XUẤT === */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <Icon name="Activity" size={16} className="text-emerald-500" />
            Năng lực sản xuất
          </h3>
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
                    options={TYPE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    hasError={!!errors.loom_type}
                    placeholder="Chọn loại máy..."
                    disabled={isTechnicalLocked}
                  />
                )}
              />
              {errors.loom_type && (
                <span className="field-error">{errors.loom_type.message}</span>
              )}
            </div>

            <div className="form-grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] mt-4">
              <div className="form-field">
                <label htmlFor="loom-width">Khổ dệt tối đa (cm)</label>
                <input
                  id="loom-width"
                  className={`field-input${errors.max_width_cm ? ' is-error' : ''}`}
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="VD: 360"
                  disabled={isTechnicalLocked}
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
                  disabled={isTechnicalLocked}
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
                  disabled={isTechnicalLocked}
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
            </div>
          </div>
        </section>

        {/* === SECTION 3: THÔNG SỐ KỸ THUẬT === */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <Icon name="Settings" size={16} className="text-blue-500" />
            Thông số kỹ thuật chi tiết
          </h3>
          <div className="form-grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
            <div className="form-field">
              <label htmlFor="loom-diameter">Đường kính (inch)</label>
              <input
                id="loom-diameter"
                className={`field-input${errors.diameter_inch ? ' is-error' : ''}`}
                type="number"
                step="0.1"
                min="0"
                placeholder="VD: 30"
                disabled={isTechnicalLocked}
                {...register('diameter_inch', {
                  setValueAs: (v) =>
                    v === '' || Number.isNaN(Number(v)) ? null : Number(v),
                })}
              />
              {errors.diameter_inch && (
                <span className="field-error">
                  {errors.diameter_inch.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="loom-gauge">Gauge (mật độ kim)</label>
              <input
                id="loom-gauge"
                className={`field-input${errors.gauge ? ' is-error' : ''}`}
                type="number"
                step="1"
                min="0"
                placeholder="VD: 72"
                disabled={isTechnicalLocked}
                {...register('gauge', {
                  setValueAs: (v) =>
                    v === '' || Number.isNaN(Number(v)) ? null : Number(v),
                })}
              />
              {errors.gauge && (
                <span className="field-error">{errors.gauge.message}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="loom-feeders">Feeders (đầu sợi)</label>
              <input
                id="loom-feeders"
                className={`field-input${errors.feeders ? ' is-error' : ''}`}
                type="number"
                step="1"
                min="0"
                placeholder="VD: 72"
                disabled={isTechnicalLocked}
                {...register('feeders', {
                  setValueAs: (v) =>
                    v === '' || Number.isNaN(Number(v)) ? null : Number(v),
                })}
              />
              {errors.feeders && (
                <span className="field-error">{errors.feeders.message}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="loom-motor">Công suất motor (kW)</label>
              <input
                id="loom-motor"
                className={`field-input${errors.motor_power_kw ? ' is-error' : ''}`}
                type="number"
                step="0.1"
                min="0"
                placeholder="VD: 5.5"
                disabled={isTechnicalLocked}
                {...register('motor_power_kw', {
                  setValueAs: (v) =>
                    v === '' || Number.isNaN(Number(v)) ? null : Number(v),
                })}
              />
              {errors.motor_power_kw && (
                <span className="field-error">
                  {errors.motor_power_kw.message}
                </span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="loom-voltage">Điện áp</label>
              <input
                id="loom-voltage"
                className={`field-input${errors.voltage ? ' is-error' : ''}`}
                type="text"
                placeholder="VD: 380V/3P/50Hz"
                disabled={isTechnicalLocked}
                {...register('voltage')}
              />
              {errors.voltage && (
                <span className="field-error">{errors.voltage.message}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="loom-weight">Trọng lượng (kg)</label>
              <input
                id="loom-weight"
                className={`field-input${errors.weight_kg ? ' is-error' : ''}`}
                type="number"
                step="1"
                min="0"
                placeholder="VD: 4200"
                disabled={isTechnicalLocked}
                {...register('weight_kg', {
                  setValueAs: (v) =>
                    v === '' || Number.isNaN(Number(v)) ? null : Number(v),
                })}
              />
              {errors.weight_kg && (
                <span className="field-error">{errors.weight_kg.message}</span>
              )}
            </div>
          </div>
        </section>

        {/* === SECTION 4: THÔNG TIN KHÁC === */}
        <section>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2 border-b pb-2">
            <Icon name="FileText" size={16} className="text-gray-500" />
            Thông tin khác
          </h3>
          <div className="form-grid">
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
                disabled={isTechnicalLocked}
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
        </section>

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
