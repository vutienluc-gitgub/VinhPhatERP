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
  lotNumber,
  colorName,
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
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 4px 20px -4px rgba(0,0,0,0.06)',
        border: '1px solid var(--border)',
        background: 'var(--surface-strong)',
      }}
    >
      {/* Header Section: Metadata & Checksum - Premium Look */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4"
        style={{
          background:
            'linear-gradient(to right, rgba(16, 35, 61, 0.01), rgba(16, 35, 61, 0.03))',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div className="flex items-start gap-3">
          <div
            style={{
              padding: '0.6rem',
              background: 'var(--surface-strong)',
              color: 'var(--primary)',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              border: '1px solid var(--border)',
            }}
          >
            <Icon name="Layers" size={20} />
          </div>
          <div className="min-w-0">
            <h4
              style={{
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--text)',
                marginBottom: '0.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {title}
            </h4>
            <div className="flex flex-wrap gap-2">
              {lotNumber && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'var(--surface-subtle)',
                    color: 'var(--muted)',
                    padding: '1px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                  }}
                >
                  LÔ: {lotNumber}
                </span>
              )}
              {colorName && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: 'rgba(11, 107, 203, 0.08)',
                    color: 'var(--primary)',
                    padding: '1px 8px',
                    borderRadius: '6px',
                  }}
                >
                  {colorName}
                </span>
              )}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--muted)',
                  opacity: 0.8,
                }}
              >
                • {rolls.length} cuộn thành phẩm
              </span>
            </div>
          </div>
        </div>

        {/* Right side: counters / progress summary */}
        <div
          style={{
            background: 'var(--surface-strong)',
            padding: '0.5rem 1rem',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
          }}
        >
          {mode === 'select' ? (
            selectedCount > 0 ? (
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: 'var(--success)',
                  }}
                >
                  {selectedCount} cuộn đã chọn
                </span>
                <p
                  style={{
                    fontSize: '11px',
                    color: 'var(--muted)',
                    fontWeight: 600,
                  }}
                >
                  Tổng: {selectedWeight.toFixed(1)} kg
                </p>
              </div>
            ) : (
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--muted)',
                  fontWeight: 500,
                }}
              >
                Nhấn chọn để xuất hàng
              </span>
            )
          ) : (
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--muted)',
                  }}
                >
                  Tiến độ:
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: isCountMatch ? 'var(--success)' : 'var(--text)',
                  }}
                >
                  {totals.rollCount} / {expectedRollsCount}
                </span>
              </div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--muted)',
                }}
              >
                {totals.totalWeight.toFixed(1)} kg{' '}
                {expectedTotalWeightKg
                  ? ` / ${expectedTotalWeightKg.toFixed(1)} kg`
                  : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid Presentation Section */}
      <div className="p-4" style={{ background: 'var(--surface-strong)' }}>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
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
