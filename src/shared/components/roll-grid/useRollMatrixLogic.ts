import { useRef, useCallback, useMemo } from 'react';

export type RollMatrixItem = {
  id: string; // Unique local ID for rendering
  roll_number: string;
  weight_kg?: number;
  status?: string;
  // Other potential fields
};

type UseRollMatrixLogicProps = {
  rolls: RollMatrixItem[];
  standardWeightKg?: number; // From Catalog (Phương án B)
  anomalyThresholdPercent?: number; // Default: 10%
  onUpdateRoll?: (
    index: number,
    field: keyof RollMatrixItem,
    value: RollMatrixItem[keyof RollMatrixItem],
  ) => void;
  onEnterAtEnd?: () => void; // Triggered when Enter is pressed on the last cell
};

export type AnomalyStatus = 'normal' | 'light' | 'heavy' | 'empty';

export function useRollMatrixLogic({
  rolls,
  standardWeightKg,
  anomalyThresholdPercent = 10,
  _onUpdateRoll,
  onEnterAtEnd,
}: UseRollMatrixLogicProps) {
  // Array of refs for each input cell
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the next cell based on current index
  const focusNextCell = useCallback(
    (currentIndex: number) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < rolls.length) {
        inputRefs.current[nextIndex]?.focus();
        inputRefs.current[nextIndex]?.select();
      } else if (onEnterAtEnd) {
        // If at the end, maybe add a new row or trigger save
        onEnterAtEnd();
      }
    },
    [rolls.length, onEnterAtEnd],
  );

  // Checksum: Calculate Totals
  const totals = useMemo(() => {
    let rollCount = 0;
    let totalWeight = 0;
    for (const roll of rolls) {
      if (roll.weight_kg && roll.weight_kg > 0) {
        rollCount++;
        totalWeight += roll.weight_kg;
      }
    }
    return {
      rollCount,
      totalWeight,
    };
  }, [rolls]);

  // Anomaly Detection Logic (Phương án B)
  const getAnomalyStatus = useCallback(
    (weight?: number): AnomalyStatus => {
      if (!weight || weight <= 0) return 'empty';
      if (!standardWeightKg || standardWeightKg <= 0) return 'normal';

      const diff = Math.abs(weight - standardWeightKg);
      const threshold = standardWeightKg * (anomalyThresholdPercent / 100);

      if (diff <= threshold) return 'normal';
      return weight < standardWeightKg ? 'light' : 'heavy';
    },
    [standardWeightKg, anomalyThresholdPercent],
  );

  return {
    inputRefs,
    focusNextCell,
    totals,
    getAnomalyStatus,
  };
}
