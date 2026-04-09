import { useRef, useCallback, useMemo, useState, useEffect } from 'react';

export type RollMatrixItem = {
  id: string;
  roll_number: string;
  weight_kg?: number;
  status?: string;
  raw_roll_number?: string;
};

type UseRollMatrixLogicProps = {
  rolls: RollMatrixItem[];
  standardWeightKg?: number;
  anomalyThresholdPercent?: number;
  onAddRoll?: () => void;
};

export type AnomalyStatus = 'normal' | 'light' | 'heavy' | 'empty';

export function useRollMatrixLogic({
  rolls,
  standardWeightKg,
  anomalyThresholdPercent = 10,
  onAddRoll,
}: UseRollMatrixLogicProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(
    null,
  );

  const focusNextCell = useCallback(
    (currentIndex: number) => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < rolls.length) {
        inputRefs.current[nextIndex]?.focus();
        inputRefs.current[nextIndex]?.select();
      } else {
        onAddRoll?.();
        setPendingFocusIndex(nextIndex);
      }
    },
    [rolls.length, onAddRoll],
  );

  useEffect(() => {
    if (pendingFocusIndex !== null && inputRefs.current[pendingFocusIndex]) {
      inputRefs.current[pendingFocusIndex]?.focus();
      inputRefs.current[pendingFocusIndex]?.select();
      setPendingFocusIndex(null);
    }
  }, [rolls.length, pendingFocusIndex]);

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
