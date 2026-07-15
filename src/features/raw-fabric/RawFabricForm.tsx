import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import type { UseFormWatch } from 'react-hook-form';

import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
// eslint-disable-next-line boundaries/dependencies
import { QuickSupplierForm } from '@/features/procurement/suppliers/QuickSupplierForm';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import { useStepper } from '@/shared/hooks/useStepper';
import { useAutoSave, loadDraft, clearDraft } from '@/shared/hooks/useAutoSave';
import DraftBanner from '@/shared/components/DraftBanner';
import SaveStatus from '@/shared/components/SaveStatus';
import {
  useCreateRawFabric,
  useUpdateRawFabric,
  useWeavingPartners,
  useWorkOrderOptions,
  useYarnReceiptOptions,
} from '@/application/inventory';
import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
  rawFabricDefaults,
  rawFabricSchema,
} from '@/schema/raw-fabric.schema';
import type { RawFabricFormValues } from '@/schema/raw-fabric.schema';
import { getErrorMessage } from '@/shared/utils/error';

import type { RawFabricRoll } from './types';
import { RAW_FABRIC_MESSAGES as MSG } from './raw-fabric.constants';
import { RawFabricFormStep1General } from './components/RawFabricFormStep1General';
import { RawFabricFormStep2Storage } from './components/RawFabricFormStep2Storage';
import { RawFabricFormStep3Origin } from './components/RawFabricFormStep3Origin';

const DRAFT_KEY = 'raw-fabric-draft';

/**
 * Isolated sub-component for auto-save.
 * Re-renders caused by watch() are confined here.
 */
function AutoSaveSubscriber({
  watch,
}: {
  watch: UseFormWatch<RawFabricFormValues>;
}) {
  const formValues = watch();
  const { status: saveStatus, lastSavedAt } = useAutoSave({
    key: DRAFT_KEY,
    data: formValues,
    delay: 800,
  });
  return <SaveStatus status={saveStatus} lastSavedAt={lastSavedAt} />;
}

const QUALITY_OPTIONS = [
  { value: '', label: MSG.LBL_UNVERIFIED },
  ...QUALITY_GRADES.map((g) => ({
    value: g,
    label: QUALITY_GRADE_LABELS[g],
  })),
];

const STATUS_OPTIONS = ROLL_STATUSES.map((s) => ({
  value: s,
  label: ROLL_STATUS_LABELS[s],
}));

type RawFabricFormProps = {
  roll: RawFabricRoll | null;
  onClose: () => void;
};

function rollToFormValues(roll: RawFabricRoll): RawFabricFormValues {
  return {
    roll_number: roll.roll_number,
    fabric_type: roll.fabric_type,
    color_name: roll.color_name ?? '',
    color_code: roll.color_code ?? '',
    width_cm: roll.width_cm ?? undefined,
    length_m: roll.length_m ?? undefined,
    weight_kg: roll.weight_kg ?? undefined,
    quality_grade:
      (roll.quality_grade as RawFabricFormValues['quality_grade']) ?? undefined,
    status: roll.status,
    warehouse_location: roll.warehouse_location ?? '',
    production_date: roll.production_date ?? '',
    notes: roll.notes ?? '',
    yarn_receipt_id: roll.yarn_receipt_id ?? '',
    weaving_partner_id: roll.weaving_partner_id ?? '',
    work_order_id: roll.work_order_id ?? '',
    lot_number: roll.lot_number ?? '',
  };
}

export function RawFabricForm({ roll, onClose }: RawFabricFormProps) {
  const isEditing = roll !== null;
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [savedDraft, setSavedDraft] = useState<RawFabricFormValues | null>(
    null,
  );
  const createMutation = useCreateRawFabric();
  const updateMutation = useUpdateRawFabric();
  const { data: weavingPartners = [] } = useWeavingPartners();
  const { data: yarnReceipts = [] } = useYarnReceiptOptions();
  const { data: workOrders = [] } = useWorkOrderOptions();
  const { data: colorOptions = [] } = useColorOptions();

  const workOrderOptions = useMemo(
    () =>
      workOrders.map((wo) => ({
        value: wo.id,
        label: `${wo.work_order_number} (${wo.bom_template?.name})`,
      })),
    [workOrders],
  );

  const weavingPartnerOptions = useMemo(
    () =>
      weavingPartners.map((s) => ({
        value: s.id,
        label: `${s.name} (${s.code})`,
      })),
    [weavingPartners],
  );

  const yarnReceiptOptions = useMemo(
    () =>
      yarnReceipts.map((r) => ({
        value: r.id,
        label: `${r.receipt_number} (${r.receipt_date})`,
      })),
    [yarnReceipts],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    trigger,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<RawFabricFormValues>({
    resolver: zodResolver(rawFabricSchema),
    defaultValues: isEditing ? rollToFormValues(roll) : rawFabricDefaults,
  });

  const stepper = useStepper({
    totalSteps: 3,
    stepValidation: {
      0: () =>
        trigger([
          'roll_number',
          'fabric_type',
          'width_cm',
          'length_m',
          'weight_kg',
        ]),
      1: () => trigger(['status', 'quality_grade']),
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

  const handleCancel = useCallback(() => {
    if (isDirty) {
      if (!window.confirm(MSG.ERR_UNSAVED)) {
        return false;
      }
    }
    onClose();
    return true;
  }, [isDirty, onClose]);

  useEffect(() => {
    reset(isEditing ? rollToFormValues(roll) : rawFabricDefaults);
  }, [roll, isEditing, reset]);

  // ── DRAFT RESTORATION ──
  useEffect(() => {
    if (isEditing) return;
    const draft = loadDraft<RawFabricFormValues>(DRAFT_KEY);
    if (draft && draft.roll_number) {
      setSavedDraft(draft);
      setShowDraftBanner(true);
    }
  }, [isEditing]);

  function handleRestoreDraft() {
    if (!savedDraft) return;
    reset(savedDraft);
    setShowDraftBanner(false);
    setSavedDraft(null);
  }

  function handleDiscardDraft() {
    clearDraft(DRAFT_KEY);
    setShowDraftBanner(false);
    setSavedDraft(null);
  }

  const workOrderId = useWatch({
    control,
    name: 'work_order_id',
  });
  const weavingPartnerId = useWatch({
    control,
    name: 'weaving_partner_id',
  });
  const yarnReceiptId = useWatch({
    control,
    name: 'yarn_receipt_id',
  });
  const productionDate = useWatch({
    control,
    name: 'production_date',
  });
  const manualLotNumber = useWatch({
    control,
    name: 'lot_number',
  });

  useEffect(() => {
    if (workOrderId && weavingPartnerId && yarnReceiptId) {
      const wo = workOrders.find((w) => w.id === workOrderId);
      const wp = weavingPartners.find((w) => w.id === weavingPartnerId);
      const yr = yarnReceipts.find((r) => r.id === yarnReceiptId);

      if (wo && wp && yr) {
        let datePart = '';
        if (productionDate) {
          datePart = productionDate.replace(/-/g, '');
        } else {
          datePart = new Date()
            .toISOString()
            .substring(0, 10)
            .replace(/-/g, '');
        }

        const wpCode = wp.code || wp.name.substring(0, 3).toUpperCase();
        const autoLot = `${wo.work_order_number}-${wpCode}-${yr.receipt_number}-${datePart}`;

        if (manualLotNumber !== autoLot) {
          setValue('lot_number', autoLot, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }
      }
    }
  }, [
    workOrderId,
    weavingPartnerId,
    yarnReceiptId,
    productionDate,
    manualLotNumber,
    workOrders,
    weavingPartners,
    yarnReceipts,
    setValue,
  ]);

  const isLotAutoGenerated = !!(
    workOrderId &&
    weavingPartnerId &&
    yarnReceiptId
  );

  // Stepper handles validation next

  async function onSubmit(values: RawFabricFormValues) {
    if (!stepper.isLast) {
      // Prevents accidental submit if enter is pressed on an earlier step
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: roll.id,
          values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      clearDraft(DRAFT_KEY);
      onClose();
    } catch (_err) {
      // Lỗi được hiển thị qua mutation.error bên dưới
    }
  }

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={handleCancel}
      title={
        isEditing
          ? `${MSG.FORM_TITLE_EDIT} ${roll.roll_number}`
          : MSG.FORM_TITLE_NEW
      }
      stepInfo={{
        current: stepper.currentStep,
        total: stepper.totalSteps,
      }}
    >
      {mutationError && (
        <p className="error-inline mb-4">
          {MSG.ERR_PREFIX} {getErrorMessage(mutationError)}
        </p>
      )}

      {showDraftBanner && (
        <DraftBanner
          onRestore={handleRestoreDraft}
          onDiscard={handleDiscardDraft}
        />
      )}

      <form
        id="raw-fabric-form"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={stepper.handleKeyDown}
        noValidate
      >
        <div className="form-grid">
          {/* ── BƯỚC 1: THÔNG TIN CƠ BẢN ── */}
          <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
            <RawFabricFormStep1General
              register={register}
              control={control}
              errors={errors}
              isLotAutoGenerated={isLotAutoGenerated}
              colorComboboxOptions={toColorComboboxOptions(colorOptions)}
            />
          </div>

          {/* ── BƯỚC 2: PHÂN LOẠI & LƯU TRỮ ── */}
          <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
            <RawFabricFormStep2Storage
              register={register}
              control={control}
              qualityOptions={QUALITY_OPTIONS}
              statusOptions={STATUS_OPTIONS}
            />
          </div>

          {/* ── BƯỚC 3: TRUY VẾT NGUỒN GỐC ── */}
          <div className={stepper.currentStep === 2 ? 'block' : 'hidden'}>
            <RawFabricFormStep3Origin
              control={control}
              workOrderOptions={workOrderOptions}
              weavingPartnerOptions={weavingPartnerOptions}
              yarnReceiptOptions={yarnReceiptOptions}
              onNewPartnerClick={() => setShowQuickSupplier(true)}
            />
            {showQuickSupplier && (
              <div className="mb-4">
                <QuickSupplierForm
                  defaultCategory="weaving"
                  onCreated={(created) => {
                    setValue('weaving_partner_id', created.id);
                    setShowQuickSupplier(false);
                  }}
                  onCancel={() => setShowQuickSupplier(false)}
                />
              </div>
            )}
          </div>
        </div>

        <StepperFooter
          stepper={stepper}
          onCancel={handleCancel}
          isPending={isPending}
          submitLabel={isEditing ? 'Lưu thay đổi' : 'Nhập kho'}
        >
          <AutoSaveSubscriber watch={watch} />
        </StepperFooter>
      </form>
    </AdaptiveSheet>
  );
}
