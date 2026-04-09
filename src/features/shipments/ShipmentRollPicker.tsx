import { useCallback, useMemo } from 'react';

import { Icon } from '@/shared/components/Icon';
import { LotMatrixCard } from '@/shared/components/roll-grid';
import type { RollMatrixItem } from '@/shared/components/roll-grid';

/** Shape of a roll from the available rolls API */
type AvailableRoll = {
  id: string;
  roll_number: string;
  fabric_type: string;
  color_name: string | null;
  length_m: number | null;
  weight_kg: number | null;
  status: string;
};

/** A grouped set of rolls by fabric_type + color_name */
type RollGroup = {
  key: string;
  fabricType: string;
  colorName: string | null;
  rolls: AvailableRoll[];
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
    } else {
      map.set(key, {
        key,
        fabricType: roll.fabric_type,
        colorName: roll.color_name,
        rolls: [roll],
      });
    }
  }

  return Array.from(map.values());
}

/** Convert AvailableRoll[] → RollMatrixItem[] for LotMatrixCard */
function toMatrixItems(rolls: AvailableRoll[]): RollMatrixItem[] {
  return rolls.map((r) => ({
    id: r.id,
    roll_number: r.roll_number,
    weight_kg: r.weight_kg ?? undefined,
    status: r.status,
  }));
}

/** Main roll picker for the Shipment Form — uses shared LotMatrixCard */
export function ShipmentRollPicker({
  availableRolls,
  selectedRollIds,
  onToggleRoll,
  className,
}: ShipmentRollPickerProps) {
  const groups = useMemo(() => groupRolls(availableRolls), [availableRolls]);
  const rollById = useMemo(
    () => new Map(availableRolls.map((r) => [r.id, r])),
    [availableRolls],
  );

  const totalSelected = selectedRollIds.size;
  const totalSelectedWeight = availableRolls
    .filter((r) => selectedRollIds.has(r.id))
    .reduce((sum, r) => sum + (r.weight_kg ?? 0), 0);

  /** Handle roll press → toggle selection */
  const handleRollPress = useCallback(
    (roll: RollMatrixItem) => {
      const original = rollById.get(roll.id);
      if (original) onToggleRoll(original);
    },
    [rollById, onToggleRoll],
  );

  if (groups.length === 0) {
    return (
      <div
        className={`rounded-xl border-2 border-dashed border-slate-200 p-8 text-center ${className ?? ''}`}
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
    <div className={`space-y-3 ${className ?? ''}`}>
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

      {/* Grouped LotMatrixCard instances */}
      {groups.map((group) => (
        <LotMatrixCard
          key={group.key}
          title={group.fabricType}
          colorName={group.colorName ?? undefined}
          expectedRollsCount={group.rolls.length}
          rolls={toMatrixItems(group.rolls)}
          mode="select"
          selectedRollIds={selectedRollIds}
          onRollPress={handleRollPress}
        />
      ))}
    </div>
  );
}

export type { AvailableRoll };
