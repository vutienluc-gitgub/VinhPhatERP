import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import type { UseFormWatch } from 'react-hook-form';

import { Button } from '@/shared/components';
import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import { useStepper } from '@/shared/hooks/useStepper';
import { useAutoSave, loadDraft, clearDraft } from '@/shared/hooks/useAutoSave';
import DraftBanner from '@/shared/components/DraftBanner';
import SaveStatus from '@/shared/components/SaveStatus';
import { LotMatrixCard } from '@/shared/components/roll-grid';
import type { RollMatrixItem } from '@/shared/components/roll-grid';
import {
  useCreateRawFabricBulk,
  useWeavingPartners,
  useWorkOrderOptions,
  useYarnReceiptOptions,
} from '@/application/inventory';
import { useRawFabricExport } from '@/application/inventory';
import { formatQuantity } from '@/shared/value/core/formatter';
import { sumBy } from '@/shared/utils/array.util';
import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
  bulkInputDefaults,
  bulkInputSchema,
} from '@/schema/raw-fabric.schema';
import { useBulkRollPrefix } from '@/shared/hooks/useBulkRollPrefix';
import type { BulkInputFormValues } from '@/schema/raw-fabric.schema';

import type { RawFabricRoll } from './types';
import { RawFabricBulkFormStep1General } from './components/RawFabricBulkFormStep1General';
import { RawFabricBulkFormStep1Config } from './components/RawFabricBulkFormStep1Config';
import { RAW_FABRIC_MESSAGES as MSG } from './raw-fabric.constants';

const DRAFT_KEY = 'raw-fabric-bulk-draft';

/**
 * Isolated sub-component for auto-save.
 * Re-renders caused by watch() are confined here.
 */
function AutoSaveSubscriber({
  watch,
}: {
  watch: UseFormWatch<BulkInputFormValues>;
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

type Props = {
  onClose: () => void;
};

export function RawFabricBulkForm({ onClose }: Props) {
  const bulkMutation = useCreateRawFabricBulk();
  const { data: weavingPartners = [] } = useWeavingPartners();
  const { data: yarnReceipts = [] } = useYarnReceiptOptions();
  const { data: workOrders = [] } = useWorkOrderOptions();
  const { data: colorOptions = [] } = useColorOptions();
  const { data: fabricCatalogOptions = [] } = useFabricCatalogOptions();
  const [savedRolls, setSavedRolls] = useState<RawFabricRoll[] | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [savedDraft, setSavedDraft] = useState<BulkInputFormValues | null>(
    null,
  );
  const { exportExcel, exportPdf } = useRawFabricExport();

  const memoizedFabricCatalogOptions = useMemo(
    () =>
      fabricCatalogOptions.map((c) => ({
        label: c.name,
        value: c.name,
        code: c.code,
      })),
    [fabricCatalogOptions],
  );

  const memoizedColorOptions = useMemo(
    () => toColorComboboxOptions(colorOptions),
    [colorOptions],
  );

  const memoizedWorkOrders = useMemo(
    () =>
      workOrders.map((wo) => ({
        value: wo.id,
        label: `${wo.work_order_number} (${wo.bom_template?.name})`,
      })),
    [workOrders],
  );

  const memoizedWeavingPartners = useMemo(
    () =>
      weavingPartners.map((s) => ({
        value: s.id,
        label: `${s.name} (${s.code})`,
      })),
    [weavingPartners],
  );

  const memoizedYarnReceipts = useMemo(
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
    setValue,
    trigger,
    reset,
    watch,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<BulkInputFormValues>({
    resolver: zodResolver(bulkInputSchema),
    defaultValues: bulkInputDefaults,
    mode: 'onTouched',
  });

  const stepper = useStepper({
    totalSteps: 2,
    stepValidation: {
      0: async () => {
        const stepValid = await trigger([
          'fabric_type',
          'width_cm',
          'roll_prefix',
          'start_number',
        ]);
        if (!stepValid) return false;

        // Auto-populate grid dựa trên expected_rolls
        const expected = watch('expected_rolls');
        const currentFieldsLength = watch('rolls')?.length || 0;
        const target = typeof expected === 'number' ? expected : 1;
        const missing = target - currentFieldsLength;
        if (missing > 0) {
          const newRows = Array.from({ length: missing }, (_, i) => ({
            roll_number: getRollNumber(currentFieldsLength + i),
            weight_kg: undefined as unknown as number,
            length_m: undefined,
            quality_grade: undefined,
            notes: '',
          }));
          append(newRows);
        }
        return true;
      },
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

  const { fields, append } = useFieldArray({
    control,
    name: 'rolls',
  });

  // ── DRAFT RESTORATION ──
  useEffect(() => {
    const draft = loadDraft<BulkInputFormValues>(DRAFT_KEY);
    if (draft && draft.fabric_type) {
      setSavedDraft(draft);
      setShowDraftBanner(true);
    }
  }, []);

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

  const { resolvedPrefix, getRollNumber } = useBulkRollPrefix({
    control,
    fields,
    setValue,
    defaultPrefix: bulkInputDefaults.roll_prefix,
    defaultStartNumber: bulkInputDefaults.start_number,
  });

  // Sinh tự động Lot number từ Lệnh SX, Nhà dệt, Phiếu sợi
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

  function handleWoWpYrChange(
    field: 'work_order_id' | 'weaving_partner_id' | 'yarn_receipt_id',
    val: string,
  ) {
    setValue(field, val, { shouldValidate: true, shouldDirty: true });

    // Read current values, injecting the new one being changed
    const currentWo = field === 'work_order_id' ? val : workOrderId;
    const currentWp = field === 'weaving_partner_id' ? val : weavingPartnerId;
    const currentYr = field === 'yarn_receipt_id' ? val : yarnReceiptId;

    if (currentWo && currentWp && currentYr) {
      const wo = workOrders.find((w) => w.id === currentWo);
      const wp = weavingPartners.find((w) => w.id === currentWp);
      const yr = yarnReceipts.find((r) => r.id === currentYr);

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

          const autoPrefix = `RM-${autoLot}-`;
          if (resolvedPrefix !== autoPrefix) {
            setValue('roll_prefix', autoPrefix, {
              shouldValidate: true,
              shouldDirty: true,
            });
          }
        }
      }
    }
  }

  // Removed unused isLotAutoGenerated
  const isPrefixAutoGenerated = !!manualLotNumber;

  /** Thêm 1 cuộn mới vào cuối grid */
  const addRow = useCallback(() => {
    append({
      roll_number: getRollNumber(fields.length),
      weight_kg: undefined as unknown as number,
      length_m: undefined,
      quality_grade: undefined,
      notes: '',
    });
  }, [append, getRollNumber, fields.length]);

  /** Embed fields array directly as RollMatrixItem[] for LotMatrixCard */
  const gridRolls: RollMatrixItem[] = fields.map((field) => ({
    id: field.id,
    roll_number: field.roll_number ?? '',
    weight_kg: field.weight_kg,
  }));

  const totalRolls =
    watch('rolls')?.filter(
      (r) =>
        Number.isFinite(parseFloat(String(r.weight_kg))) &&
        parseFloat(String(r.weight_kg)) > 0,
    ).length || 0;

  async function onSubmit(values: BulkInputFormValues) {
    if (!stepper.isLast) return;
    const saved = await bulkMutation.mutateAsync(values);
    clearDraft(DRAFT_KEY);
    setSavedRolls(saved);
  }

  const isPending = isSubmitting || bulkMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={handleCancel}
      title="Nhập nhanh cuộn vải mộc"
      stepInfo={
        savedRolls
          ? undefined
          : {
              current: stepper.currentStep,
              total: stepper.totalSteps,
            }
      }
      maxWidth={960}
    >
      {/* ===== SUCCESS STATE ===== */}
      {savedRolls !== null ? (
        <div className="bulk-success">
          <div className="bulk-success-icon">✓</div>
          <p className="bulk-success-title">Nhập kho thành công</p>
          <p className="bulk-success-sub">
            Đã lưu <strong>{savedRolls.length} cuộn</strong> ·{' '}
            <strong>
              {formatQuantity(
                sumBy(savedRolls, (r) => r.weight_kg ?? 0),
                2,
              )}{' '}
              kg
            </strong>
          </p>
          <p className="bulk-success-hint">
            Tùy chọn: xuất danh sách vừa nhập ra file
          </p>
          <div className="bulk-success-actions">
            <Button
              variant="secondary"
              type="button"
              leftIcon="FileSpreadsheet"
              onClick={() => exportExcel(savedRolls, 'bien_ban_nhap_kho')}
            >
              Xuất Excel
            </Button>
            <Button
              variant="secondary"
              type="button"
              leftIcon="FileText"
              onClick={() => exportPdf(savedRolls, 'bien_ban_nhap_kho')}
            >
              Xuất PDF
            </Button>
            <button
              className="primary-button btn-standard"
              type="button"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      ) : (
        <>
          {showDraftBanner && (
            <DraftBanner
              onRestore={handleRestoreDraft}
              onDiscard={handleDiscardDraft}
            />
          )}

          {bulkMutation.error && (
            <p className="error-inline mb-4">
              Lỗi:{' '}
              {bulkMutation.error instanceof Error
                ? bulkMutation.error.message
                : String(bulkMutation.error)}
            </p>
          )}

          <form
            id="raw-fabric-bulk-form"
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={stepper.handleKeyDown}
            noValidate
          >
            {/* ── BƯỚC 1: CẤU HÌNH NHẬP & NHẢY MÃ ── */}
            <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
              <RawFabricBulkFormStep1General
                register={register}
                control={control}
                errors={errors}
                watch={watch}
                fabricCatalogOptions={memoizedFabricCatalogOptions}
                colorComboboxOptions={memoizedColorOptions}
                qualityOptions={QUALITY_OPTIONS}
                statusOptions={STATUS_OPTIONS}
                workOrderOptions={memoizedWorkOrders}
                weavingPartnerOptions={memoizedWeavingPartners}
                yarnReceiptOptions={memoizedYarnReceipts}
                handleWoWpYrChange={handleWoWpYrChange}
              />

              <RawFabricBulkFormStep1Config
                register={register}
                errors={errors}
                isPrefixAutoGenerated={isPrefixAutoGenerated}
              />
            </div>

            {/* ── BƯỚC 2: LƯỚI NHẬP SỐ TỊNH ── */}
            <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
              <fieldset className="bulk-section">
                <legend>Nhập số tịnh từng cuộn</legend>

                <LotMatrixCard
                  title={`Lô ${resolvedPrefix} — ${fields.length} cuộn`}
                  rolls={gridRolls}
                  expectedRollsCount={fields.length}
                  mode="input"
                  onRollChange={(index, weight) => {
                    setValue(
                      `rolls.${index}.weight_kg`,
                      (weight ?? undefined) as unknown as number,
                      { shouldValidate: false },
                    );
                  }}
                  onAddRoll={addRow}
                />

                {errors.rolls?.message && (
                  <span className="field-error mt-3 block">
                    {errors.rolls.message}
                  </span>
                )}

                <div className="flex gap-2 mt-4">
                  <Button variant="secondary" type="button" onClick={addRow}>
                    + 1 cuộn
                  </Button>
                  <span className="self-center text-[0.78rem] text-muted-foreground">
                    Gõ số tịnh → nhấn Enter để chuyển ô tiếp theo
                  </span>
                </div>
              </fieldset>
            </div>

            {/* ===== ACTIONS ===== */}
            <StepperFooter
              stepper={stepper}
              onCancel={handleCancel}
              isPending={isPending}
              submitDisabled={!isValid || totalRolls === 0}
              submitLabel={`Lưu ${totalRolls} cuộn`}
            >
              <AutoSaveSubscriber watch={watch} />
            </StepperFooter>
          </form>
        </>
      )}
    </AdaptiveSheet>
  );
}
