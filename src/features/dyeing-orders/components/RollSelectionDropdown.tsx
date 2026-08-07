import { useMemo } from 'react';

import { VPVirtualCombobox } from '@/shared/components';
import type { RawFabricRoll } from '@/domain/inventory/raw-fabric.types';
import { DYEING_ORDER_MESSAGES as MSG } from '@/features/dyeing-orders/dyeing-orders.constants';

interface RollSelectionDropdownProps {
  value: string;
  onChange: (value: string) => void;
  unselectedRolls: RawFabricRoll[];
  availableRolls: RawFabricRoll[];
  error?: string;
}

export function RollSelectionDropdown({
  value,
  onChange,
  unselectedRolls,
  availableRolls,
  error,
}: RollSelectionDropdownProps) {
  const rollsToShow = useMemo(() => {
    const list = [...unselectedRolls];
    if (value) {
      const currentRoll = availableRolls.find((r) => r.id === value);
      if (currentRoll && !list.some((r) => r.id === currentRoll.id)) {
        list.push(currentRoll);
      }
    }
    return list;
  }, [unselectedRolls, availableRolls, value]);

  return (
    <div className="flex flex-col gap-1 w-full">
      <VPVirtualCombobox<RawFabricRoll>
        options={rollsToShow}
        value={value}
        onChange={onChange}
        getOptionValue={(r) => r.id}
        getOptionLabel={(r) =>
          `${r.roll_number} - ${r.fabric_type} (${r.weight_kg}kg)`
        }
        searchFn={(r, keyword) =>
          r.roll_number.toLowerCase().includes(keyword) ||
          r.fabric_type.toLowerCase().includes(keyword) ||
          r.id.toLowerCase().includes(keyword)
        }
        placeholder={MSG.PLACEHOLDER_RAW_ROLL}
        hasError={!!error}
      />
      {error && <span className="text-[10px] text-danger mt-1">{error}</span>}
    </div>
  );
}
