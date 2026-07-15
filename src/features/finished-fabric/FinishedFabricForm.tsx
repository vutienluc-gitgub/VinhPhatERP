import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
import { useStepper } from '@/shared/hooks/useStepper';
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

import { FinishedFabricFormStep3Storage } from './components/FinishedFabricFormStep3Storage';
import { FinishedFabricFormStep2Specs } from './components/FinishedFabricFormStep2Specs';
import { FinishedFabricFormStep1General } from './components/FinishedFabricFormStep1General';
import { FINISHED_FABRIC_MESSAGES as MSG } from './finished-fabric.constants';
import { editBlockReason, getAllowedStatusTransitions } from './transitions';
import type { FinishedFabricRoll, RollStatus } from './types';

type FinishedFabricFormProps = {
  roll: FinishedFabricRoll | null;
  onClose: () => void;
};

const QUALITY_OPTIONS = [
  { value: '', label: MSG.LBL_UNVERIFIED },
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
    formState: { errors, isSubmitting, isDirty },
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
    onCancel: () => {
      if (isDirty) {
        if (!window.confirm(MSG.ERR_UNSAVED)) {
          return false;
        }
      }
      onClose();
      return true;
    },
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
          ? `${MSG.FORM_TITLE_EDIT} ${roll.roll_number}`
          : MSG.FORM_TITLE_NEW
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
            {MSG.ERR_PREFIX} {getErrorMessage(mutationError)}
          </p>
        )}

        <fieldset disabled={isLocked} className="border-none p-0 m-0">
          <div className="form-grid">
            <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
              <FinishedFabricFormStep1General
                register={register}
                control={control}
                errors={errors}
                reset={reset}
                setValue={setValue}
                isLocked={isLocked}
                currentImageUrl={currentImageUrl ?? null}
                uploadImageMutation={uploadImageMutation}
                deleteImageMutation={deleteImageMutation}
                fabricComboOptions={fabricComboOptions}
                rawRollComboOptions={rawRollComboOptions}
                supplierComboOptions={supplierComboOptions}
                sourceType={sourceType}
                setSourceType={setSourceType}
              />
            </div>

            {/* === BƯỚC 2: ĐẶC TÍNH SẢN PHẨM === */}
            <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
              <FinishedFabricFormStep2Specs
                register={register}
                control={control}
                errors={errors}
                setValue={setValue}
                colorComboboxOptions={toColorComboboxOptions(colorOptions)}
              />
            </div>

            {/* === BƯỚC 3: PHÂN LOẠI & LƯU KHO === */}
            <div className={stepper.currentStep === 2 ? 'block' : 'hidden'}>
              <FinishedFabricFormStep3Storage
                register={register}
                control={control}
                qualityOptions={QUALITY_OPTIONS}
                statusOptions={statusOptions}
              />
            </div>
          </div>
        </fieldset>
      </form>
    </AdaptiveSheet>
  );
}
