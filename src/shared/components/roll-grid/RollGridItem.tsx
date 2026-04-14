import React, { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';

import { Icon } from '@/shared/components/Icon';
import { calcDeviationPercent } from '@/features/raw-fabric/helpers';

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
  /** Standard weight in kg — used to compute deviation tooltip for light/heavy anomalies */
  standardWeightKg?: number;
}

/** Simple Tailwind-based tooltip wrapper */
function Tooltip({
  content,
  children,
}: {
  content: string;
  children: React.ReactNode;
}) {
  return (
    <span className="relative group/tip">
      {children}
      <span
        className={cn(
          'pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50',
          'whitespace-nowrap rounded px-2 py-1 text-[10px] font-semibold',
          'bg-gray-900 text-white shadow-lg',
          'opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150',
        )}
      >
        {content}
      </span>
    </span>
  );
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
      standardWeightKg,
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

    const isCompact = mode === 'view';

    const baseClass = cn(
      'relative flex flex-col justify-center items-center transition-all duration-200 rounded-[var(--radius-sm)]',
      isCompact
        ? 'p-1.5 min-h-[44px] min-w-[44px]'
        : 'p-3 min-h-[72px] min-w-[64px]',
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
      const valStr = e.target.value;
      if (!valStr) {
        onChangeWeight(undefined);
        return;
      }
      const num = parseFloat(valStr);
      if (isNaN(num)) {
        onChangeWeight(undefined);
        return;
      }
      onChangeWeight(num);
    };

    const processFastEntry = () => {
      if (value !== undefined && value >= 100) {
        if (!String(value).includes('.')) {
          onChangeWeight?.(value / 100);
        }
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      processFastEntry();
      props.onBlur?.(e);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        processFastEntry();
      }
      props.onKeyDown?.(e);
    };

    const displayValue = () => {
      if (isGhost) return '';
      if (!value)
        return (
          <span
            style={{
              opacity: 0.3,
              fontSize: isCompact ? 10 : 14,
            }}
          >
            -
          </span>
        );
      if (isCompact) {
        // Compact: show value only, no unit suffix to save space
        return (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {value}
          </span>
        );
      }
      return (
        <span className="flex items-baseline gap-0.5">
          <span className="text-base font-black tracking-tight">{value}</span>
          <span className="text-[9px] font-bold opacity-60 uppercase">
            {valueUnit}
          </span>
        </span>
      );
    };

    // Compute anomaly tooltip text when light/heavy and standardWeightKg is provided
    const anomalyTooltip = (() => {
      if (
        !standardWeightKg ||
        (anomalyStatus !== 'light' && anomalyStatus !== 'heavy')
      )
        return null;
      if (value === undefined) return null;
      const pct = calcDeviationPercent(value, standardWeightKg).toFixed(1);
      return anomalyStatus === 'light'
        ? `Nhẹ hơn chuẩn ${pct}%`
        : `Nặng hơn chuẩn ${pct}%`;
    })();

    // Build tooltip content — include subLabel (raw roll number) for traceability
    const labelTooltipContent = subLabel
      ? `${label} | Moc: ${subLabel}`
      : (label ?? '');

    // Render label — truncate + tooltip when > 8 chars or has subLabel
    const renderLabel = () => {
      if (!label) return null;
      // Compact view: show truncated label with tooltip always
      if (isCompact) {
        const shortLabel = label.length > 6 ? label.slice(-5) : label;
        return (
          <Tooltip content={labelTooltipContent}>
            <span
              style={{
                fontSize: 8,
                fontWeight: 700,
                opacity: 0.6,
                lineHeight: 1,
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                display: 'block',
                textAlign: 'center',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {shortLabel}
            </span>
          </Tooltip>
        );
      }
      const labelSpan = (
        <span
          className={cn(
            'uppercase font-extrabold opacity-70 leading-none mb-0.5 truncate max-w-full',
            'text-[10px]',
            label.length > 8 ? 'block' : '',
            anomalyStatus === 'empty' ? 'opacity-30' : '',
          )}
        >
          {label}
        </span>
      );

      if (label.length > 8 || subLabel) {
        return <Tooltip content={labelTooltipContent}>{labelSpan}</Tooltip>;
      }
      return labelSpan;
    };

    const cellContent = (
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
            : isCompact
              ? 'none'
              : currentStyle.shadow,
          color: isSelected ? '#064e3b' : currentStyle.text,
          opacity: isGhost ? 0.4 : 1,
          ...(isCompact
            ? {
                height: 44,
                borderRadius: 6,
              }
            : {}),
        }}
      >
        {renderLabel()}

        {/* subLabel (raw roll number) is merged into label tooltip for space efficiency */}

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
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder="..."
            />
          ) : (
            <div className="text-center">{displayValue()}</div>
          )}
        </div>

        {renderIcon()}
      </div>
    );

    // Wrap entire cell in anomaly tooltip when applicable
    if (anomalyTooltip) {
      return <Tooltip content={anomalyTooltip}>{cellContent}</Tooltip>;
    }

    return cellContent;
  },
);

RollGridItem.displayName = 'RollGridItem';
