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
    // Determine color codes based on Anomaly - Premium Professional Palette
    const anomalyStyles = {
      normal: {
        bg: 'var(--surface-strong)',
        text: 'var(--text)',
        border: 'var(--border)',
        shadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
      light: {
        bg: 'rgba(225, 29, 72, 0.08)',
        text: '#be123c',
        border: 'rgba(225, 29, 72, 0.4)',
        shadow: '0 4px 12px rgba(225, 29, 72, 0.12)',
      },
      heavy: {
        bg: 'rgba(217, 119, 6, 0.08)',
        text: '#b45309',
        border: 'rgba(217, 119, 6, 0.4)',
        shadow: '0 4px 12px rgba(217, 119, 6, 0.12)',
      },
      empty: {
        bg: 'rgba(16, 35, 61, 0.02)',
        text: 'var(--muted)',
        border: 'var(--border)',
        shadow: 'none',
      },
    };

    const currentStyle = isGhost
      ? anomalyStyles.empty
      : anomalyStyles[anomalyStatus];

    const baseClass = cn(
      'relative flex flex-col justify-center items-center p-2 transition-all duration-200',
      'min-h-[72px] min-w-[64px]',
      mode === 'select' && isSelected ? 'scale-[1.02] z-10' : '',
      mode !== 'input'
        ? 'cursor-pointer hover:border-primary active:scale-95 select-none'
        : 'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10',
      className,
    );

    const renderIcon = () => {
      if (mode === 'select' && isSelected) {
        return (
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-in zoom-in-50 duration-200">
            <Icon name="Check" size={14} className="text-white" />
          </span>
        );
      }

      if (statusIcon === 'locked')
        return (
          <div
            className="absolute top-1 right-1 p-0.5 rounded-[var(--radius-sm)] text-[var(--text-muted)]"
            style={{
              background: 'var(--surface-subtle)',
              opacity: 0.8,
            }}
          >
            <Icon name="Lock" size={10} />
          </div>
        );
      if (statusIcon === 'cut')
        return (
          <div
            className="absolute top-1 right-1 p-0.5 rounded-[var(--radius-sm)] text-[var(--text-muted)]"
            style={{
              background: 'var(--surface-subtle)',
              opacity: 0.8,
            }}
          >
            <Icon name="Scissors" size={10} />
          </div>
        );
      return null;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChangeWeight) return;
      const num = parseFloat(e.target.value);
      onChangeWeight(isNaN(num) ? undefined : num);
    };

    const displayValue = () => {
      if (isGhost) return '';
      if (!value) return <span style={{ opacity: 0.3 }}>-</span>;
      return (
        <span className="flex items-baseline gap-0.5">
          <span className="text-base font-black tracking-tight">{value}</span>
          <span className="text-[10px] font-bold opacity-60 uppercase">
            {valueUnit}
          </span>
        </span>
      );
    };

    return (
      <div
        className={baseClass}
        onClick={mode !== 'input' ? onPress : undefined}
        style={{
          borderRadius: 'var(--radius-md)',
          border: isSelected
            ? '2px solid #10b981'
            : isGhost
              ? '1px dashed var(--border)'
              : `1.5px solid ${currentStyle.border}`,
          background: isSelected ? 'rgba(16, 185, 129, 0.08)' : currentStyle.bg,
          boxShadow: isSelected
            ? '0 8px 20px rgba(16, 185, 129, 0.15)'
            : currentStyle.shadow,
          color: isSelected ? '#064e3b' : currentStyle.text,
          opacity: isGhost ? 0.4 : 1,
        }}
      >
        {label && (
          <span
            className={cn(
              'text-[10px] uppercase font-extrabold letter-spacing-widest opacity-70 truncate max-w-full leading-none mb-1',
              anomalyStatus === 'empty' ? 'opacity-30' : '',
            )}
          >
            {label}
          </span>
        )}

        {subLabel && (
          <span className="text-[9px] font-bold opacity-50 truncate max-w-full leading-none mb-1">
            {subLabel}
          </span>
        )}

        <div className="flex-1 flex items-center justify-center w-full">
          {mode === 'input' ? (
            <input
              {...props}
              ref={ref}
              type="number"
              step="0.1"
              className="w-full text-center bg-transparent border-none outline-none font-black text-base focus:ring-0 p-0 m-0"
              style={{ color: 'inherit' }}
              value={value ?? ''}
              onChange={handleInputChange}
              placeholder="..."
            />
          ) : (
            <div className="text-center">{displayValue()}</div>
          )}
        </div>

        {renderIcon()}
      </div>
    );
  },
);

RollGridItem.displayName = 'RollGridItem';
