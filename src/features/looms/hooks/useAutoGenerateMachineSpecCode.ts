import { useEffect } from 'react';
import type { UseFormSetValue } from 'react-hook-form';

import {
  MACHINE_TYPES,
  type MachineSpecification,
} from '@/schema/yarn-engineering.schema';

/**
 * Custom hook to auto-generate Machine Spec Code from Form values.
 */
export function useAutoGenerateMachineSpecCode({
  editingRecord,
  typeVal,
  diaVal,
  gaugeVal,
  feederVal,
  setValue,
}: {
  editingRecord?: MachineSpecification | null;
  typeVal?: string | null;
  diaVal?: number | null;
  gaugeVal?: number | null;
  feederVal?: number | null;
  setValue: UseFormSetValue<MachineSpecification>;
}) {
  useEffect(() => {
    if (!editingRecord) {
      const typeCode = typeVal
        ? MACHINE_TYPES.find((t) => t.value === typeVal)
            ?.label?.replace(/\s+/g, '')
            .toUpperCase()
        : '';
      if (typeCode && diaVal && feederVal) {
        const gaugeStr = gaugeVal ? `-${gaugeVal}` : '';
        const generatedCode = `${typeCode}-${diaVal}${gaugeStr}-${feederVal}`;
        setValue('code', generatedCode);
      }
    }
  }, [typeVal, diaVal, gaugeVal, feederVal, editingRecord, setValue]);
}
