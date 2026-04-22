import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import { clsx } from 'clsx';
import { useWatch } from 'react-hook-form';
import type {
  UseFieldArrayReturn,
  UseFormRegister,
  FieldErrors,
  Control,
} from 'react-hook-form';

import { Button } from '@/shared/components';
import { Icon } from '@/shared/components/Icon';
import type { WeavingInvoiceFormValues } from '@/schema/weaving-invoice.schema';
import {
  QUALITY_GRADES,
  QUALITY_GRADE_LABELS,
} from '@/schema/weaving-invoice.schema';
import { checkIsRollScanned } from '@/features/weaving-invoices/hooks/useWeavingInvoiceCalculator';

/* ── Types ── */

interface BulkRollStationProps {
  fields: UseFieldArrayReturn<WeavingInvoiceFormValues, 'rolls'>['fields'];
  register: UseFormRegister<WeavingInvoiceFormValues>;
  control: Control<WeavingInvoiceFormValues>;
  remove: UseFieldArrayReturn<WeavingInvoiceFormValues, 'rolls'>['remove'];
  errors: FieldErrors<WeavingInvoiceFormValues>;
  /** Index of the roll currently being edited in the scanner station */
  activeIndex: number;
  onActiveIndexChange: (idx: number) => void;
}

/* ── Tiny Roll Tile (grid thumbnail) ── */

function RollTile({
  index,
  rollNumber,
  weightKg,
  isActive,
  isScanned,
  onSelect,
}: {
  index: number;
  rollNumber: string;
  weightKg: number | undefined;
  isActive: boolean;
  isScanned: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        'flex flex-col items-center justify-center rounded-xl border p-1.5 text-center transition-all duration-200 min-h-[52px] min-w-0',
        isActive &&
          'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50 scale-105 z-10 shadow-lg',
        !isActive &&
          isScanned &&
          'bg-emerald-50 border-emerald-300 text-emerald-700',
        !isActive &&
          !isScanned &&
          'bg-[var(--surface-subtle)] border-dashed border-[var(--border)] text-[var(--text-secondary)] hover:border-indigo-300',
      )}
    >
      <span className="text-[10px] font-bold truncate w-full">
        {rollNumber || `#${index + 1}`}
      </span>
      {isScanned && (
        <span className="text-[10px] font-semibold tabular-nums">
          {weightKg?.toFixed(1)} kg
        </span>
      )}
    </button>
  );
}

/* ── Main BulkRollStation ── */

export function BulkRollStation({
  fields,
  register,
  control,
  remove,
  errors,
  activeIndex,
  onActiveIndexChange,
}: BulkRollStationProps) {
  const weightInputRef = useRef<HTMLInputElement | null>(null);
  const rollInputRef = useRef<HTMLInputElement | null>(null);
  const [comboCount, setComboCount] = useState(0);

  // Focus thông minh khi activeIndex thay đổi:
  // Nếu mã cuộn đã có sẵn (do Auto-gen/Paste), nhảy thẳng vào Khối lượng để tăng tốc!
  useEffect(() => {
    const timer = setTimeout(() => {
      if (rollInputRef.current && rollInputRef.current.value.trim() !== '') {
        weightInputRef.current?.focus();
        weightInputRef.current?.select();
      } else {
        rollInputRef.current?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeIndex]);

  const watchedRollsRaw = useWatch({
    name: 'rolls',
    control,
  });
  const watchedRolls = useMemo(() => watchedRollsRaw || [], [watchedRollsRaw]);

  // Use business logic hook to check status
  const isRollScanned = useCallback(
    (idx: number) => checkIsRollScanned(watchedRolls[idx]),
    [watchedRolls],
  );

  const scannedCount = watchedRolls.filter(checkIsRollScanned).length;

  // Handle "Enter" on roll_number input => jump to weight_kg
  const handleRollKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        weightInputRef.current?.focus();
        weightInputRef.current?.select();
      }
    },
    [],
  );

  // Handle "Enter" on weight_kg input => confirm & move to next
  const handleWeightKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Combo animation
        setComboCount((c) => c + 1);
        // Move to next roll
        if (activeIndex < fields.length - 1) {
          onActiveIndexChange(activeIndex + 1);
        }
      }
    },
    [activeIndex, fields.length, onActiveIndexChange],
  );

  // Reset combo when user pauses
  useEffect(() => {
    if (comboCount === 0) return;
    const timer = setTimeout(() => setComboCount(0), 3000);
    return () => clearTimeout(timer);
  }, [comboCount]);

  const currentField = fields[activeIndex];

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* ── LEFT: Roll Grid (Resource Bay) ── */}
      <div className="lg:w-[280px] xl:w-[320px] flex-shrink-0">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              Xe tải ({fields.length} cuộn)
            </h4>
            <span className="text-xs font-semibold text-emerald-600 tabular-nums">
              {scannedCount} đã nhập
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-1.5 max-h-[360px] overflow-y-auto">
            {fields.map((field, idx) => (
              <RollTile
                key={field.id}
                index={idx}
                rollNumber={watchedRolls[idx]?.roll_number || ''}
                weightKg={
                  parseFloat(String(watchedRolls[idx]?.weight_kg)) || undefined
                }
                isActive={idx === activeIndex}
                isScanned={isRollScanned(idx)}
                onSelect={() => onActiveIndexChange(idx)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Scanning Station ── */}
      <div className="flex-1 min-w-0">
        {currentField ? (
          <div
            key={currentField.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 relative overflow-hidden"
          >
            {/* Combo badge */}
            {comboCount >= 2 && (
              <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full animate-bounce shadow-lg">
                COMBO x{comboCount}
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Icon name="ScanBarcode" size={20} />
              </div>
              <div>
                <h4 className="text-lg font-black text-[var(--text-primary)]">
                  Cuộn #{activeIndex + 1}
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Quét mã hoặc gõ tay. Enter để nhảy sang cuộn tiếp.
                </p>
              </div>
            </div>

            {/* Main inputs - LARGE for touch/scanner */}
            <div className="flex flex-col gap-4">
              <div className="form-field">
                <label className="text-sm font-bold">
                  Mã cuộn <span className="field-required">*</span>
                </label>
                <input
                  className={clsx(
                    'field-input text-lg font-semibold h-12',
                    errors.rolls?.[activeIndex]?.roll_number && 'is-error',
                  )}
                  placeholder="Quét barcode hoặc gõ mã..."
                  {...register(`rolls.${activeIndex}.roll_number`)}
                  ref={(el) => {
                    register(`rolls.${activeIndex}.roll_number`).ref(el);
                    rollInputRef.current = el;
                  }}
                  onKeyDown={handleRollKeyDown}
                  autoFocus
                />
                {errors.rolls?.[activeIndex]?.roll_number && (
                  <span className="field-error">
                    {errors.rolls[activeIndex]?.roll_number?.message}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-field">
                  <label className="text-sm font-bold">
                    Khối lượng (kg) <span className="field-required">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    className={clsx(
                      'field-input text-xl font-black h-14 text-center tabular-nums',
                      errors.rolls?.[activeIndex]?.weight_kg && 'is-error',
                    )}
                    placeholder="0.0"
                    {...register(`rolls.${activeIndex}.weight_kg`)}
                    ref={(el) => {
                      register(`rolls.${activeIndex}.weight_kg`).ref(el);
                      weightInputRef.current = el;
                    }}
                    onKeyDown={handleWeightKeyDown}
                  />
                  {errors.rolls?.[activeIndex]?.weight_kg && (
                    <span className="field-error">
                      {errors.rolls[activeIndex]?.weight_kg?.message}
                    </span>
                  )}
                </div>

                <div className="form-field">
                  <label className="text-sm font-bold">Dài (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="field-input text-lg h-14 text-center tabular-nums"
                    placeholder="—"
                    {...register(`rolls.${activeIndex}.length_m`)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-field">
                  <label className="text-sm font-bold">Chất lượng</label>
                  <select
                    className={clsx(
                      'field-select h-12',
                      errors.rolls?.[activeIndex]?.quality_grade && 'is-error',
                    )}
                    {...register(`rolls.${activeIndex}.quality_grade`)}
                  >
                    <option value="">— Chưa kiểm định —</option>
                    {QUALITY_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {QUALITY_GRADE_LABELS[g]}
                      </option>
                    ))}
                  </select>
                  {errors.rolls?.[activeIndex]?.quality_grade && (
                    <span className="field-error">
                      {errors.rolls[activeIndex]?.quality_grade?.message}
                    </span>
                  )}
                </div>
                <div className="form-field">
                  <label className="text-sm font-bold">Vị trí kho</label>
                  <input
                    className="field-input h-12"
                    placeholder="A1-R3"
                    {...register(`rolls.${activeIndex}.warehouse_location`)}
                  />
                </div>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border)]">
              <Button
                variant="secondary"
                type="button"
                disabled={activeIndex <= 0}
                onClick={() => onActiveIndexChange(activeIndex - 1)}
              >
                Cuộn trước
              </Button>
              <span className="text-sm font-bold tabular-nums text-[var(--text-secondary)]">
                {activeIndex + 1} / {fields.length}
              </span>
              <div className="flex gap-2">
                {fields.length > 1 && (
                  <button
                    type="button"
                    className="btn-icon danger"
                    onClick={() => {
                      remove(activeIndex);
                      if (activeIndex >= fields.length - 1 && activeIndex > 0) {
                        onActiveIndexChange(activeIndex - 1);
                      }
                    }}
                    title="Xóa cuộn này"
                  >
                    <Icon name="Trash2" size={16} />
                  </button>
                )}
                <Button
                  type="button"
                  disabled={activeIndex >= fields.length - 1}
                  onClick={() => onActiveIndexChange(activeIndex + 1)}
                >
                  Cuộn tiếp
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-[var(--text-secondary)]">
            Chưa có cuộn nào. Hãy thêm cuộn hoặc paste từ Excel.
          </div>
        )}
      </div>
    </div>
  );
}
