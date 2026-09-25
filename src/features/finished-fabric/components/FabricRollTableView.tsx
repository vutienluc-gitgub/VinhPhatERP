import React from 'react';

import type { FabricRollPackingItem } from '@/domain/inventory/packing-list.types';
import {
  normalizeGrade,
  roundWeight,
} from '@/domain/inventory/packing-list.utils';
import { PACKING_LIST_TEXT } from '@/features/finished-fabric/packing-list.constants';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils/cn';

interface FabricRollTableViewProps {
  rolls: FabricRollPackingItem[];
  onRollClick?: (roll: FabricRollPackingItem) => void;
  onToggleCheck?: (roll: FabricRollPackingItem) => void;
  interactive?: boolean;
}

export const FabricRollTableView: React.FC<FabricRollTableViewProps> = ({
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
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-border bg-surface-secondary/50 text-muted font-bold uppercase tracking-wider">
            <th className="py-2.5 px-3 w-12 text-center">
              {PACKING_LIST_TEXT.COL_INDEX}
            </th>
            <th className="py-2.5 px-3">{PACKING_LIST_TEXT.COL_CODE}</th>
            <th className="py-2.5 px-3">{PACKING_LIST_TEXT.COL_COLOR}</th>
            <th className="py-2.5 px-3">{PACKING_LIST_TEXT.COL_LOT}</th>
            <th className="py-2.5 px-3 text-right">
              {PACKING_LIST_TEXT.COL_WIDTH}
            </th>
            <th className="py-2.5 px-3 text-right">
              {PACKING_LIST_TEXT.COL_WEIGHT}
            </th>
            <th className="py-2.5 px-3 text-center">
              {PACKING_LIST_TEXT.COL_GRADE}
            </th>
            <th className="py-2.5 px-3 text-center w-28">
              {PACKING_LIST_TEXT.COL_STATUS}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rolls.map((roll, index) => {
            const gradeNorm = normalizeGrade(roll.grade);
            const isChecked = Boolean(roll.checked);
            const sequence = roll.roll_sequence || index + 1;

            return (
              <tr
                key={roll.id || roll.roll_code}
                onClick={() => onRollClick?.(roll)}
                className={cn(
                  'transition-colors',
                  isChecked
                    ? 'bg-success-soft/10 dark:bg-success-soft/5'
                    : 'hover:bg-surface-secondary/40',
                  interactive && 'cursor-pointer',
                )}
              >
                <td className="py-2.5 px-3 text-center text-muted font-semibold">
                  #{sequence}
                </td>
                <td className="py-2.5 px-3 font-bold text-foreground">
                  {roll.roll_code}
                </td>
                <td className="py-2.5 px-3 text-foreground">
                  {roll.color_name || 'N/A'}
                </td>
                <td className="py-2.5 px-3 text-muted">
                  {roll.lot_number || '—'}
                </td>
                <td className="py-2.5 px-3 text-right text-muted">
                  {roll.width_inch ? `${roll.width_inch}"` : '—'}
                </td>
                <td className="py-2.5 px-3 text-right font-extrabold text-foreground">
                  {roundWeight(roll.weight_kg).toFixed(1)} kg
                </td>
                <td className="py-2.5 px-3 text-center">
                  <span
                    className={cn(
                      'inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-tight',
                      gradeNorm === 'A'
                        ? 'bg-success-soft text-success'
                        : gradeNorm === 'B'
                          ? 'bg-warning-soft text-warning'
                          : 'bg-surface-secondary text-muted',
                    )}
                  >
                    Loại {gradeNorm}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center">
                  {interactive && onToggleCheck ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCheck(roll);
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors',
                        isChecked
                          ? 'bg-success text-inverse-foreground'
                          : 'border border-border text-muted hover:border-primary hover:text-primary',
                      )}
                    >
                      <Icon name="Check" size={12} />
                      <span>{isChecked ? 'Đã kiểm' : 'Chưa'}</span>
                    </button>
                  ) : (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-[11px] font-semibold',
                        isChecked ? 'text-success' : 'text-muted',
                      )}
                    >
                      <Icon name={isChecked ? 'Check' : 'Clock'} size={12} />
                      <span>{isChecked ? 'Đã kiểm' : 'Chưa kiểm'}</span>
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
