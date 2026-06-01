import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Button } from '@/shared/components/Button';
import { Combobox } from '@/shared/components/Combobox';
import { ErrorInline } from '@/shared/components/ErrorInline';
import {
  yarnKnittingEngineeringSchema,
  COMPATIBILITY_LEVELS,
  type YarnKnittingEngineering,
} from '@/schema/yarn-engineering.schema';
import {
  useFabricStructures,
  useMachineSpecs,
  useUpsertYarnKnittingEngineering,
} from '@/features/yarn-catalog/hooks/useYarnEngineering';

type YarnEngineeringMatrixModalProps = {
  isOpen: boolean;
  onClose: () => void;
  yarnId: string;
  editingRecord?: YarnKnittingEngineering | null;
};

export function YarnEngineeringMatrixModal({
  isOpen,
  onClose,
  yarnId,
  editingRecord,
}: YarnEngineeringMatrixModalProps) {
  const { data: fabricStructures } = useFabricStructures();
  const { data: machineSpecs } = useMachineSpecs();
  const upsertMutation = useUpsertYarnKnittingEngineering();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<YarnKnittingEngineering>({
    resolver: zodResolver(yarnKnittingEngineeringSchema),
    defaultValues: {
      yarn_id: yarnId,
      compatibility_level: 'preferred',
      need_special_feeder: false,
      need_lycra_attachment: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        reset(editingRecord);
      } else {
        reset({
          yarn_id: yarnId,
          compatibility_level: 'preferred',
          need_special_feeder: false,
          need_lycra_attachment: false,
        });
      }
    }
  }, [isOpen, editingRecord, yarnId, reset]);

  const structureOptions = useMemo(() => {
    return (fabricStructures || []).map((s) => ({
      value: s.id,
      label: s.name,
    }));
  }, [fabricStructures]);

  const machineOptions = useMemo(() => {
    return (machineSpecs || [])
      .filter((m) => m.id)
      .map((m) => {
        const diameterStr = m.diameter ? `${m.diameter}"` : '';
        const gaugeStr = m.gauge ? `${m.gauge}G` : '';
        const parts = [diameterStr, gaugeStr, m.machine_family].filter(Boolean);
        return {
          value: m.id as string,
          label: parts.length > 0 ? parts.join(' - ') : 'Cấu hình trống',
        };
      });
  }, [machineSpecs]);

  const onSubmit = async (data: YarnKnittingEngineering) => {
    await upsertMutation.mutateAsync(data);
    onClose();
  };

  return (
    <AdaptiveSheet
      open={isOpen}
      onClose={onClose}
      title={
        editingRecord ? 'Cập nhật cấu hình máy dệt' : 'Thêm cấu hình máy dệt'
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="form-grid">
            <div className="form-field">
              <label>
                Kiểu dệt <span className="field-required">*</span>
              </label>
              <Controller
                name="fabric_structure_id"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={structureOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Chọn kiểu dệt..."
                    disabled={!!editingRecord}
                  />
                )}
              />
              {errors.fabric_structure_id && (
                <ErrorInline>{errors.fabric_structure_id.message}</ErrorInline>
              )}
            </div>

            <div className="form-field">
              <label>
                Cấu hình máy <span className="field-required">*</span>
              </label>
              <Controller
                name="machine_spec_id"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={machineOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Chọn cấu hình máy..."
                    disabled={!!editingRecord}
                  />
                )}
              />
              {errors.machine_spec_id && (
                <ErrorInline>{errors.machine_spec_id.message}</ErrorInline>
              )}
            </div>

            <div className="form-field">
              <label>
                Mức độ tương thích <span className="field-required">*</span>
              </label>
              <select
                className="field-input"
                {...register('compatibility_level')}
              >
                {COMPATIBILITY_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
              {errors.compatibility_level && (
                <ErrorInline>{errors.compatibility_level.message}</ErrorInline>
              )}
            </div>

            <div className="form-field">
              <label>Kiểu cấp sợi (Feeding Type)</label>
              <select className="field-input" {...register('feeding_type')}>
                <option value="">Chưa xác định</option>
                <option value="positive">Tích cực (Positive)</option>
                <option value="negative">Tiêu cực (Negative)</option>
                <option value="auto">Tự động (Auto)</option>
              </select>
            </div>

            <div className="form-field">
              <label>Tốc độ (RPM) khuyên dùng</label>
              <input
                className="field-input"
                type="number"
                {...register('recommended_rpm', { valueAsNumber: true })}
              />
              {errors.recommended_rpm && (
                <ErrorInline>{errors.recommended_rpm.message}</ErrorInline>
              )}
            </div>

            <div className="form-field">
              <label>Tốc độ (RPM) tối đa</label>
              <input
                className="field-input"
                type="number"
                {...register('max_rpm', { valueAsNumber: true })}
              />
            </div>

            <div className="form-field">
              <label>Hiệu suất kỳ vọng (0-1)</label>
              <input
                className="field-input"
                type="number"
                step="0.01"
                {...register('expected_efficiency', { valueAsNumber: true })}
              />
            </div>

            <div className="form-field">
              <label>Tỷ lệ hao hụt dự kiến (0-1)</label>
              <input
                className="field-input"
                type="number"
                step="0.01"
                {...register('expected_waste_pct', { valueAsNumber: true })}
              />
            </div>

            <div className="form-field">
              <label>Sức căng khuyên dùng</label>
              <input
                className="field-input"
                placeholder="VD: 12 - 15 cN"
                {...register('recommended_tension')}
              />
            </div>

            <div className="form-field">
              <label>Stitch Length khuyên dùng (mm)</label>
              <input
                className="field-input"
                type="number"
                step="0.01"
                {...register('recommended_stitch_length', {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>

          <div className="flex space-x-6">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="field-checkbox"
                {...register('need_special_feeder')}
              />
              <span className="text-sm font-medium">Cần Feeder đặc biệt</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="field-checkbox"
                {...register('need_lycra_attachment')}
              />
              <span className="text-sm font-medium">
                Cần đính kèm Lycra (Spandex)
              </span>
            </label>
          </div>

          <div className="form-field">
            <label>Ghi chú sản xuất</label>
            <textarea
              className="field-input"
              rows={3}
              {...register('production_notes')}
            />
          </div>
        </div>

        <div className="border-t border-border p-4 bg-surface flex justify-end gap-3 shrink-0">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Lưu cấu hình
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
