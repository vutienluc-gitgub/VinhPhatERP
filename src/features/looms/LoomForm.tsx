import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import { Icon } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
import { useStepper } from '@/shared/hooks/useStepper';
import {
  useCreateLoom,
  useNextLoomCode,
  useUpdateLoom,
} from '@/application/settings';
import { useWeavingSuppliers } from '@/application/production';
import { loomDefaultValues, loomSchema } from '@/schema/loom.schema';
import type { LoomFormValues } from '@/schema/loom.schema';
import { getErrorMessage } from '@/shared/utils/error';
import { buildLoomCodePrefix } from '@/api/looms.api';

import { LoomFormStep1General } from './components/LoomFormStep1General';
import { LoomFormStep2Capacity } from './components/LoomFormStep2Capacity';
import { LoomFormStep3Specs } from './components/LoomFormStep3Specs';
import { LoomFormStep4Other } from './components/LoomFormStep4Other';
import { LOOM_MESSAGES as MSG } from './loom.constants';
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
    daily_capacity_kg: loom.daily_capacity_kg ?? null,
    year_manufactured: loom.year_manufactured,
    diameter_inch: loom.diameter_inch ?? null,
    gauge: loom.gauge ?? null,
    feeders: loom.feeders ?? null,
    needles: loom.needles ?? null,
    gsm_range: loom.gsm_range ?? '',
    yarn_support: loom.yarn_support ?? '',
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
  const { data: suppliers, isLoading: loadingSuppliers } =
    useWeavingSuppliers();

  const methods = useForm<LoomFormValues>({
    resolver: zodResolver(loomSchema),
    defaultValues: isEditing ? loomToFormValues(loom) : loomDefaultValues,
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { isSubmitting },
  } = methods;

  // Watch fields that determine the smart code prefix
  const watchedLoomType = watch('loom_type');
  const watchedDiameter = watch('diameter_inch');
  const watchedGauge = watch('gauge');

  const smartPrefix = useMemo(
    () => buildLoomCodePrefix(watchedLoomType, watchedDiameter, watchedGauge),
    [watchedLoomType, watchedDiameter, watchedGauge],
  );

  const { data: nextCode } = useNextLoomCode(
    isEditing ? undefined : smartPrefix,
  );

  useEffect(() => {
    reset(isEditing ? loomToFormValues(loom) : loomDefaultValues);
  }, [loom, isEditing, reset]);

  // Auto-set code whenever the smart prefix or next code changes
  useEffect(() => {
    if (!isEditing && nextCode) {
      setValue('code', nextCode);
    }
  }, [isEditing, nextCode, setValue]);

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
  const isTechnicalLocked = isEditing && currentStatus === 'running';

  const stepper = useStepper({
    totalSteps: 4,
    stepValidation: {
      0: () => trigger(['loom_type', 'diameter_inch', 'gauge', 'code', 'name']),
      1: () => trigger(['supplier_id', 'daily_capacity_m', 'status']),
      2: () => trigger(['max_width_cm', 'max_speed_rpm']),
    },
    onCancel: onClose,
  });

  async function handleFinalSubmit(values: LoomFormValues) {
    if (!stepper.isLast) return;
    await onSubmit(values);
  }

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={isEditing ? MSG.FORM_TITLE_EDIT(loom.name) : MSG.FORM_TITLE_CREATE}
      maxWidth={720}
      stepInfo={{ current: stepper.currentStep, total: stepper.totalSteps }}
      footer={
        <StepperFooter
          stepper={stepper}
          onCancel={onClose}
          isPending={isPending}
          submitLabel={isEditing ? MSG.BTN_SUBMIT_EDIT : MSG.BTN_SUBMIT_CREATE}
          formId="loom-form"
        />
      }
    >
      {mutationError && (
        <p className="error-inline mb-4">
          {MSG.ERR_FORM_PREFIX}
          {getErrorMessage(mutationError)}
        </p>
      )}

      {isTechnicalLocked && (
        <div className="warning-inline mb-4 text-sm bg-amber-50 dark:bg-warning-soft/10 text-warning-strong dark:text-warning p-3 rounded-lg flex items-start gap-2 border border-warning dark:border-warning/20">
          <div className="mt-0.5">
            <Icon name="AlertTriangle" size={16} />
          </div>
          <div>
            <strong>{MSG.WARN_TECH_LOCKED_TITLE}</strong>
            <br />
            {MSG.WARN_TECH_LOCKED_DESC}
          </div>
        </div>
      )}

      <FormProvider {...methods}>
        <form
          id="loom-form"
          onSubmit={handleSubmit(handleFinalSubmit)}
          onKeyDown={stepper.handleKeyDown}
          noValidate
          className="space-y-8 pb-4"
        >
          {stepper.currentStep === 0 && (
            <LoomFormStep1General
              isTechnicalLocked={isTechnicalLocked}
              smartPrefix={smartPrefix}
            />
          )}

          {stepper.currentStep === 1 && (
            <LoomFormStep2Capacity
              isTechnicalLocked={isTechnicalLocked}
              supplierOptions={supplierOptions}
              loadingSuppliers={loadingSuppliers}
            />
          )}

          {stepper.currentStep === 2 && (
            <LoomFormStep3Specs isTechnicalLocked={isTechnicalLocked} />
          )}

          {stepper.currentStep === 3 && (
            <LoomFormStep4Other isTechnicalLocked={isTechnicalLocked} />
          )}
        </form>
      </FormProvider>
    </AdaptiveSheet>
  );
}
