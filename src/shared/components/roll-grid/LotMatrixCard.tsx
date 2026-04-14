import { clsx, type ClassValue } from 'clsx';

import { Icon } from '@/shared/components/Icon';

import { RollGridItem, type RollGridItemMode } from './RollGridItem';
import { useRollMatrixLogic, type RollMatrixItem } from './useRollMatrixLogic';

/** Utility for class merging */
function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface LotMatrixCardProps {
  // Metadata
  title: string;
  lotNumber?: string;
  colorName?: string;
  lotIndex?: number;
  totalLots?: number;
  // widthInfo removed due to unsued

  // Data
  expectedRollsCount: number;
  expectedTotalWeightKg?: number;
  rolls: RollMatrixItem[];
  standardWeightKg?: number; // Needed for Anomaly Detection (Phương án B)

  // Config
  mode?: RollGridItemMode;
  className?: string;

  // Selection (mode=select)
  /** Set of selected roll IDs (mode=select) */
  selectedRollIds?: Set<string>;

  // Actions
  onRollChange?: (index: number, weight: number | undefined) => void;
  onRollPress?: (roll: RollMatrixItem, index: number) => void;
  /** Called when Enter pressed on last cell — triggers new roll insertion */
  onAddRoll?: () => void;
}

export function LotMatrixCard({
  title,
  lotNumber: _lotNumber,
  colorName,
  lotIndex,
  totalLots,
  expectedRollsCount,
  expectedTotalWeightKg: _expectedTotalWeightKg,
  rolls,
  standardWeightKg,
  mode = 'input',
  className,
  selectedRollIds,
  onRollChange,
  onRollPress,
  onAddRoll,
}: LotMatrixCardProps) {
  const { inputRefs, focusNextCell, totals, getAnomalyStatus } =
    useRollMatrixLogic({
      rolls,
      standardWeightKg,
      onAddRoll,
    });

  // For select mode: count/weight of selected rolls in this group
  const selectedInGroup =
    mode === 'select' && selectedRollIds
      ? rolls.filter((r) => selectedRollIds.has(r.id))
      : [];
  const selectedCount = selectedInGroup.length;
  const selectedWeight = selectedInGroup.reduce(
    (sum, r) => sum + (r.weight_kg ?? 0),
    0,
  );

  // Check progress matching
  const isCountMatch = totals.rollCount === expectedRollsCount;
  // progressColor removed due to unused

  // Render ghost slots if we have fewer rolls than expected
  const displayRolls = [...rolls];
  if (displayRolls.length < expectedRollsCount) {
    const shorts = expectedRollsCount - displayRolls.length;
    for (let i = 0; i < shorts; i++) {
      displayRolls.push({
        id: `ghost-${i}`,
        roll_number: 'Ghost',
        weight_kg: undefined,
        status: 'ghost',
      });
    }
  }

  return (
    <div
      className={cn(
        'transition-all rounded-xl border border-border bg-surface-strong overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 gap-3 border-b border-border bg-[var(--surface-subtle)]">
        {/* Left: title + index badge — flex-1 min-w-0 để title co giãn tự nhiên */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon
            name="Layers"
            size={13}
            className="text-primary flex-shrink-0"
          />
          <span className="font-extrabold text-[12px] text-[var(--text)] uppercase tracking-widest truncate">
            {title}
          </span>
          {lotIndex !== undefined && totalLots !== undefined && (
            <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-[1px] rounded whitespace-nowrap flex-shrink-0">
              {lotIndex}/{totalLots}
            </span>
          )}
          {colorName && (
            <span className="text-[10px] text-muted whitespace-nowrap flex-shrink-0">
              · {colorName}
            </span>
          )}
          {standardWeightKg && (
            <div className="flex items-center gap-1 ml-2 bg-[var(--surface-subtle)] px-2 py-0.5 rounded text-[10px] border border-border flex-shrink-0">
              <Icon name="Target" size={10} className="text-muted" />
              <span className="text-muted font-medium">Chuẩn:</span>
              <span className="font-extrabold text-amber-600">
                {standardWeightKg}kg
              </span>
            </div>
          )}
        </div>

        {/* Right: progress only — clean, no clutter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {mode === 'select' ? (
            selectedCount > 0 ? (
              <span className="text-[11px] font-bold text-success">
                {selectedCount} đã chọn · {selectedWeight.toFixed(1)} kg
              </span>
            ) : (
              <span className="text-[10px] text-muted">Nhấn để chọn</span>
            )
          ) : (
            <div className="flex flex-col items-end gap-1.5">
              <span
                className={cn(
                  'text-[11px] font-bold flex items-center gap-1.5',
                  isCountMatch ? 'text-success' : 'text-[var(--text)]',
                )}
              >
                {isCountMatch && <Icon name="CheckCircle2" size={12} />}
                <span>
                  {totals.rollCount} / {expectedRollsCount} cuộn
                </span>
                <span className="font-medium text-muted">
                  · {totals.totalWeight.toFixed(1)} kg
                </span>
              </span>

              {/* Warehouse Progress Bar */}
              <div className="h-1.5 w-24 bg-[var(--surface-subtle)] rounded-full overflow-hidden flex border border-border/50">
                <div
                  className={cn(
                    'h-full transition-all duration-500',
                    isCountMatch ? 'bg-success' : 'bg-primary',
                  )}
                  style={{
                    width: `${Math.min(100, (totals.rollCount / Math.max(1, expectedRollsCount)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid — không có AnomalyLegend ở đây nữa, đã chuyển lên RawFabricList */}
      <div className="p-2 bg-surface-strong overflow-x-auto">
        <div
          className="grid gap-1 min-w-[480px] md:min-w-0"
          style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}
        >
          {displayRolls.map((roll, index) => {
            const isGhost = roll.status === 'ghost';
            const anomalyStatus = isGhost
              ? 'empty'
              : getAnomalyStatus(roll.weight_kg);
            const rollIsSelected =
              mode === 'select' && selectedRollIds
                ? selectedRollIds.has(roll.id)
                : false;

            return (
              <RollGridItem
                key={roll.id}
                ref={(el: HTMLInputElement | null) =>
                  (inputRefs.current[index] = el)
                }
                mode={mode}
                label={
                  isGhost
                    ? ''
                    : roll.roll_number.replace(/^R-?/i, '') ||
                      (index + 1).toString().padStart(2, '0')
                }
                subLabel={mode !== 'view' ? roll.raw_roll_number : undefined}
                value={roll.weight_kg}
                valueUnit="kg"
                anomalyStatus={anomalyStatus}
                isGhost={isGhost}
                isSelected={rollIsSelected}
                standardWeightKg={standardWeightKg}
                statusIcon={
                  roll.status === 'reserved' && !rollIsSelected
                    ? 'locked'
                    : 'none'
                }
                onChangeWeight={(val: number | undefined) => {
                  if (onRollChange && !isGhost) onRollChange(index, val);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    focusNextCell(index);
                  }
                }}
                onPress={() => {
                  if (onRollPress && !isGhost) onRollPress(roll, index);
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
