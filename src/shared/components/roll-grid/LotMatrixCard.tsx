import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Icon } from '@/shared/components/Icon';

import { RollGridItem, type RollGridItemMode } from './RollGridItem';
import { useRollMatrixLogic, type RollMatrixItem } from './useRollMatrixLogic';

/** Utility for tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

  // Actions
  onRollChange?: (index: number, weight: number | undefined) => void;
  onRollPress?: (roll: RollMatrixItem, index: number) => void;
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
  onRollChange,
  onRollPress,
}: LotMatrixCardProps) {
  const { inputRefs, focusNextCell, totals, getAnomalyStatus } =
    useRollMatrixLogic({
      rolls,
      standardWeightKg,
      onEnterAtEnd: () => {
        // Optional: Handle finishing input matrix
        console.log('Finished entering lot matrix');
      },
    });

  // Check progress matching
  const isCountMatch = totals.rollCount === expectedRollsCount;
  // If weight is missing, matching is determined by count only
  const progressColor = isCountMatch ? 'bg-emerald-500' : 'bg-amber-500';

  // Render ghost slots if we have fewer rolls than expected
  const displayRolls = [...rolls];
  // Note: if doing "ghost slots" for a pure input array, we map what exists.
  // We can pad with empty entries up to expectedRollsCount
  if (displayRolls.length < expectedRollsCount) {
    const shorts = expectedRollsCount - displayRolls.length;
    for (let i = 0; i < shorts; i++) {
      // Mock items to render ghost slots
      displayRolls.push({
        id: `ghost-${i}`,
        roll_number: `Ghost`,
        weight_kg: undefined,
        status: 'ghost',
      });
    }
  }

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden',
        className,
      )}
    >
      {/* Header Section: Metadata & Checksum */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50 gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 text-brand-600 rounded-lg">
            <Icon name="Box" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm md:text-base leading-tight uppercase">
              {title}
            </h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {lotNumber && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                  Mẻ: {lotNumber}
                </span>
              )}
              {colorName && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
                  {colorName}
                </span>
              )}
              {widthInfo && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                  {widthInfo}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Checksum Counters */}
        <div className="flex flex-col items-end shrink-0">
          <div className="text-sm font-medium flex items-center gap-2">
            <span className="text-slate-500">Tiến độ:</span>
            <div className="flex items-center gap-2">
              <span className={cn('w-2 h-2 rounded-full', progressColor)} />
              <span
                className={
                  isCountMatch ? 'text-emerald-700 font-bold' : 'text-slate-800'
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
        </div>
      </div>

      {/* Grid Presentation Section */}
      <div className="p-4 bg-white overflow-x-hidden">
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 sm:gap-3">
          {displayRolls.map((roll, index) => {
            const isGhost = roll.status === 'ghost';
            const anomalyStatus = isGhost
              ? 'empty'
              : getAnomalyStatus(roll.weight_kg);

            return (
              <RollGridItem
                key={roll.id}
                ref={(el) => (inputRefs.current[index] = el)}
                mode={mode}
                label={isGhost ? '' : (index + 1).toString().padStart(2, '0')} // Simple numbering like 01, 02
                value={roll.weight_kg}
                anomalyStatus={anomalyStatus}
                isGhost={isGhost}
                onChangeWeight={(val) => {
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
