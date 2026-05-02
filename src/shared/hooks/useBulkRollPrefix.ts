import { useEffect } from 'react';
import { useWatch } from 'react-hook-form';
import type {
  Control,
  UseFormSetValue,
  FieldValues,
  Path,
  PathValue,
} from 'react-hook-form';

import { formatBulkRollNumber } from '@/schema/roll.schema';

interface UseBulkRollPrefixOptions<T extends FieldValues> {
  control: Control<T>;
  fields: { id: string }[];
  setValue: UseFormSetValue<T>;
  defaultPrefix: string;
  defaultStartNumber: number;
}

interface UseBulkRollPrefixResult {
  resolvedPrefix: string;
  resolvedStart: number;
  /** Generate the roll_number for a row at the given 0-based index. */
  getRollNumber: (index: number) => string;
}

/**
 * Watches roll_prefix and start_number fields and auto-renumbers all rolls
 * whenever either value changes. Used by both RawFabricBulkForm and FinishedFabricBulkForm.
 */
export function useBulkRollPrefix<T extends FieldValues>({
  control,
  fields,
  setValue,
  defaultPrefix,
  defaultStartNumber,
}: UseBulkRollPrefixOptions<T>): UseBulkRollPrefixResult {
  const rollPrefix = useWatch({ control, name: 'roll_prefix' as Path<T> }) as
    | string
    | undefined;
  const startNumber = useWatch({ control, name: 'start_number' as Path<T> }) as
    | number
    | undefined;

  const resolvedPrefix = rollPrefix?.trim() || defaultPrefix;
  const resolvedStart =
    typeof startNumber === 'number' ? startNumber : defaultStartNumber;

  useEffect(() => {
    fields.forEach((_, idx) => {
      setValue(
        `rolls.${idx}.roll_number` as Path<T>,
        formatBulkRollNumber(resolvedPrefix, resolvedStart + idx) as PathValue<
          T,
          Path<T>
        >,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedPrefix, resolvedStart, fields.length]);

  return {
    resolvedPrefix,
    resolvedStart,
    getRollNumber: (index: number) =>
      formatBulkRollNumber(resolvedPrefix, resolvedStart + index),
  };
}
