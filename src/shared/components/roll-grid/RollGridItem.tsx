import React, { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';

import { Icon } from '@/shared/components/Icon';

import { AnomalyStatus } from './useRollMatrixLogic';

/** Utility for class merging */
function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export type RollGridItemMode = 'input' | 'view' | 'select';

interface RollGridItemProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange'
> {
  mode?: RollGridItemMode;
  label?: string; // e.g., "R01" or the roll number
  /** Secondary label shown below main label (e.g., raw roll number for pairing) */
  subLabel?: string;
  value?: number;
  /** Unit label shown after value (default: "kg") */
  valueUnit?: string;
  anomalyStatus?: AnomalyStatus;
  isGhost?: boolean;
  /** Whether this cell is currently selected (mode=select) */
  isSelected?: boolean;
  statusIcon?: 'locked' | 'cut' | 'none'; // Further visual signals
  onChangeWeight?: (weight: number | undefined) => void;
  onPress?: () => void; // Mobile friendly tap handler
}

export const RollGridItem = forwardRef<HTMLInputElement, RollGridItemProps>(
  (
    {
      mode = 'view',
      label,
      subLabel,
      value,
      valueUnit = 'kg',
      anomalyStatus = 'normal',
      isGhost = false,
      isSelected = false,
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
        'border-red-400 bg-red-50 text-red-700 shadow-[0_0_0_1px_rgba(248,113,113,1)]',
      heavy: 'border-amber-400 bg-amber-50 text-amber-700',
      empty: 'border-slate-200 bg-slate-50 text-slate-400',
    };

    if (anomalyStatus === 'light') {
      anomalyStyle.heavy =
        'border-red-400 bg-red-50 text-red-700 shadow-[0_0_0_1px_rgba(248,113,113,1)]';
    }

    // Selected style overrides anomaly when in select mode
    const selectedStyle =
      'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]';

    const baseClass = cn(
      'relative flex flex-col justify-center items-center rounded-lg border-2 p-2 transition-all',
      'min-h-[64px] min-w-[64px]', // Touch friendly min-size
      isGhost
        ? 'border-dashed border-slate-300 bg-transparent opacity-60'
        : mode === 'select' && isSelected
          ? selectedStyle
          : anomalyStyle[anomalyStatus],
      mode !== 'input' ? 'cursor-pointer active:scale-95 select-none' : '',
      className,
    );

    const renderIcon = () => {
      // Selection checkmark badge (mode=select)
      if (mode === 'select' && isSelected) {
        return (
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
            <Icon name="Check" size={12} className="text-white" />
          </span>
        );
      }

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

    const displayValue = () => {
      if (isGhost) return 'Đã Xuất';
      if (!value) return '-';
      return `${value}${valueUnit}`;
    };

    return (
      <div
        className={baseClass}
        onClick={mode !== 'input' ? onPress : undefined}
      >
        {label && (
          <span className="text-[10px] uppercase font-semibold opacity-70 mb-0.5 truncate max-w-full">
            {label}
          </span>
        )}
        {subLabel && (
          <span className="text-[9px] opacity-50 truncate max-w-full leading-none mb-0.5">
            {subLabel}
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
          <span className="font-bold text-xs leading-tight">
            {displayValue()}
          </span>
        )}

        {renderIcon()}
      </div>
    );
  },
);

RollGridItem.displayName = 'RollGridItem';
