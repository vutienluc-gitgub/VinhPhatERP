import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';

import { Button } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { NumberInput } from '@/shared/components/NumberInput';
import { Icon } from '@/shared/components/Icon';
import {
  useFabricCatalogs,
  useYarnCatalogs,
  useDraftBom,
  useUpdateDraftBom,
} from '@/application/production';
import { sumBy } from '@/shared/utils/array.util';

import { bomTemplateSchema, BomTemplateFormData } from './bom.module';
import { BomTemplate } from './types';

interface BomFormProps {
  initialData?: BomTemplate;
  onSuccess: () => void;
  onCancel: () => void;
}

export function BomForm({ initialData, onSuccess, onCancel }: BomFormProps) {
  const { data: fabricCatalogs = [] } = useFabricCatalogs();
  const { data: yarnCatalogs = [] } = useYarnCatalogs();

  const createDraft = useDraftBom();
  const updateDraft = useUpdateDraftBom();

  const isEdit = !!initialData;
  const isSubmitting = createDraft.isPending || updateDraft.isPending;

  const defaultValues: BomTemplateFormData = {
    code: initialData?.code || '',
    name: initialData?.name || '',
    target_fabric_id: initialData?.target_fabric_id || '',
    target_width_cm: initialData?.target_width_cm || null,
    target_gsm: initialData?.target_gsm || null,
    standard_loss_pct: initialData?.standard_loss_pct || 5,
    notes: initialData?.notes || '',
    bom_yarn_items: initialData?.bom_yarn_items?.map((y) => ({
      id: y.id,
      yarn_catalog_id: y.yarn_catalog_id,
      ratio_pct: y.ratio_pct,
      consumption_kg_per_m: y.consumption_kg_per_m,
      notes: y.notes,
      sort_order: y.sort_order,
    })) || [
      {
        yarn_catalog_id: '',
        ratio_pct: 100,
        consumption_kg_per_m: 0.5,
        sort_order: 0,
      },
    ],
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BomTemplateFormData>({
    resolver: zodResolver(bomTemplateSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'bom_yarn_items',
  });

  const watchItems = watch('bom_yarn_items');
  const totalRatio = sumBy(watchItems, (curr) => Number(curr.ratio_pct) || 0);

  // ── Tự sinh mã BOM: BOM-<mã sản phẩm mộc>-<mã sợi đầu tiên> ──
  const watchFabricId = watch('target_fabric_id');
  const watchFirstYarnId = watchItems?.[0]?.yarn_catalog_id;

  useEffect(() => {
    if (isEdit) return; // Không đổi mã khi sửa

    const fabric = fabricCatalogs.find((f) => f.id === watchFabricId);
    const yarn = yarnCatalogs.find((y) => y.id === watchFirstYarnId);

    const fabricCode = fabric?.code ?? '';
    const yarnCode = yarn?.code ?? '';

    if (fabricCode || yarnCode) {
      const parts = ['BOM', fabricCode, yarnCode].filter(Boolean);
      setValue('code', parts.join('-'), { shouldValidate: true });
    }
  }, [
    watchFabricId,
    watchFirstYarnId,
    fabricCatalogs,
    yarnCatalogs,
    isEdit,
    setValue,
  ]);

  // ── Tự động tính Tiêu hao (kg/m) ──
  const watchWidthCm = watch('target_width_cm');
  const watchGsm = watch('target_gsm');
  const watchLoss = watch('standard_loss_pct') || 0;

  useEffect(() => {
    if (watchWidthCm && watchGsm) {
      // 1 mét chiều dài -> Trọng lượng = (Width_cm / 100) * 1m * GSM / 1000 (kg)
      const totalKgPerM = (watchWidthCm * watchGsm) / 100000;

      watchItems.forEach((item, index) => {
        const ratio = Number(item.ratio_pct) || 0;
        // Chia tỉ lệ sợi, giới hạn 4 số thập phân để chính xác
        const consumption = Number(((totalKgPerM * ratio) / 100).toFixed(4));

        // Tránh infinite loop: chỉ set nếu thực sự có sự sai lệch
        if (Math.abs((item.consumption_kg_per_m || 0) - consumption) > 0.0001) {
          setValue(
            `bom_yarn_items.${index}.consumption_kg_per_m`,
            consumption,
            {
              shouldValidate: true,
            },
          );
        }
      });
    }
  }, [watchWidthCm, watchGsm, watchItems, setValue]);

  const onSubmit = async (data: BomTemplateFormData) => {
    try {
      if (isEdit) {
        await updateDraft.mutateAsync({
          id: initialData.id,
          data,
        });
        toast.success('Cap nhat dinh muc thanh cong!');
      } else {
        await createDraft.mutateAsync(data);
        toast.success('Tao ban nhap dinh muc thanh cong!');
      }
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : JSON.stringify(err);
      toast.error('Co loi xay ra: ' + msg);
    }
  };

  return (
    <div className="panel-card card-flush">
      {/* Header */}
      <div className="card-header-area card-header-premium">
        <div className="flex items-center gap-3">
          <button
            className="btn-icon"
            type="button"
            onClick={onCancel}
            title="Quay lai"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <p className="eyebrow-premium">KY THUAT</p>
            <h3 className="title-premium">
              {isEdit
                ? 'C\u1eadp nh\u1eadt b\u1ea3n nh\u00e1p'
                : 'T\u1ea1o b\u1ea3n nh\u00e1p \u0111\u1ecbnh m\u1ee9c (BOM)'}
            </h3>
          </div>
        </div>
      </div>

      {/* Form content */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-5">
        {/* Basic info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="form-field">
            <label>
              Mã BOM <span className="text-xs text-muted">(tự sinh)</span>
            </label>
            <input
              type="text"
              {...register('code')}
              readOnly
              className="field-input bg-surface-raised cursor-default"
              placeholder="Chọn sản phẩm mộc + sợi → tự sinh"
            />
            <span className="field-hint">
              Mã tự động: BOM‑&lt;mã vải mộc&gt;‑&lt;mã sợi&gt;
            </span>
          </div>

          <div className="form-field">
            <label>
              Tên BOM <span className="field-required">*</span>
            </label>
            <input
              type="text"
              {...register('name')}
              className={`field-input${errors.name ? ' is-error' : ''}`}
              placeholder="VD: Định mức Cotton 65/35..."
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </div>

          <div className="form-field">
            <label>
              Sản phẩm mộc <span className="field-required">*</span>
            </label>
            <Controller
              name="target_fabric_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  options={fabricCatalogs.map((fb) => ({
                    value: fb.id,
                    label: `${fb.code} — ${fb.name}`,
                    code: fb.code,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="-- Chọn sản phẩm mộc --"
                  hasError={!!errors.target_fabric_id}
                />
              )}
            />
            {errors.target_fabric_id && (
              <span className="field-error">
                {errors.target_fabric_id.message}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="form-field">
            <label>Khổ vải (cm)</label>
            <input
              type="number"
              {...register('target_width_cm', {
                setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)),
              })}
              className="field-input"
            />
          </div>
          <div className="form-field">
            <label>Định lượng (gsm)</label>
            <input
              type="number"
              {...register('target_gsm', {
                setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)),
              })}
              className="field-input"
            />
          </div>
          <div className="form-field">
            <label>Hao hụt mặc định (%)</label>
            <input
              type="number"
              step="0.01"
              {...register('standard_loss_pct', {
                setValueAs: (v) => (v === '' || isNaN(v) ? null : Number(v)),
              })}
              className="field-input"
            />
          </div>
          <div className="form-field">
            <label>Ghi chú</label>
            <input
              type="text"
              {...register('notes')}
              className="field-input"
              placeholder="Thông tin bổ sung..."
            />
          </div>
        </div>

        {/* Yarn Items Section */}
        <div className="border-t border-border mt-6 pt-5">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="eyebrow-premium mb-0.5">Thành phần nguyên liệu</p>
              <p className="text-xs text-muted">
                Tổng tỉ lệ:{' '}
                <strong
                  className={
                    Math.abs(totalRatio - 100) > 0.01
                      ? 'text-danger'
                      : 'text-success'
                  }
                >
                  {totalRatio.toFixed(2)}%
                </strong>
              </p>
            </div>
            <button
              type="button"
              className="btn-secondary flex items-center gap-1.5"
              onClick={() =>
                append({
                  yarn_catalog_id: '',
                  ratio_pct: 0,
                  consumption_kg_per_m: 0.5,
                  sort_order: fields.length,
                })
              }
            >
              <Icon name="Plus" size={16} />
              Thêm sợi
            </button>
          </div>

          {errors.bom_yarn_items?.root && (
            <p className="field-error mb-3">
              {errors.bom_yarn_items.root.message}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex gap-2 items-start p-3 border border-border rounded-lg"
              >
                <div className="form-grid flex-1 grid-cols-[repeat(auto-fit,minmax(140px,1fr))]">
                  <div className="form-field">
                    <label>Loại sợi</label>
                    <Controller
                      name={`bom_yarn_items.${index}.yarn_catalog_id` as const}
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={yarnCatalogs.map((y) => ({
                            value: y.id,
                            label: `${y.code} — ${y.name} (${y.composition})`,
                            code: y.code,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="— Chọn sợi —"
                          hasError={
                            !!errors.bom_yarn_items?.[index]?.yarn_catalog_id
                          }
                        />
                      )}
                    />
                    {errors.bom_yarn_items?.[index]?.yarn_catalog_id && (
                      <span className="field-error">
                        {errors.bom_yarn_items[index]?.yarn_catalog_id?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Tỉ lệ (%)</label>
                    <Controller
                      name={`bom_yarn_items.${index}.ratio_pct` as const}
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          className={`field-input${errors.bom_yarn_items?.[index]?.ratio_pct ? ' is-error' : ''}`}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          step="0.01"
                        />
                      )}
                    />
                    {errors.bom_yarn_items?.[index]?.ratio_pct && (
                      <span className="field-error">
                        {errors.bom_yarn_items[index]?.ratio_pct?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label>
                      Tiêu hao (kg/m)
                      {watchWidthCm && watchGsm && (
                        <span className="text-[10px] text-muted ml-1 font-normal">
                          (Tự động)
                        </span>
                      )}
                    </label>
                    <Controller
                      name={
                        `bom_yarn_items.${index}.consumption_kg_per_m` as const
                      }
                      control={control}
                      render={({ field }) => (
                        <NumberInput
                          className={`field-input${watchWidthCm && watchGsm ? ' bg-surface-raised cursor-default' : ''}${errors.bom_yarn_items?.[index]?.consumption_kg_per_m ? ' is-error' : ''}`}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          step="0.0001"
                          readOnly={!!(watchWidthCm && watchGsm)}
                        />
                      )}
                    />
                    {watchWidthCm && watchGsm && (
                      <span className="field-hint text-[11px] mt-1 block h-[18px]">
                        Thực cấp mộc (gồm {watchLoss}% hao hụt):{' '}
                        <strong className="text-secondary">
                          {watchLoss < 100
                            ? (
                                Number(
                                  watchItems[index]?.consumption_kg_per_m || 0,
                                ) /
                                (1 - watchLoss / 100)
                              ).toFixed(4)
                            : 0}{' '}
                          kg
                        </strong>
                      </span>
                    )}
                    {errors.bom_yarn_items?.[index]?.consumption_kg_per_m && (
                      <span className="field-error">
                        {
                          errors.bom_yarn_items[index]?.consumption_kg_per_m
                            ?.message
                        }
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-icon text-danger mt-6 flex-shrink-0"
                  onClick={() => remove(index)}
                  title="Xóa dòng"
                >
                  <Icon name="Trash2" size={16} />
                </button>
              </div>
            ))}

            {fields.length === 0 && (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center text-sm text-muted">
                Chưa có loại sợi nào. Nhấn "Thêm sợi" để bắt đầu.
              </div>
            )}
          </div>

          {/* Summary Bar */}
          {fields.length > 0 && watchWidthCm && watchGsm && (
            <div className="mt-4 p-4 rounded-xl bg-surface-subtle border border-border">
              <p className="eyebrow-premium mb-3">
                Tổng kết định mức / 1 mét vải
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Net */}
                <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-surface border border-border">
                  <span className="text-[11px] text-muted uppercase tracking-wide">
                    Tiêu hao tịnh (Net)
                  </span>
                  <span className="text-xl font-bold text-text tabular-nums">
                    {sumBy(
                      watchItems,
                      (item) => Number(item.consumption_kg_per_m) || 0,
                    ).toFixed(4)}{' '}
                    <span className="text-sm font-normal text-muted">kg/m</span>
                  </span>
                  <span className="text-[10px] text-muted">
                    Không tính hao hụt
                  </span>
                </div>

                {/* Gross */}
                <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-[11px] text-primary uppercase tracking-wide font-semibold">
                    Thực cấp mộc (Gross)
                  </span>
                  <span className="text-xl font-bold text-primary tabular-nums">
                    {watchLoss < 100
                      ? (
                          sumBy(
                            watchItems,
                            (item) => Number(item.consumption_kg_per_m) || 0,
                          ) /
                          (1 - watchLoss / 100)
                        ).toFixed(4)
                      : '0.0000'}{' '}
                    <span className="text-sm font-normal text-primary/70">
                      kg/m
                    </span>
                  </span>
                  <span className="text-[10px] text-primary/70">
                    Gồm {watchLoss}% hao hụt
                  </span>
                </div>

                {/* 1000m reference */}
                <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-success/5 border border-success/20">
                  <span className="text-[11px] text-success uppercase tracking-wide font-semibold">
                    Xuất kho cho 1.000m
                  </span>
                  <span className="text-xl font-bold text-success tabular-nums">
                    {watchLoss < 100
                      ? (
                          (sumBy(
                            watchItems,
                            (item) => Number(item.consumption_kg_per_m) || 0,
                          ) /
                            (1 - watchLoss / 100)) *
                          1000
                        ).toFixed(1)
                      : '0.0'}{' '}
                    <span className="text-sm font-normal text-success/70">
                      kg
                    </span>
                  </span>
                  <span className="text-[10px] text-success/70">
                    Ước tính đặt hàng nguyên liệu
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-border">
          <Button
            variant="secondary"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            Lưu bản nháp
          </Button>
        </div>
      </form>
    </div>
  );
}
