import React, { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Icon } from '@/shared/components/Icon';

import { AnomalyStatus } from './useRollMatrixLogic';

/** Utility for tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type RollGridItemMode = 'input' | 'view';

interface RollGridItemProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  mode?: RollGridItemMode;
  label?: string; // e.g., "R01" or the roll number
  value?: number;
  anomalyStatus?: AnomalyStatus;
  isGhost?: boolean;
  statusIcon?: 'locked' | 'cut' | 'none'; // Further visual signals
  onChangeWeight?: (weight: number | undefined) => void;
  onPress?: () => void; // Mobile friendly tap handler
}

export const RollGridItem = forwardRef<HTMLInputElement, RollGridItemProps>(
  (
    {
      mode = 'view',
      label,
      value,
      anomalyStatus = 'normal',
      isGhost = false,
      statusIcon = 'none',
      onChangeWeight,
      onPress,
      className,
      ...props
    },
    ref,
  ) => {
    // Determine color codes based on Anomaly
    const anomalyStyle = {
      normal: 'border-slate-200 bg-white text-slate-800',
      light:
        'border-red-400 bg-red-50 text-red-700 shadow-[0_0_0_1px_rgba(248,113,113,1)]', // Red glow
      heavy: 'border-amber-400 bg-amber-50 text-amber-700', // Heavy could be warning instead of error
      empty: 'border-slate-200 bg-slate-50 text-slate-400',
    };

    if (anomalyStatus === 'light') {
      // User specifically requested red for anomalous. Let's use red for both diffs for now
      anomalyStyle.heavy =
        'border-red-400 bg-red-50 text-red-700 shadow-[0_0_0_1px_rgba(248,113,113,1)]';
    }

    const baseClass = cn(
      'relative flex flex-col justify-center items-center rounded-md border p-2 transition-all',
      'min-h-[64px] min-w-[64px]', // Touch friendly min-size
      isGhost
        ? 'border-dashed border-slate-300 bg-transparent opacity-60'
        : anomalyStyle[anomalyStatus],
      mode === 'view' ? 'cursor-pointer active:scale-95' : '',
      className,
    );

    const renderIcon = () => {
      if (statusIcon === 'locked')
        return (
          <Icon
            name="Lock"
            size={12}
            className="absolute top-1 right-1 text-slate-400"
          />
        );
      if (statusIcon === 'cut')
        return (
          <Icon
            name="Scissors"
            size={12}
            className="absolute top-1 right-1 text-slate-400"
          />
        );
      return null;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChangeWeight) return;
      const num = parseFloat(e.target.value);
      onChangeWeight(isNaN(num) ? undefined : num);
    };

    return (
      <div
        className={baseClass}
        onClick={mode === 'view' ? onPress : undefined}
      >
        {label && (
          <span className="text-[10px] uppercase font-semibold opacity-70 mb-1">
            {label}
          </span>
        )}

        {mode === 'input' ? (
          <input
            {...props}
            ref={ref}
            type="number"
            step="0.1"
            className="w-full text-center bg-transparent border-none outline-none font-bold text-sm focus:ring-0 p-0 m-0"
            value={value ?? ''}
            onChange={handleInputChange}
            placeholder="..."
          />
        ) : (
          <span className="font-bold text-sm">
            {isGhost ? 'Đã Xuất' : value ? `${value}kg` : '-'}
          </span>
        )}

        {renderIcon()}
      </div>
    );
  },
);

RollGridItem.displayName = 'RollGridItem';
