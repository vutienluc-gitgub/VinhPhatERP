import { useMemo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Icon } from '@/shared/components/Icon';

/** Utility for tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shape of a roll from the available rolls API */
type AvailableRoll = {
  id: string;
  roll_number: string;
  fabric_type: string;
  color_name: string | null;
  length_m: number;
  weight_kg: number | null;
  status: string;
};

/** A grouped set of rolls by fabric_type + color_name */
type RollGroup = {
  key: string;
  fabricType: string;
  colorName: string | null;
  rolls: AvailableRoll[];
  totalWeight: number;
};

type ShipmentRollPickerProps = {
  availableRolls: AvailableRoll[];
  selectedRollIds: Set<string>;
  onToggleRoll: (roll: AvailableRoll) => void;
  className?: string;
};

/** Group rolls by fabricType + colorName */
function groupRolls(rolls: AvailableRoll[]): RollGroup[] {
  const map = new Map<string, RollGroup>();

  for (const roll of rolls) {
    const key = `${roll.fabric_type}__${roll.color_name ?? ''}`;
    const existing = map.get(key);
    if (existing) {
      existing.rolls.push(roll);
      existing.totalWeight += roll.weight_kg ?? 0;
    } else {
      map.set(key, {
        key,
        fabricType: roll.fabric_type,
        colorName: roll.color_name,
        rolls: [roll],
        totalWeight: roll.weight_kg ?? 0,
      });
    }
  }

  return Array.from(map.values());
}

/** Single roll cell in the picker grid - touch-friendly 64px min */
function RollCell({
  roll,
  isSelected,
  onToggle,
}: {
  roll: AvailableRoll;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const isReserved = roll.status === 'reserved';

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative flex flex-col justify-center items-center rounded-lg border-2 p-2 transition-all',
        'min-h-[64px] min-w-[64px]',
        'active:scale-95 select-none',
        isSelected
          ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-[0_0_0_1px_rgba(16,185,129,0.3)]'
          : 'border-slate-200 bg-white text-slate-700',
        isReserved && !isSelected && 'border-amber-300 bg-amber-50',
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
          <Icon name="Check" size={12} className="text-white" />
        </span>
      )}

      {/* Reserved badge */}
      {isReserved && (
        <Icon
          name="Lock"
          size={10}
          className="absolute top-1 left-1 text-amber-500"
        />
      )}

      {/* Roll number label */}
      <span className="text-[10px] uppercase font-semibold opacity-70 mb-0.5 truncate max-w-full">
        {roll.roll_number.replace(/^R-?/i, '')}
      </span>

      {/* Weight display */}
      <span className="font-bold text-xs leading-tight">
        {roll.weight_kg ? `${roll.weight_kg}kg` : `${roll.length_m}m`}
      </span>
    </button>
  );
}

/** A card showing a group of rolls (by fabric type) */
function RollGroupCard({
  group,
  selectedRollIds,
  onToggleRoll,
}: {
  group: RollGroup;
  selectedRollIds: Set<string>;
  onToggleRoll: (roll: AvailableRoll) => void;
}) {
  const selectedCount = group.rolls.filter((r) =>
    selectedRollIds.has(r.id),
  ).length;
  const selectedWeight = group.rolls
    .filter((r) => selectedRollIds.has(r.id))
    .reduce((sum, r) => sum + (r.weight_kg ?? 0), 0);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
            <Icon name="Layers" size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-slate-800 text-sm leading-tight uppercase truncate">
              {group.fabricType}
            </h4>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {group.colorName && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-indigo-50 text-indigo-700">
                  {group.colorName}
                </span>
              )}
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                {group.rolls.length} cuộn
              </span>
            </div>
          </div>
        </div>

        {/* Selection summary */}
        {selectedCount > 0 && (
          <div className="flex flex-col items-end shrink-0">
            <span className="text-xs font-bold text-emerald-700">
              {selectedCount} đã chọn
            </span>
            <span className="text-[11px] text-slate-500">
              {selectedWeight.toFixed(1)} kg
            </span>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="p-3">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 gap-2">
          {group.rolls.map((roll) => (
            <RollCell
              key={roll.id}
              roll={roll}
              isSelected={selectedRollIds.has(roll.id)}
              onToggle={() => onToggleRoll(roll)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Main roll picker for the Shipment Form */
export function ShipmentRollPicker({
  availableRolls,
  selectedRollIds,
  onToggleRoll,
  className,
}: ShipmentRollPickerProps) {
  const groups = useMemo(() => groupRolls(availableRolls), [availableRolls]);

  const totalSelected = selectedRollIds.size;
  const totalSelectedWeight = availableRolls
    .filter((r) => selectedRollIds.has(r.id))
    .reduce((sum, r) => sum + (r.weight_kg ?? 0), 0);

  if (groups.length === 0) {
    return (
      <div
        className={cn(
          'rounded-xl border-2 border-dashed border-slate-200 p-8 text-center',
          className,
        )}
      >
        <Icon
          name="PackageOpen"
          size={32}
          className="mx-auto text-slate-300 mb-2"
        />
        <p className="text-sm text-slate-500">
          Không có cuộn thành phẩm nào sẵn sàng để xuất.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs text-slate-500">
          {availableRolls.length} cuộn có sẵn • Nhấn để chọn/bỏ chọn
        </span>
        {totalSelected > 0 && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {totalSelected} cuộn • {totalSelectedWeight.toFixed(1)} kg
          </span>
        )}
      </div>

      {/* Grouped cards */}
      {groups.map((group) => (
        <RollGroupCard
          key={group.key}
          group={group}
          selectedRollIds={selectedRollIds}
          onToggleRoll={onToggleRoll}
        />
      ))}
    </div>
  );
}

export type { AvailableRoll };
