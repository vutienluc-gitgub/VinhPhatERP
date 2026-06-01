import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Button } from '@/shared/components/Button';
import { Combobox } from '@/shared/components/Combobox';
import { ErrorInline } from '@/shared/components/ErrorInline';
import {
  machineSpecificationSchema,
  MACHINE_TYPES,
  MACHINE_MANUFACTURERS,
  MACHINE_FAMILIES,
  type MachineSpecification,
} from '@/schema/yarn-engineering.schema';
import { useUpsertMachineSpec } from '@/features/looms/hooks/useMachineSpecsAdmin';
import { useAutoGenerateMachineSpecCode } from '@/features/looms/hooks/useAutoGenerateMachineSpecCode';
import { useTenantData } from '@/shared/hooks/useTenant';

type MachineSpecFormProps = {
  isOpen: boolean;
  onClose: () => void;
  editingRecord?: MachineSpecification | null;
};

export function MachineSpecForm({
  isOpen,
  onClose,
  editingRecord,
}: MachineSpecFormProps) {
  const upsertMutation = useUpsertMachineSpec();
  const tenant = useTenantData();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<MachineSpecification>({
    resolver: zodResolver(machineSpecificationSchema),
    defaultValues: {
      is_active: true,
      source_type: 'manual',
    },
  });

  // Watch fields for code auto-generation
  const typeVal = watch('machine_type');
  const diaVal = watch('diameter');
  const gaugeVal = watch('gauge');
  const feederVal = watch('feeder_count');

  useAutoGenerateMachineSpecCode({
    editingRecord,
    typeVal,
    diaVal,
    gaugeVal,
    feederVal,
    setValue,
  });

  useEffect(() => {
    if (isOpen) {
      if (editingRecord) {
        reset(editingRecord);
      } else {
        reset({
          is_active: true,
          source_type: 'manual',
        });
      }
    }
  }, [isOpen, editingRecord, reset]);

  const manufacturerOptions = useMemo(() => {
    return MACHINE_MANUFACTURERS.map((m) => ({ value: m, label: m }));
  }, []);

  const familyOptions = useMemo(() => {
    return MACHINE_FAMILIES.map((f) => ({ value: f, label: f }));
  }, []);

  const onSubmit = async (data: MachineSpecification) => {
    const payload = {
      ...data,
      ...(editingRecord
        ? {
            id: editingRecord.id,
            tenant_id: (
              editingRecord as MachineSpecification & { tenant_id?: string }
            ).tenant_id,
          }
        : { tenant_id: tenant.id }),
    };
    await upsertMutation.mutateAsync(payload);
    onClose();
  };

  return (
    <AdaptiveSheet
      open={isOpen}
      onClose={onClose}
      title={editingRecord ? 'Cập nhật cấu hình máy' : 'Thêm mới cấu hình máy'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="form-grid">
            <div className="form-field">
              <label>
                Loại máy (Machine Type){' '}
                <span className="field-required">*</span>
              </label>
              <select className="field-input" {...register('machine_type')}>
                <option value="">Chọn loại máy...</option>
                {MACHINE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.machine_type && (
                <ErrorInline>{errors.machine_type.message}</ErrorInline>
              )}
            </div>

            <div className="form-field">
              <label>
                Diameter (inch) <span className="field-required">*</span>
              </label>
              <input
                className="field-input"
                type="number"
                step="0.1"
                {...register('diameter', { valueAsNumber: true })}
              />
              {errors.diameter && (
                <ErrorInline>{errors.diameter.message}</ErrorInline>
              )}
            </div>

            <div className="form-field">
              <label>Gauge (G)</label>
              <input
                className="field-input"
                type="number"
                step="0.1"
                {...register('gauge', {
                  valueAsNumber: true,
                  setValueAs: (v) => (v === '' || isNaN(v) ? null : v),
                })}
              />
              {errors.gauge && (
                <ErrorInline>{errors.gauge.message}</ErrorInline>
              )}
            </div>

            <div className="form-field">
              <label>
                Feeder Count <span className="field-required">*</span>
              </label>
              <input
                className="field-input"
                type="number"
                {...register('feeder_count', { valueAsNumber: true })}
              />
              {errors.feeder_count && (
                <ErrorInline>{errors.feeder_count.message}</ErrorInline>
              )}
            </div>

            <div className="form-field md:col-span-2">
              <label>
                Mã hệ thống (Code) <span className="field-required">*</span>
              </label>
              <input
                className="field-input bg-surface font-mono"
                {...register('code')}
                placeholder="Tự động sinh hoặc nhập thủ công..."
              />
              <p className="text-xs text-text-tertiary mt-1">
                VD: SINGLEJERSEY-34-28-96
              </p>
              {errors.code && <ErrorInline>{errors.code.message}</ErrorInline>}
            </div>

            <div className="form-field">
              <label>Hãng sản xuất (Manufacturer)</label>
              <Controller
                name="manufacturer"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={manufacturerOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Chọn hãng..."
                    allowInput
                  />
                )}
              />
              {errors.manufacturer && (
                <ErrorInline>{errors.manufacturer.message}</ErrorInline>
              )}
            </div>

            <div className="form-field">
              <label>Nhóm máy (Machine Family)</label>
              <Controller
                name="machine_family"
                control={control}
                render={({ field }) => (
                  <Combobox
                    options={familyOptions}
                    value={field.value || ''}
                    onChange={field.onChange}
                    placeholder="Chọn nhóm..."
                    allowInput
                  />
                )}
              />
              {errors.machine_family && (
                <ErrorInline>{errors.machine_family.message}</ErrorInline>
              )}
            </div>
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
