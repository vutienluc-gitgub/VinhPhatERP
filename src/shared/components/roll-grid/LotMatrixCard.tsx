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
      className={cn('overflow-hidden transition-all', className)}
      style={{
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        background: 'var(--surface-strong)',
      }}
    >
      {/* Compact single-line header */}
      <div
        className="flex items-center justify-between px-3 py-2 gap-3"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-subtle)',
        }}
      >
        {/* Left: title + index badge — flex-1 min-w-0 để title co giãn tự nhiên */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Icon
            name="Layers"
            size={13}
            style={{
              color: 'var(--primary)',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontWeight: 800,
              fontSize: '12px',
              color: 'var(--text)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
          {lotIndex !== undefined && totalLots !== undefined && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                background: 'rgba(11,107,203,0.1)',
                color: 'var(--primary)',
                padding: '1px 6px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {lotIndex}/{totalLots}
            </span>
          )}
          {colorName && (
            <span
              style={{
                fontSize: '10px',
                color: 'var(--muted)',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              · {colorName}
            </span>
          )}
        </div>

        {/* Right: progress only — clean, no clutter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {mode === 'select' ? (
            selectedCount > 0 ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--success)',
                }}
              >
                {selectedCount} đã chọn · {selectedWeight.toFixed(1)} kg
              </span>
            ) : (
              <span
                style={{
                  fontSize: '10px',
                  color: 'var(--muted)',
                }}
              >
                Nhấn để chọn
              </span>
            )
          ) : (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isCountMatch ? 'var(--success)' : 'var(--text)',
              }}
            >
              {totals.rollCount}/{expectedRollsCount}
              <span
                style={{
                  fontWeight: 500,
                  color: 'var(--muted)',
                  marginLeft: 4,
                }}
              >
                · {totals.totalWeight.toFixed(1)} kg
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Grid — không có AnomalyLegend ở đây nữa, đã chuyển lên RawFabricList */}
      <div className="p-2" style={{ background: 'var(--surface-strong)' }}>
        <div
          className="grid gap-1"
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
