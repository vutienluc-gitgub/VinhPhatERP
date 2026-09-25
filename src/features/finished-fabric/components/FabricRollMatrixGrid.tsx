import React from 'react';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import {
  normalizeGrade,
  roundWeight,
} from '@/domain/inventory/packing-list.utils';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils/cn';

interface FabricRollMatrixGridProps {
  rolls: FabricRollPackingItem[];
  onRollClick?: (roll: FabricRollPackingItem) => void;
  onToggleCheck?: (roll: FabricRollPackingItem) => void;
  interactive?: boolean;
}

export const FabricRollMatrixGrid: React.FC<FabricRollMatrixGridProps> = ({
  rolls,
  onRollClick,
  onToggleCheck,
  interactive = true,
}) => {
  if (rolls.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted">
        Không có cây vải nào trong danh mục hiển thị.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
      {rolls.map((roll, index) => {
        const gradeNorm = normalizeGrade(roll.grade);
        const isChecked = Boolean(roll.checked);
        const sequence = roll.roll_sequence || index + 1;

        return (
          <div
            key={roll.id || roll.roll_code}
            className={cn(
              'group relative flex flex-col justify-between p-3 rounded-xl border transition-all select-none',
              isChecked
                ? 'bg-success-soft/20 border-success/40 dark:bg-success-soft/10'
                : 'bg-surface border-border hover:border-primary/50 hover:shadow-sm',
            )}
          >
            {/* Header: Sequence & Checkbox/Status */}
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                #{sequence < 10 ? `0${sequence}` : sequence}
              </span>

              <div className="flex items-center gap-1">
                {/* Grade Badge */}
                <span
                  className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight',
                    gradeNorm === 'A'
                      ? 'bg-success-soft text-success'
                      : gradeNorm === 'B'
                        ? 'bg-warning-soft text-warning'
                        : 'bg-surface-secondary text-muted',
                  )}
                >
                  {gradeNorm}
                </span>

                {/* Check action */}
                {interactive && onToggleCheck ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleCheck(roll);
                    }}
                    className={cn(
                      'w-5 h-5 rounded flex items-center justify-center transition-colors',
                      isChecked
                        ? 'bg-success text-inverse-foreground'
                        : 'border border-border text-transparent hover:border-primary/60 hover:text-muted',
                    )}
                    title={isChecked ? 'Đã kiểm đếm' : 'Đánh dấu đã kiểm'}
                  >
                    <Icon name="Check" size={12} />
                  </button>
                ) : isChecked ? (
                  <span className="w-4 h-4 rounded-full bg-success text-inverse-foreground flex items-center justify-center">
                    <Icon name="Check" size={10} />
                  </span>
                ) : null}
              </div>
            </div>

            {/* Body: Roll Code & Weight */}
            <div
              className={cn(
                'flex flex-col cursor-pointer',
                interactive && 'hover:opacity-80',
              )}
              onClick={() => onRollClick?.(roll)}
            >
              <span className="text-xs font-semibold text-foreground truncate">
                {roll.roll_code}
              </span>

              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-base font-extrabold text-foreground">
                  {roundWeight(roll.weight_kg).toFixed(1)}
                </span>
                <span className="text-[11px] font-medium text-muted">kg</span>
              </div>
            </div>

            {/* Footer: Color or Lot tag */}
            <div className="mt-2 pt-1.5 border-t border-border/50 flex items-center justify-between text-[11px] text-muted truncate">
              <span className="truncate">{roll.color_name || 'N/A'}</span>
              {roll.width_inch ? (
                <span className="text-[10px] shrink-0 font-medium">
                  {roll.width_inch}&quot;
                </span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
