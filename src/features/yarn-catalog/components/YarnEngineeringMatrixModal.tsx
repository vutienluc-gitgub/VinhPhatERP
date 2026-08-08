import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Button } from '@/shared/components/Button';
import { VPSelect, VPOption } from '@/shared/components/VPSelect';
import { VPCombobox } from '@/shared/components/VPCombobox';
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
import { YARN_CATALOG_MESSAGES as MSG } from '@/features/yarn-catalog/yarn-catalog.constants';
import { NumericInput, WeightInput, LengthInput } from '@/shared/value';

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
          label: parts.length > 0 ? parts.join(' - ') : MSG.VAL_EMPTY_CONFIG,
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
      title={editingRecord ? MSG.MATRIX_TITLE_EDIT : MSG.MATRIX_TITLE_NEW}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="form-grid">
            <div className="form-field">
              <label>
                {MSG.MATRIX_LBL_STRUCTURE}{' '}
                <span className="field-required">*</span>
              </label>
              <Controller
                name="fabric_structure_id"
                control={control}
                render={({ field }) => (
                  <VPCombobox
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
                {MSG.MATRIX_LBL_MACHINE}{' '}
                <span className="field-required">*</span>
              </label>
              <Controller
                name="machine_spec_id"
                control={control}
                render={({ field }) => (
                  <VPCombobox
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
                {MSG.MATRIX_LBL_LEVEL} <span className="field-required">*</span>
              </label>
              <Controller
                name="compatibility_level"
                control={control}
                render={({ field }) => (
                  <VPSelect
                    options={
                      COMPATIBILITY_LEVELS as unknown as VPOption<string>[]
                    }
                    value={field.value}
                    onValueChange={field.onChange}
                    className="field-input"
                  />
                )}
              />
              {errors.compatibility_level && (
                <ErrorInline>{errors.compatibility_level.message}</ErrorInline>
              )}
            </div>

            <div className="form-field">
              <label>{MSG.MATRIX_LBL_FEEDING}</label>
              <Controller
                name="feeding_type"
                control={control}
                render={({ field }) => (
                  <VPSelect
                    options={[
                      { value: '', label: MSG.MATRIX_VAL_UNKNOWN },
                      { value: 'positive', label: MSG.MATRIX_VAL_POSITIVE },
                      { value: 'negative', label: MSG.MATRIX_VAL_NEGATIVE },
                      { value: 'auto', label: MSG.MATRIX_VAL_AUTO },
                    ]}
                    value={field.value || ''}
                    onValueChange={field.onChange}
                    className="field-input"
                  />
                )}
              />
            </div>

            <Controller
              name="recommended_rpm"
              control={control}
              render={({ field }) => (
                <NumericInput
                  className="field-input"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <Controller
              name="max_rpm"
              control={control}
              render={({ field }) => (
                <NumericInput
                  className="field-input"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <Controller
              name="expected_efficiency"
              control={control}
              render={({ field }) => (
                <NumericInput
                  className="field-input"
                  step="0.01"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <Controller
              name="expected_waste_pct"
              control={control}
              render={({ field }) => (
                <WeightInput
                  className="field-input"
                  step="0.01"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <div className="form-field">
              <label>{MSG.MATRIX_LBL_TENSION}</label>
              <input
                className="field-input"
                placeholder="VD: 12 - 15 cN"
                {...register('recommended_tension')}
              />
            </div>

            <Controller
              name="recommended_stitch_length"
              control={control}
              render={({ field }) => (
                <LengthInput
                  className="field-input"
                  step="0.01"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          </div>

          <div className="flex space-x-6">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="field-checkbox"
                {...register('need_special_feeder')}
              />
              <span className="text-sm font-medium">
                {MSG.MATRIX_LBL_SPECIAL_FEEDER}
              </span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="field-checkbox"
                {...register('need_lycra_attachment')}
              />
              <span className="text-sm font-medium">
                {MSG.MATRIX_LBL_LYCRA}
              </span>
            </label>
          </div>

          <div className="form-field">
            <label>{MSG.MATRIX_LBL_NOTES}</label>
            <textarea
              className="field-input"
              rows={3}
              {...register('production_notes')}
            />
          </div>
        </div>

        <div className="border-t border-border p-4 bg-surface flex justify-end gap-3 shrink-0">
          <Button type="button" variant="secondary" onClick={onClose}>
            {MSG.BTN_CANCEL}
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {MSG.MATRIX_BTN_SAVE}
          </Button>
        </div>
      </form>
    </AdaptiveSheet>
  );
}
