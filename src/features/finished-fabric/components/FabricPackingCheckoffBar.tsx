import React from 'react';

import { PACKING_LIST_TEXT } from '@/features/finished-fabric/packing-list.constants';
import { Icon } from '@/shared/components/Icon';
import { cn } from '@/shared/utils/cn';

interface FabricPackingCheckoffBarProps {
  totalRolls: number;
  checkedRolls: number;
  totalWeight: number;
  checkedWeight: number;
  percentage: number;
  scanInput: string;
  onScanInputChange: (val: string) => void;
  onScanSubmit: () => void;
  onReset: () => void;
  notification: {
    text: string;
    type: 'success' | 'warning' | 'error';
  } | null;
}

export const FabricPackingCheckoffBar: React.FC<
  FabricPackingCheckoffBarProps
> = ({
  totalRolls,
  checkedRolls,
  totalWeight,
  checkedWeight,
  percentage,
  scanInput,
  onScanInputChange,
  onScanSubmit,
  onReset,
  notification,
}) => {
  const isFinished = totalRolls > 0 && checkedRolls === totalRolls;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-surface shadow-xs">
      {/* Top summary row: Progress stats & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              isFinished
                ? 'bg-success text-inverse-foreground'
                : 'bg-primary/10 text-primary',
            )}
          >
            <Icon name={isFinished ? 'Check' : 'QrCode'} size={18} />
          </div>

          <div>
            <div className="text-xs font-semibold text-muted uppercase tracking-wider">
              {PACKING_LIST_TEXT.CHECKOFF_PROGRESS}
            </div>
            <div className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>
                {checkedRolls}/{totalRolls} cây ({percentage}%)
              </span>
              <span className="text-xs font-medium text-muted">
                • {checkedWeight.toFixed(1)}/{totalWeight.toFixed(1)} kg
              </span>
            </div>
          </div>
        </div>

        {checkedRolls > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-muted hover:text-danger flex items-center gap-1 transition-colors px-2.5 py-1 rounded-md hover:bg-surface-secondary"
          >
            <Icon name="RotateCcw" size={13} />
            <span>{PACKING_LIST_TEXT.RESET_CHECKOFF}</span>
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 rounded-full',
            isFinished ? 'bg-success' : 'bg-primary',
          )}
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>

      {/* Barcode / QR quick scan input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onScanSubmit();
        }}
        className="flex items-center gap-2 mt-0.5"
      >
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            <Icon name="Search" size={14} />
          </span>
          <input
            type="text"
            value={scanInput}
            onChange={(e) => onScanInputChange(e.target.value)}
            placeholder={PACKING_LIST_TEXT.SCAN_QR_PLACEHOLDER}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-surface text-sm text-foreground placeholder:text-muted focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={!scanInput.trim()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
        >
          <Icon name="Check" size={14} />
          <span>Kiểm</span>
        </button>
      </form>

      {/* Scan result notification banner */}
      {notification && (
        <div
          className={cn(
            'text-xs px-3 py-2 rounded-lg flex items-center gap-2 border transition-all animate-in fade-in-50',
            notification.type === 'success' &&
              'bg-success-soft text-success border-success/30',
            notification.type === 'warning' &&
              'bg-warning-soft text-warning border-warning/30',
            notification.type === 'error' &&
              'bg-danger-soft text-danger border-danger/30',
          )}
        >
          <Icon
            name={
              notification.type === 'success'
                ? 'Check'
                : notification.type === 'warning'
                  ? 'AlertTriangle'
                  : 'AlertCircle'
            }
            size={14}
          />
          <span className="font-medium">{notification.text}</span>
        </div>
      )}
    </div>
  );
};
