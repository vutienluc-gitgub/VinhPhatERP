import { useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import type {
  UseFormSetValue,
  FieldValues,
  Path,
  PathValue,
} from 'react-hook-form';

import type { RawFabricRoll } from '@/domain/inventory/raw-fabric.types';
import {
  computeRollSelectionState,
  getRollsForLot,
  validateSelection,
  type RollSelectionState,
} from '@/domain/inventory/roll-selection.engine';

export function useRollSelection<
  TFormValues extends FieldValues,
  TItem extends { raw_fabric_roll_id?: string | null },
>(
  availableRolls: RawFabricRoll[],
  items: TItem[],
  setValue: UseFormSetValue<TFormValues>,
) {
  const selectedRollIds = useMemo(() => {
    return items
      .map((item) => item.raw_fabric_roll_id)
      .filter(Boolean) as string[];
  }, [items]);

  const state: RollSelectionState = useMemo(() => {
    return computeRollSelectionState(availableRolls, selectedRollIds);
  }, [availableRolls, selectedRollIds]);

  const validate = useCallback(() => {
    const result = validateSelection(availableRolls, selectedRollIds);
    if (!result.valid) {
      toast.error(result.errors.join('\n'));
    }
    return result.valid;
  }, [availableRolls, selectedRollIds]);

  const addLot = useCallback(
    (lotNumber: string, createEmptyItem: (roll: RawFabricRoll) => unknown) => {
      const rollsToAdd = getRollsForLot(
        lotNumber,
        availableRolls,
        selectedRollIds,
      );
      if (rollsToAdd.length === 0) {
        toast(`Tất cả cuộn mộc của lô ${lotNumber} đã được thêm.`, {
          // eslint-disable-next-line no-restricted-syntax -- Allowed string emoji
          icon: 'ℹ️',
        });
        return;
      }

      const newItems = rollsToAdd.map((roll) => createEmptyItem(roll));

      setValue(
        'items' as Path<TFormValues>,
        [...items, ...newItems] as unknown as PathValue<
          TFormValues,
          Path<TFormValues>
        >,
        {
          shouldValidate: true,
          shouldDirty: true,
        },
      );

      toast.success(
        `Đã thêm ${rollsToAdd.length} cuộn mộc từ lô ${lotNumber}.`,
      );
    },
    [availableRolls, selectedRollIds, items, setValue],
  );

  return {
    unselectedRolls: state.unselectedRolls,
    lotSummary: state.lotSummary,
    addLot,
    validate,
  };
}
