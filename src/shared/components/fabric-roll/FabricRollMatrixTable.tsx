import React, { useMemo } from 'react';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import {
  buildPackingMatrixRows,
  calculatePackingSummary,
  normalizeGrade,
} from '@/domain/inventory/packing-list.utils';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils/cn';

export interface FabricRollMatrixTableProps {
  rolls: FabricRollPackingItem[];
  rollsPerRow?: number;
  compact?: boolean;
  showSubtotal?: boolean;
  interactive?: boolean;
  onRollClick?: (roll: FabricRollPackingItem) => void;
  onToggleCheck?: (roll: FabricRollPackingItem) => void;
  className?: string;
}

export const FabricRollMatrixTable: React.FC<FabricRollMatrixTableProps> = ({
  rolls,
  rollsPerRow = 10,
  compact = false,
  showSubtotal = true,
  interactive = true,
  onRollClick,
  onToggleCheck,
  className,
}) => {
  const rows = useMemo(
    () => buildPackingMatrixRows(rolls, rollsPerRow),
    [rolls, rollsPerRow],
  );

  const summary = useMemo(() => calculatePackingSummary(rolls), [rolls]);

  if (!rolls || rolls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5 py-6 text-center text-xs text-muted border border-dashed border-border rounded-lg bg-surface">
        <Icon
          name="PackageOpen"
          size={20}
          className="text-muted/60"
          aria-hidden="true"
        />
        <span>Không có dữ liệu cây vải.</span>
      </div>
    );
  }

  // Column header numbers (01, 02, ..., 10)
  const colNumbers = Array.from({ length: rollsPerRow }, (_, i) =>
    String(i + 1).padStart(2, '0'),
  );

  return (
    <div
      className={cn(
        'w-full overflow-x-auto rounded-lg border border-border bg-surface',
        className,
      )}
    >
      <table className="w-full border-collapse text-left text-xs font-sans">
        <thead>
          <tr className="border-b border-border bg-surface-secondary/70 text-muted font-bold">
            <th
              scope="col"
              className={cn(
                'border-r border-border text-center whitespace-nowrap',
                compact
                  ? 'py-1 px-1.5 text-[10px] w-14'
                  : 'py-2 px-2.5 text-xs w-20',
              )}
            >
              STT CÂY
            </th>

            {colNumbers.map((num) => (
              <th
                key={num}
                scope="col"
                className={cn(
                  'border-r border-border text-center font-bold tracking-tight',
                  compact ? 'py-1 px-1 text-[10px]' : 'py-2 px-1.5 text-xs',
                )}
              >
                {num}
              </th>
            ))}

            {showSubtotal && (
              <th
                scope="col"
                className={cn(
                  'text-right font-bold text-foreground whitespace-nowrap',
                  compact
                    ? 'py-1 px-2 text-[10px] w-20'
                    : 'py-2 px-3 text-xs w-24',
                )}
              >
                CỘNG (KG)
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => (
            <tr
              key={`matrix-row-${row.row_index}-${row.range_label}`}
              className="border-b border-border/80 hover:bg-surface-secondary/30 transition-colors"
            >
              {/* Range Label (e.g. 01 - 10) */}
              <td
                className={cn(
                  'border-r border-border font-semibold text-muted text-center whitespace-nowrap bg-surface-secondary/20',
                  compact ? 'py-1 px-1 text-[10px]' : 'py-1.5 px-2 text-xs',
                )}
              >
                {row.range_label}
              </td>

              {/* 10 Cells */}
              {row.cells.map((cell) => {
                const roll = cell.roll;
                const hasRoll =
                  cell.weight_kg !== undefined && roll !== undefined;

                if (!hasRoll) {
                  return (
                    <td
                      key={`empty-${row.row_index}-${cell.col_index}`}
                      className={cn(
                        'border-r border-border text-center text-muted select-none',
                        compact
                          ? 'py-1 px-1 text-[10px]'
                          : 'py-1.5 px-1.5 text-xs',
                      )}
                    >
                      —
                    </td>
                  );
                }

                const gradeNorm = normalizeGrade(roll.grade);
                const isGradeB = gradeNorm === 'B';
                const isChecked = Boolean(roll.checked);

                return (
                  <td
                    key={
                      roll.id ||
                      roll.roll_code ||
                      `cell-${row.row_index}-${cell.col_index}`
                    }
                    tabIndex={interactive ? 0 : undefined}
                    role={interactive ? 'button' : undefined}
                    aria-label={`Cây ${roll.roll_code}, ${cell.weight_kg?.toFixed(1)} kg, Grade ${gradeNorm}, ${isChecked ? 'Đã kiểm đếm' : 'Chưa kiểm đếm'}`}
                    onClick={() => {
                      if (!interactive) return;
                      if (onToggleCheck) onToggleCheck(roll);
                      else if (onRollClick) onRollClick(roll);
                    }}
                    onKeyDown={(e) => {
                      if (!interactive) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (onToggleCheck) onToggleCheck(roll);
                        else if (onRollClick) onRollClick(roll);
                      }
                    }}
                    title={
                      interactive
                        ? `Mã: ${roll.roll_code} | Grade: ${gradeNorm} | ${
                            isChecked ? 'Đã kiểm đếm' : 'Chưa kiểm'
                          } (Nhấn Enter hoặc Click để đối soát)`
                        : undefined
                    }
                    className={cn(
                      'border-r border-border text-center transition-colors',
                      compact ? 'py-1 px-1' : 'py-1.5 px-1.5',
                      interactive &&
                        'cursor-pointer hover:bg-primary/10 active:scale-95 focus-visible:ring-1 focus-visible:ring-primary focus-visible:outline-none',
                      isChecked &&
                        'bg-success-soft/20 text-success font-semibold dark:bg-success-soft/10',
                      !isChecked &&
                        isGradeB &&
                        'bg-warning-soft/20 text-warning font-semibold dark:bg-warning-soft/10',
                    )}
                  >
                    <div className="flex flex-col items-center justify-center leading-tight">
                      <span
                        className={cn(
                          'font-mono tabular-nums font-bold tracking-tight',
                          compact ? 'text-[10.5px]' : 'text-xs',
                          isChecked
                            ? 'text-success'
                            : isGradeB
                              ? 'text-warning'
                              : 'text-foreground',
                        )}
                      >
                        {cell.weight_kg?.toFixed(1)}
                      </span>

                      {!compact && (
                        <span className="text-[9px] text-muted font-mono truncate max-w-[56px] opacity-80">
                          {roll.roll_code}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}

              {/* Subtotal Column */}
              {showSubtotal && (
                <td
                  className={cn(
                    'font-mono tabular-nums font-bold text-foreground text-right whitespace-nowrap bg-surface-secondary/20',
                    compact ? 'py-1 px-2 text-[10.5px]' : 'py-1.5 px-3 text-xs',
                  )}
                >
                  {row.subtotal_weight_kg.toFixed(1)}
                </td>
              )}
            </tr>
          ))}
        </tbody>

        <tfoot>
          <tr className="bg-surface-secondary/70 font-bold border-t-2 border-border text-foreground">
            <td
              colSpan={rollsPerRow + 1}
              className={cn(
                'border-r border-border',
                compact ? 'py-1 px-2 text-[10px]' : 'py-2 px-3 text-xs',
              )}
            >
              <div className="flex items-center justify-between">
                <span>TỔNG CỘNG:</span>
                <span className="text-primary font-extrabold font-mono tabular-nums">
                  {summary.total_rolls} CÂY
                </span>
              </div>
            </td>

            {showSubtotal && (
              <td
                className={cn(
                  'text-right text-primary font-extrabold font-mono tabular-nums whitespace-nowrap',
                  compact ? 'py-1 px-2 text-[11px]' : 'py-2 px-3 text-xs',
                )}
              >
                {summary.total_weight_kg.toFixed(1)} kg
              </td>
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
