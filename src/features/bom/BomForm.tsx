import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { Combobox } from '@/shared/components/Combobox';
import { Icon } from '@/shared/components/Icon';
import {
  useFabricCatalogs,
  useYarnCatalogs,
  useDraftBom,
  useUpdateDraftBom,
} from '@/application/production';

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
  const totalRatio = watchItems.reduce(
    (acc, curr) => acc + (Number(curr.ratio_pct) || 0),
    0,
  );

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

  const onSubmit = async (data: BomTemplateFormData) => {
    try {
      if (isEdit) {
        await updateDraft.mutateAsync({
          id: initialData.id,
          data,
        });
      } else {
        await createDraft.mutateAsync(data);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra: ' + (err as Error).message);
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
              {...register('target_width_cm', { valueAsNumber: true })}
              className="field-input"
            />
          </div>
          <div className="form-field">
            <label>Định lượng (gsm)</label>
            <input
              type="number"
              {...register('target_gsm', { valueAsNumber: true })}
              className="field-input"
            />
          </div>
          <div className="form-field">
            <label>Hao hụt mặc định (%)</label>
            <input
              type="number"
              step="0.01"
              {...register('standard_loss_pct', { valueAsNumber: true })}
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
            <p className="field-error" style={{ marginBottom: '0.75rem' }}>
              {errors.bom_yarn_items.root.message}
            </p>
          )}

          <div className="flex flex-col gap-2">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex gap-2 items-start p-3 border border-border rounded-lg"
              >
                <div
                  className="form-grid flex-1"
                  style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  }}
                >
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
                    <input
                      type="number"
                      step="0.01"
                      {...register(`bom_yarn_items.${index}.ratio_pct`, {
                        valueAsNumber: true,
                      })}
                      className={`field-input${errors.bom_yarn_items?.[index]?.ratio_pct ? ' is-error' : ''}`}
                    />
                    {errors.bom_yarn_items?.[index]?.ratio_pct && (
                      <span className="field-error">
                        {errors.bom_yarn_items[index]?.ratio_pct?.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label>Tiêu hao (kg/m)</label>
                    <input
                      type="number"
                      step="0.0001"
                      {...register(
                        `bom_yarn_items.${index}.consumption_kg_per_m`,
                        { valueAsNumber: true },
                      )}
                      className={`field-input${errors.bom_yarn_items?.[index]?.consumption_kg_per_m ? ' is-error' : ''}`}
                    />
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
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-3 pt-5 mt-4 border-t border-border">
          <Button
            variant="secondary"
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Huỷ bỏ
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang lưu...' : 'Lưu bản nháp'}
          </Button>
        </div>
      </form>
    </div>
  );
}
