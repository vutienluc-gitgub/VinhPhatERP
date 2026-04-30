import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useFieldArray, useForm, useWatch, Controller } from 'react-hook-form';

import { Button } from '@/shared/components';
import { AdaptiveSheet } from '@/shared/components/AdaptiveSheet';
import { Combobox } from '@/shared/components/Combobox';
import {
  useColorOptions,
  toColorComboboxOptions,
} from '@/shared/hooks/useColorOptions';
import { useStepper } from '@/shared/hooks/useStepper';
import { useFabricCatalogOptions } from '@/shared/hooks/useFabricCatalogOptions';
import { LotMatrixCard } from '@/shared/components/roll-grid';
import type { RollMatrixItem } from '@/shared/components/roll-grid';
import {
  useCreateFinishedFabricBulk,
  useRawRollsByLot,
} from '@/application/inventory';
import { useFinishedFabricExport } from '@/application/inventory';
import { sumBy } from '@/shared/utils/array.util';
import {
  QUALITY_GRADE_LABELS,
  QUALITY_GRADES,
  ROLL_STATUS_LABELS,
  ROLL_STATUSES,
  bulkFinishedInputDefaults,
  bulkFinishedInputSchema,
  formatBulkRollNumber,
} from '@/schema/finished-fabric.schema';
import type { BulkFinishedInputFormValues } from '@/schema/finished-fabric.schema';

import type { FinishedFabricRoll } from './types';

type Props = {
  onClose: () => void;
};

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

/* ---- Excel/CSV import helpers ---- */

const HEADER_ALIASES: Record<string, string> = {
  'mã cuộn': 'roll_number',
  'ma cuon': 'roll_number',
  roll_number: 'roll_number',
  'cuộn mộc': 'raw_roll_number',
  'cuon moc': 'raw_roll_number',
  raw_roll_number: 'raw_roll_number',
  raw_roll: 'raw_roll_number',
  cân: 'weight_kg',
  can: 'weight_kg',
  'trọng lượng': 'weight_kg',
  'trong luong': 'weight_kg',
  weight_kg: 'weight_kg',
  weight: 'weight_kg',
  dài: 'length_m',
  dai: 'length_m',
  length_m: 'length_m',
  length: 'length_m',
  cl: 'quality_grade',
  'chất lượng': 'quality_grade',
  'chat luong': 'quality_grade',
  quality_grade: 'quality_grade',
  'ghi chú': 'notes',
  'ghi chu': 'notes',
  notes: 'notes',
};

function normalizeHeader(raw: string): string {
  const key = raw.trim().toLowerCase();
  return HEADER_ALIASES[key] ?? key;
}

type ParsedRow = {
  roll_number?: string;
  raw_roll_number?: string;
  weight_kg?: number;
  length_m?: number;
  quality_grade?: string;
  notes?: string;
};

async function parseExcelFile(file: File): Promise<ParsedRow[]> {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws || ws.rowCount < 2) return [];

  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = normalizeHeader(String(cell.value ?? ''));
  });

  const rows: ParsedRow[] = [];
  for (let i = 2; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    const obj: Record<string, unknown> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const h = headers[colNumber];
      if (h) obj[h] = cell.value;
    });
    if (!obj.roll_number && !obj.weight_kg) continue;
    rows.push({
      roll_number:
        obj.roll_number != null ? String(obj.roll_number).trim() : undefined,
      raw_roll_number:
        obj.raw_roll_number != null
          ? String(obj.raw_roll_number).trim()
          : undefined,
      weight_kg: obj.weight_kg != null ? Number(obj.weight_kg) : undefined,
      length_m: obj.length_m != null ? Number(obj.length_m) : undefined,
      quality_grade:
        obj.quality_grade != null
          ? String(obj.quality_grade).trim().toUpperCase()
          : undefined,
      notes: obj.notes != null ? String(obj.notes).trim() : undefined,
    });
  }
  return rows;
}

function parseCsvText(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0]!.split(',').map(normalizeHeader);
  const rows: ParsedRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i]!.split(',');
    const obj: Record<string, string> = {};
    cells.forEach((c, idx) => {
      if (headers[idx]) obj[headers[idx]] = c.trim();
    });
    if (!obj.roll_number && !obj.weight_kg) continue;
    rows.push({
      roll_number: obj.roll_number || undefined,
      raw_roll_number: obj.raw_roll_number || undefined,
      weight_kg: obj.weight_kg ? Number(obj.weight_kg) : undefined,
      length_m: obj.length_m ? Number(obj.length_m) : undefined,
      quality_grade: obj.quality_grade?.toUpperCase() || undefined,
      notes: obj.notes || undefined,
    });
  }
  return rows;
}

export function FinishedFabricBulkForm({ onClose }: Props) {
  const bulkMutation = useCreateFinishedFabricBulk();
  const [savedRolls, setSavedRolls] = useState<FinishedFabricRoll[] | null>(
    null,
  );
  const [importError, setImportError] = useState<string | null>(null);
  const { exportExcel, exportPdf } = useFinishedFabricExport();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stepper = useStepper({ totalSteps: 2 });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    formState: { errors, isValid, isSubmitting },
  } = useForm<BulkFinishedInputFormValues>({
    resolver: zodResolver(bulkFinishedInputSchema),
    defaultValues: bulkFinishedInputDefaults,
    mode: 'onTouched',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rolls',
  });

  const rollPrefix = useWatch({
    control,
    name: 'roll_prefix',
  });
  const startNumber = useWatch({
    control,
    name: 'start_number',
  });
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

  const fabricComboOptions = useMemo(
    () =>
      fabricOptions.map((f) => ({
        value: f.name,
        label: f.code ? `${f.name} (${f.code})` : f.name,
      })),
    [fabricOptions],
  );

  // Auto-generate roll numbers khi prefix hoặc start_number thay đổi
  useEffect(() => {
    const prefix = rollPrefix?.trim() || bulkFinishedInputDefaults.roll_prefix;
    const start =
      typeof startNumber === 'number'
        ? startNumber
        : bulkFinishedInputDefaults.start_number;
    fields.forEach((_, idx) => {
      setValue(
        `rolls.${idx}.roll_number`,
        formatBulkRollNumber(prefix, start + idx),
      );
    });
  }, [rollPrefix, startNumber, fields.length, setValue, fields]);

  const addRow = useCallback(() => {
    const prefix = rollPrefix?.trim() || bulkFinishedInputDefaults.roll_prefix;
    const start =
      typeof startNumber === 'number'
        ? startNumber
        : bulkFinishedInputDefaults.start_number;
    append({
      roll_number: formatBulkRollNumber(prefix, start + fields.length),
      raw_roll_id: '' as unknown as string,
      weight_kg: undefined as unknown as number,
      length_m: undefined,
      quality_grade: undefined,
      notes: '',
    });
  }, [append, rollPrefix, startNumber, fields.length]);

  // Tổng hợp — chỉ đếm dòng có nhập trọng lượng > 0
  const filledRolls = (rolls ?? []).filter((r) => {
    const val = parseFloat(String(r.weight_kg));
    return Number.isFinite(val) && val > 0;
  });
  const totalRolls = filledRolls.length;

  /** Map RHF fields → RollMatrixItem[], gắn sublabel = mã cuộn mộc tương ứng */
  const gridRolls: RollMatrixItem[] = fields.map((field, idx) => {
    const rawRollId = rolls?.[idx]?.raw_roll_id;
    const matchedRaw = rawRollsForLot.find((r) => r.id === rawRollId);
    return {
      id: field.id,
      roll_number: rolls?.[idx]?.roll_number ?? '',
      weight_kg: rolls?.[idx]?.weight_kg,
      raw_roll_number: matchedRaw?.roll_number,
    };
  });

  async function handleNextStep() {
    if (stepper.currentStep === 0) {
      const stepValid = await trigger([
        'lot_number',
        'fabric_type',
        'width_cm',
        'roll_prefix',
        'start_number',
      ]);
      if (!stepValid) return;

      // Nếu có cuộn mộc trong lô, tự động điền vào grid
      if (rawRollsForLot.length > 0 && fields.length <= 1) {
        const prefix =
          rollPrefix?.trim() || bulkFinishedInputDefaults.roll_prefix;
        const start =
          typeof startNumber === 'number'
            ? startNumber
            : bulkFinishedInputDefaults.start_number;
        // Xóa dòng hiện tại rồi tạo lại theo số cuộn mộc
        for (let i = fields.length - 1; i >= 0; i--) remove(i);
        const newRows = rawRollsForLot.map((rawRoll, i) => ({
          roll_number: formatBulkRollNumber(prefix, start + i),
          raw_roll_id: rawRoll.id as unknown as string,
          weight_kg: undefined as unknown as number,
          length_m: undefined,
          quality_grade: undefined,
          notes: '',
        }));
        append(newRows);
      }

      stepper.next();
    }
  }

  async function onSubmit(values: BulkFinishedInputFormValues) {
    if (!stepper.isLast) return;
    try {
      const saved = await bulkMutation.mutateAsync(values);
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
        const prefix =
          rollPrefix?.trim() || bulkFinishedInputDefaults.roll_prefix;
        const start =
          typeof startNumber === 'number'
            ? startNumber
            : bulkFinishedInputDefaults.start_number;
        const rollNum =
          row.roll_number || formatBulkRollNumber(prefix, start + i);

        let rawId = '' as string;
        if (row.raw_roll_number) {
          rawId = rawMap.get(row.raw_roll_number) ?? '';
        }

        return {
          roll_number: rollNum,
          raw_roll_id: rawId as unknown as string,
          weight_kg: (row.weight_kg ?? undefined) as unknown as number,
          length_m: row.length_m,
          quality_grade: (['A', 'B', 'C'].includes(row.quality_grade ?? '')
            ? row.quality_grade
            : undefined) as 'A' | 'B' | 'C' | undefined,
          notes: row.notes ?? '',
        };
      });

      // Replace all rows
      // Remove existing, then append new
      for (let i = fields.length - 1; i >= 0; i--) {
        remove(i);
      }
      append(newRows);

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
      setImportError(`Lỗi đọc file: ${(err as Error).message}`);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const isPending = isSubmitting || bulkMutation.isPending;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
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
              {sumBy(savedRolls, (r) => r.weight_kg ?? 0).toLocaleString(
                'vi-VN',
                { maximumFractionDigits: 2 },
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
              onClick={() => exportExcel(savedRolls, 'bien_ban_nhap_kho_tp')}
            >
              {' '}
              📊 Xuất Excel
            </Button>
            <Button
              variant="secondary"
              type="button"
              onClick={() => exportPdf(savedRolls, 'bien_ban_nhap_kho_tp')}
            >
              {' '}
              🖨 Xuất PDF
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
          {bulkMutation.error && (
            <p className="error-inline mb-4 whitespace-pre-line">
              Lỗi: {(bulkMutation.error as Error).message}
            </p>
          )}

          <form
            id="finished-fabric-bulk-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            {/* ── BƯỚC 1: CẤU HÌNH NHẬP & NHẢY MÃ ── */}
            <div className={stepper.currentStep === 0 ? 'block' : 'hidden'}>
              <fieldset className="bulk-section">
                <legend>Thông tin lô & chung</legend>

                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="bulk_lot_number">
                      Số lô (Lot number){' '}
                      <span className="field-required">*</span>
                    </label>
                    <input
                      id="bulk_lot_number"
                      className={`field-input${errors.lot_number ? ' is-error' : ''}`}
                      type="text"
                      placeholder="VD: LOT-2026-001"
                      {...register('lot_number')}
                    />
                    {errors.lot_number && (
                      <span className="field-error">
                        {errors.lot_number.message}
                      </span>
                    )}
                    <span className="field-hint text-[0.8rem] text-[#666] mt-1 block">
                      Bắt buộc. Hệ thống sẽ đối chiếu với lô cuộn mộc nguồn.
                      {rawRollsForLot.length > 0 && (
                        <strong>
                          {' '}
                          — Tìm thấy {rawRollsForLot.length} cuộn mộc trong lô
                          này.
                        </strong>
                      )}
                    </span>
                  </div>

                  <div className="form-field">
                    <label htmlFor="bulk_fabric_type">
                      Loại vải <span className="field-required">*</span>
                    </label>
                    <Controller
                      name="fabric_type"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={fabricComboOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Chọn loại vải..."
                          hasError={!!errors.fabric_type}
                        />
                      )}
                    />
                    {errors.fabric_type && (
                      <span className="field-error">
                        {errors.fabric_type.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="bulk_color_name">Màu vải</label>
                    <Controller
                      name="color_name"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={toColorComboboxOptions(colorOptions)}
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          placeholder="Chọn hoặc nhập màu..."
                        />
                      )}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="bulk_color_code">Mã màu</label>
                    <input
                      id="bulk_color_code"
                      className="field-input"
                      type="text"
                      placeholder="VD: TC-01"
                      {...register('color_code')}
                    />
                  </div>
                </div>

                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="bulk_width_cm">Khổ vải (cm)</label>
                    <input
                      id="bulk_width_cm"
                      className={`field-input${errors.width_cm ? ' is-error' : ''}`}
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="VD: 150"
                      {...register('width_cm')}
                    />
                    {errors.width_cm && (
                      <span className="field-error">
                        {errors.width_cm.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="bulk_quality_grade">
                      Chất lượng mặc định
                    </label>
                    <Controller
                      name="quality_grade"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={QUALITY_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="bulk_status">Trạng thái</label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Combobox
                          options={STATUS_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  <div className="form-field">
                    <label htmlFor="bulk_production_date">
                      Ngày hoàn thành
                    </label>
                    <input
                      id="bulk_production_date"
                      className="field-input"
                      type="date"
                      {...register('production_date')}
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label htmlFor="bulk_warehouse_location">Vị trí kho</label>
                  <input
                    id="bulk_warehouse_location"
                    className="field-input"
                    type="text"
                    placeholder="VD: B2-R1-S4"
                    {...register('warehouse_location')}
                  />
                </div>
              </fieldset>

              <fieldset className="bulk-section">
                <legend>Cấu hình mã cuộn tự động</legend>
                <div className="form-grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                  <div className="form-field">
                    <label htmlFor="bulk_roll_prefix">
                      Tiền tố mã cuộn <span className="field-required">*</span>
                    </label>
                    <input
                      id="bulk_roll_prefix"
                      className={`field-input${errors.roll_prefix ? ' is-error' : ''}`}
                      type="text"
                      placeholder="VD: FN-"
                      {...register('roll_prefix')}
                    />
                    {errors.roll_prefix && (
                      <span className="field-error">
                        {errors.roll_prefix.message}
                      </span>
                    )}
                  </div>

                  <div className="form-field">
                    <label htmlFor="bulk_start_number">Số bắt đầu</label>
                    <input
                      id="bulk_start_number"
                      className={`field-input${errors.start_number ? ' is-error' : ''}`}
                      type="number"
                      min="1"
                      step="1"
                      {...register('start_number')}
                    />
                    {errors.start_number && (
                      <span className="field-error">
                        {errors.start_number.message}
                      </span>
                    )}
                  </div>
                </div>
              </fieldset>
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
                    {lotNumber && rawRollsForLot.length === 0 && (
                      <strong className="text-[#c0392b]">
                        {' '}
                        Chưa tìm thấy cuộn mộc nào trong lô "{lotNumber}" — hãy
                        kiểm tra lại số lô.
                      </strong>
                    )}
                  </span>
                </div>
                {importError && (
                  <p className="text-[#c07020] text-[0.85rem] mt-2">
                    {importError}
                  </p>
                )}
              </fieldset>

              <fieldset className="bulk-section">
                <legend>Nhập số tịnh từng cuộn thành phẩm</legend>

                {rawRollsForLot.length > 0 && (
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
            <div className="modal-footer mt-6 p-0 border-none justify-between">
              <div>
                {!stepper.isFirst && (
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={stepper.prev}
                    disabled={isPending}
                  >
                    Quay lại
                  </Button>
                )}
                {stepper.isFirst && (
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={onClose}
                    disabled={isPending}
                  >
                    Hủy
                  </Button>
                )}
              </div>

              <div>
                {!stepper.isLast ? (
                  <button
                    className="primary-button btn-standard"
                    type="button"
                    onClick={handleNextStep}
                    disabled={isPending}
                  >
                    Tiếp tục
                  </button>
                ) : (
                  <button
                    className="primary-button btn-standard"
                    type="submit"
                    disabled={isPending || !isValid || totalRolls === 0}
                  >
                    {isPending ? 'Đang lưu...' : `Lưu ${totalRolls} cuộn`}
                  </button>
                )}
              </div>
            </div>
          </form>
        </>
      )}
    </AdaptiveSheet>
  );
}
