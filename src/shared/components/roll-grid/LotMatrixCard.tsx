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
  widthInfo?: string;

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
  lotNumber,
  colorName,
  widthInfo,
  expectedRollsCount,
  expectedTotalWeightKg,
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
  const progressColor = isCountMatch ? 'bg-emerald-500' : 'bg-amber-500';

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
        'rounded-xl shadow-sm border border-slate-200 overflow-hidden',
        'bg-white',
        className,
      )}
    >
      {/* Header Section: Metadata & Checksum */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50 gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Icon name="Layers" size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-sm leading-tight uppercase truncate">
              {title}
            </h4>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {lotNumber && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                  Mẻ: {lotNumber}
                </span>
              )}
              {colorName && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700">
                  {colorName}
                </span>
              )}
              {widthInfo && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                  {widthInfo}
                </span>
              )}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                {rolls.length} cuộn
              </span>
            </div>
          </div>
        </div>

        {/* Right side: counters / selection summary */}
        <div className="flex flex-col items-end shrink-0">
          {mode === 'select' ? (
            // Select mode: show selected count
            selectedCount > 0 ? (
              <>
                <span className="text-xs font-bold text-emerald-700">
                  {selectedCount} đã chọn
                </span>
                <span className="text-[11px] text-slate-500">
                  {selectedWeight.toFixed(1)} kg
                </span>
              </>
            ) : (
              <span className="text-[11px] text-slate-400">
                Nhấn để chọn cuộn
              </span>
            )
          ) : (
            // Input/View mode: show progress checksum
            <>
              <div className="text-sm font-medium flex items-center gap-2">
                <span className="text-slate-500">Tiến độ:</span>
                <div className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', progressColor)} />
                  <span
                    className={
                      isCountMatch
                        ? 'text-emerald-700 font-bold'
                        : 'text-slate-800'
                    }
                  >
                    {totals.rollCount} / {expectedRollsCount} cuộn
                  </span>
                </div>
              </div>
              <div className="text-sm text-slate-500 mt-1">
                Tổng:{' '}
                <span className="font-bold text-slate-800">
                  {totals.totalWeight.toFixed(1)}
                </span>
                {expectedTotalWeightKg
                  ? ` / ${expectedTotalWeightKg.toFixed(1)} kg`
                  : ' kg'}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Grid Presentation Section */}
      <div className="p-3">
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
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
                subLabel={roll.raw_roll_number}
                value={roll.weight_kg}
                valueUnit="kg"
                anomalyStatus={anomalyStatus}
                isGhost={isGhost}
                isSelected={rollIsSelected}
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
