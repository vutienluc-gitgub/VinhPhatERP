import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import type { UseFormWatch } from 'react-hook-form';

import { Button } from '@/shared/components';
import { Icon } from '@/shared/components/Icon';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { StepperFooter } from '@/shared/components/StepperFooter';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import { useAllSuppliers } from '@/shared/hooks';
import { useStepper } from '@/shared/hooks/useStepper';
import { useAutoSave, loadDraft, clearDraft } from '@/shared/hooks/useAutoSave';
import DraftBanner from '@/shared/components/DraftBanner';
import SaveStatus from '@/shared/components/SaveStatus';
import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import { LotMatrixCard } from '@/shared/components/roll-grid';
import type { RollMatrixItem } from '@/shared/components/roll-grid';
import {
  useCreateFinishedFabricBulk,
  useRawRollsByLot,
} from '@/application/inventory';
import { useFinishedFabricExport } from '@/application/inventory';
import {
  usePurchaseOrderList,
  usePurchaseOrder,
} from '@/application/purchase-orders/usePurchaseOrders';
import { formatQuantity } from '@/shared/value/core/formatter';
import { sumBy } from '@/shared/utils/array.util';
import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
  bulkFinishedInputDefaults,
  bulkFinishedInputSchema,
} from '@/schema/finished-fabric.schema';
import type { BulkFinishedRollRowInput } from '@/schema/finished-fabric.schema';
import { useBulkRollPrefix } from '@/shared/hooks/useBulkRollPrefix';
import type { BulkFinishedInputFormValues } from '@/schema/finished-fabric.schema';
import {
  parseCsvText,
  parseExcelFile,
} from '@/domain/inventory/finished-fabric-import.util';
import type { ParsedRow } from '@/domain/inventory/finished-fabric-import.util';

import type { FinishedFabricRoll } from './types';
import { FinishedFabricBulkFormStep1General } from './components/FinishedFabricBulkFormStep1General';
import { FinishedFabricBulkFormStep1Config } from './components/FinishedFabricBulkFormStep1Config';
import { FINISHED_FABRIC_MESSAGES as MSG } from './finished-fabric.constants';

type Props = {
  onClose: () => void;
};

const DRAFT_KEY = 'finished-fabric-bulk-draft';

/**
 * Isolated sub-component for auto-save.
 * Re-renders caused by watch() are confined here.
 */
function AutoSaveSubscriber({
  watch,
}: {
  watch: UseFormWatch<BulkFinishedInputFormValues>;
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
  { value: '', label: 'Chưa kiểm định' },
  ...QUALITY_GRADES.map((g) => ({
    value: g,
    label: QUALITY_GRADE_LABELS[g],
  })),
];

const STATUS_OPTIONS = ROLL_STATUSES.map((s) => ({
  value: s,
  label: ROLL_STATUS_LABELS[s],
}));

export function FinishedFabricBulkForm({ onClose }: Props) {
  const bulkMutation = useCreateFinishedFabricBulk();
  const [savedRolls, setSavedRolls] = useState<FinishedFabricRoll[] | null>(
    null,
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [savedDraft, setSavedDraft] =
    useState<BulkFinishedInputFormValues | null>(null);
  const { exportRollsExcel, exportRollsPdf } = useFinishedFabricExport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    reset,
    watch,
    formState: { errors, isValid, isSubmitting, isDirty },
  } = useForm<BulkFinishedInputFormValues>({
    resolver: zodResolver(bulkFinishedInputSchema),
    defaultValues: bulkFinishedInputDefaults,
    mode: 'onTouched',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rolls',
  });

  const stepper = useStepper({
    totalSteps: 2,
    stepValidation: {
      0: async () => {
        const stepValid = await trigger([
          'lot_number',
          'fabric_type',
          'width_cm',
          'roll_prefix',
          'start_number',
        ]);
        if (!stepValid) return false;

        // Nếu có cuộn mộc trong lô, tự động điền vào grid
        if (rawRollsForLot.length > 0 && fields.length <= 1) {
          for (let i = fields.length - 1; i >= 0; i--) remove(i);
          const newRows: BulkFinishedRollRowInput[] = rawRollsForLot.map(
            (rawRoll, i) => ({
              roll_number: getRollNumber(i),
              raw_roll_id: rawRoll.id,
              weight_kg: undefined,
              length_m: undefined,
              quality_grade: undefined,
              notes: '',
            }),
          );
          append(newRows as Parameters<typeof append>[0]);
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

  // ── DRAFT RESTORATION ──
  const draftCheckedRef = useRef(false);
  useEffect(() => {
    if (draftCheckedRef.current) return;
    draftCheckedRef.current = true;
    const draft = loadDraft<BulkFinishedInputFormValues>(DRAFT_KEY);
    if (draft && draft.lot_number) {
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

  const rolls = useWatch({
    control,
    name: 'rolls',
  });
  const lotNumber = useWatch({
    control,
    name: 'lot_number',
  });

  // Lấy danh sách cuộn mộc theo lot_number đã nhập
  const { data: rawRollsForLot = [] } = useRawRollsByLot(lotNumber ?? '');
  const { data: colorOptions = [] } = useColorOptions();
  const { data: fabricOptions = [] } = useFabricCatalogOptions();

  const { data: suppliersData } = useAllSuppliers({ status: 'active' });
  const supplierComboOptions = useMemo(
    () =>
      (suppliersData || []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.code})`,
      })),
    [suppliersData],
  );

  const sourceType = useWatch({
    control,
    name: 'source_type',
  });

  const fabricComboOptions = useMemo(
    () =>
      fabricOptions.map((f) => ({
        value: f.name,
        label: f.code ? `${f.name} (${f.code})` : f.name,
      })),
    [fabricOptions],
  );

  const importFromPo = useWatch({ control, name: 'import_from_po' });
  const selectedPoId = useWatch({ control, name: 'po_id' });

  // Fetch PO List (only when source_type is purchased and import_from_po is true)
  const { data: poList } = usePurchaseOrderList(
    sourceType === 'purchased' && importFromPo ? { status: 'approved' } : {}, // Or maybe fetch all that are not cancelled?
  );
  const poComboOptions = useMemo(() => {
    return (poList || []).map((po) => ({
      value: po.id,
      label: `${po.po_code} - ${po.supplier_name_snapshot || 'No Supplier'}`,
    }));
  }, [poList]);

  // Fetch specific PO details
  const { data: selectedPo } = usePurchaseOrder(
    importFromPo && selectedPoId ? selectedPoId : undefined,
  );

  const poItemComboOptions = useMemo(() => {
    if (!selectedPo?.items) return [];
    return selectedPo.items.map((item) => {
      // Find fabric name from fabricOptions if material_id matches
      const fabric = fabricOptions.find((f) => f.id === item.material_id);
      const fabricName = fabric ? fabric.name : item.material_id;
      return {
        value: item.id,
        label: `${fabricName} - ${item.ordered_qty} ${item.uom}`,
        itemDetails: item,
      };
    });
  }, [selectedPo, fabricOptions]);

  const selectedPoItemId = useWatch({ control, name: 'po_item_id' });

  // Autofill form when PO item is selected
  useEffect(() => {
    if (importFromPo && selectedPo && selectedPoItemId) {
      const item = selectedPo.items?.find((i) => i.id === selectedPoItemId);
      if (item) {
        // Auto-fill fields
        setValue('supplier_id', selectedPo.supplier_id);
        setValue('document_number', selectedPo.po_code);

        // Match fabric_type name
        const fabric = fabricOptions.find((f) => f.id === item.material_id);
        if (fabric?.name) {
          setValue('fabric_type', fabric.name);
        }

        setValue('purchase_price', Number(item.unit_price) || undefined);
        const unit = item.uom === 'mét' ? 'VND/m' : 'VND/kg';
        setValue('purchase_price_unit', unit);
      }
    }
  }, [importFromPo, selectedPo, selectedPoItemId, setValue, fabricOptions]);

  const { resolvedStart: _resolvedStart, getRollNumber } = useBulkRollPrefix({
    control,
    fields,
    setValue,
    defaultPrefix: bulkFinishedInputDefaults.roll_prefix,
    defaultStartNumber: bulkFinishedInputDefaults.start_number,
  });

  const addRow = useCallback(() => {
    const row: BulkFinishedRollRowInput = {
      roll_number: getRollNumber(fields.length),
      raw_roll_id: '',
      weight_kg: undefined,
      length_m: undefined,
      quality_grade: undefined,
      notes: '',
    };
    append(row as Parameters<typeof append>[0]);
  }, [append, getRollNumber, fields.length]);

  // Tổng hợp — chỉ đếm dòng có nhập trọng lượng > 0
  const filledRolls = useMemo(() => {
    return (rolls ?? []).filter((r) => {
      if (!r) return false;
      const val = parseFloat(String(r.weight_kg));
      return Number.isFinite(val) && val > 0;
    });
  }, [rolls]);

  const totalRolls = filledRolls.length;

  /** Map RHF fields → RollMatrixItem[], gắn sublabel = mã cuộn mộc tương ứng */
  const gridRolls: RollMatrixItem[] = useMemo(() => {
    return fields.map((field, idx) => {
      const rawRollId = rolls?.[idx]?.raw_roll_id;
      const matchedRaw = rawRollsForLot.find((r) => r.id === rawRollId);
      return {
        id: field.id,
        roll_number: rolls?.[idx]?.roll_number ?? '',
        weight_kg: rolls?.[idx]?.weight_kg,
        raw_roll_number: matchedRaw?.roll_number,
      };
    });
  }, [fields, rolls, rawRollsForLot]);

  async function onSubmit(values: BulkFinishedInputFormValues) {
    if (!stepper.isLast) return;
    try {
      const saved = await bulkMutation.mutateAsync(values);
      clearDraft(DRAFT_KEY);
      setSavedRolls(saved);
    } catch {
      // lỗi hiển thị qua bulkMutation.error bên dưới
    }
  }

  // ---- Import Excel/CSV ----
  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    try {
      let parsed: ParsedRow[];
      if (file.name.endsWith('.csv')) {
        const text = await file.text();
        parsed = parseCsvText(text);
      } else {
        parsed = await parseExcelFile(file);
      }

      if (parsed.length === 0) {
        setImportError('File không có dữ liệu hoặc không đúng định dạng.');
        return;
      }

      // Resolve raw_roll_number → raw_roll_id nếu có
      const rawMap = new Map(rawRollsForLot.map((r) => [r.roll_number, r.id]));

      const newRows = parsed.map((row, i) => {
        const rollNum = row.roll_number || getRollNumber(i);

        let rawId = '' as string;
        if (row.raw_roll_number) {
          rawId = rawMap.get(row.raw_roll_number) ?? '';
        }

        return {
          roll_number: rollNum,
          raw_roll_id: rawId,
          weight_kg: row.weight_kg ?? undefined,
          length_m: row.length_m,
          quality_grade: (['A', 'B', 'C'].includes(row.quality_grade ?? '')
            ? row.quality_grade
            : undefined) as 'A' | 'B' | 'C' | undefined,
          notes: row.notes ?? '',
        } as BulkFinishedRollRowInput;
      });

      // Replace all rows
      // Remove existing, then append new
      for (let i = fields.length - 1; i >= 0; i--) {
        remove(i);
      }
      append(newRows as Parameters<typeof append>[0]);

      const unresolved = parsed.filter(
        (r) => r.raw_roll_number && !rawMap.get(r.raw_roll_number),
      );
      if (unresolved.length > 0) {
        setImportError(
          `${parsed.length} dòng đã nhập. ${unresolved.length} cuộn mộc không tìm thấy trong lô "${lotNumber}": ${unresolved
            .map((r) => r.raw_roll_number)
            .join(', ')}. Vui lòng chọn lại cuộn mộc cho các dòng này.`,
        );
      }
    } catch (err) {
      setImportError(
        `Lỗi đọc file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const isPending = isSubmitting || bulkMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={handleCancel}
      title="Nhập nhanh cuộn vải thành phẩm"
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
              onClick={() =>
                exportRollsExcel(savedRolls, 'bien_ban_nhap_kho_tp')
              }
            >
              <Icon name="FileSpreadsheet" size={16} /> Xuất Excel
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => exportRollsPdf(savedRolls, 'bien_ban_nhap_kho_tp')}
            >
              <Icon name="Printer" size={16} /> Xuất PDF
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
            <p className="error-inline mb-4 whitespace-pre-line">
              Lỗi:{' '}
              {bulkMutation.error instanceof Error
                ? bulkMutation.error.message
                : String(bulkMutation.error)}
            </p>
          )}

          <form
            id="finished-fabric-bulk-form"
            onSubmit={handleSubmit(onSubmit)}
            onKeyDown={stepper.handleKeyDown}
            noValidate
          >
            {/* ── BƯỚC 1: CẤU HÌNH NHẬP & NHẢY MÃ ── */}
            <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
              <FinishedFabricBulkFormStep1General
                register={register}
                control={control}
                errors={errors}
                reset={reset}
                setValue={setValue}
                sourceType={sourceType}
                supplierComboOptions={supplierComboOptions}
                fabricComboOptions={fabricComboOptions}
                colorComboboxOptions={toColorComboboxOptions(colorOptions)}
                qualityOptions={QUALITY_OPTIONS}
                statusOptions={STATUS_OPTIONS}
                rawRollsForLotLength={rawRollsForLot.length}
                poComboOptions={poComboOptions}
                poItemComboOptions={poItemComboOptions}
                importFromPo={importFromPo}
              />

              <FinishedFabricBulkFormStep1Config
                register={register}
                errors={errors}
              />
            </div>

            {/* ── BƯỚC 2: BẢNG NHẬP LIỆU (DATA TABLE) ── */}
            <div className={stepper.currentStep === 1 ? 'block' : 'hidden'}>
              <fieldset className="bulk-section">
                <legend>Import từ Excel / CSV</legend>
                <div className="flex gap-3 items-center flex-wrap">
                  <input
                    className="field-input text-[0.88rem]"
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileImport}
                  />
                  <span className="bulk-hint">
                    Header: Mã cuộn, Cuộn mộc, Cân, Dài, CL, Ghi chú.
                    {sourceType === 'produced' &&
                      lotNumber &&
                      rawRollsForLot.length === 0 && (
                        <strong className="error-hint">
                          {' '}
                          Chưa tìm thấy cuộn mộc nào trong lô "{lotNumber}" —
                          hãy kiểm tra lại số lô.
                        </strong>
                      )}
                  </span>
                </div>
                {importError && <p className="warning-inline">{importError}</p>}
              </fieldset>

              <fieldset className="bulk-section">
                <legend>Nhập số tịnh từng cuộn thành phẩm</legend>

                {sourceType === 'produced' && rawRollsForLot.length > 0 && (
                  <p className="text-[0.82rem] text-muted-foreground mb-3">
                    Đã ghép <strong>{rawRollsForLot.length} cuộn mộc</strong> từ
                    lô. Nhãn nhỏ trong ô = Mã cuộn mộc nguồn.
                  </p>
                )}

                <LotMatrixCard
                  title={`Lô ${lotNumber ?? '—'} · ${fields.length} cuộn TP`}
                  lotNumber={lotNumber ?? undefined}
                  rolls={gridRolls}
                  expectedRollsCount={fields.length}
                  mode="input"
                  onRollChange={(index, weight) => {
                    // RHF expects `number` per Zod inference, but preprocess accepts undefined at runtime
                    setValue(
                      `rolls.${index}.weight_kg`,
                      (weight ?? undefined) as number,
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
