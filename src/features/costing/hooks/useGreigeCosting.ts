import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { fetchCostEstimationHistory } from '@/api/cost-estimations.api';
import { GreigeCostingService } from '@/features/costing/services/greige-costing.service';
import type {
  CostingSimulationState,
  CostingResult,
  CostingYarnItem,
} from '@/features/costing/types/greige-costing.type';

export function useGreigeCosting() {
  const [selectedBomId, setSelectedBomId] = useState<string | null>(null);
  const [state, setState] = useState<CostingSimulationState | null>(null);

  // Load initial state when BOM changes
  const { isLoading: isLoadingBom, isError: isBomError } = useQuery({
    queryKey: ['costing_simulation_bom', selectedBomId],
    queryFn: async () => {
      if (!selectedBomId) return null;
      const loadedState =
        await GreigeCostingService.loadSimulationStateFromBom(selectedBomId);
      setState(loadedState);
      return loadedState;
    },
    enabled: !!selectedBomId,
  });

  // Calculate realtime result
  const result = useMemo<CostingResult | null>(() => {
    if (!state) return null;
    return GreigeCostingService.calculate(state);
  }, [state]);

  const updateState = (updates: Partial<CostingSimulationState>) => {
    setState((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const updateYarnItem = (id: string, updates: Partial<CostingYarnItem>) => {
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        yarnItems: prev.yarnItems.map((y) =>
          y.id === id ? { ...y, ...updates } : y,
        ),
      };
    });
  };

  const reset = () => {
    setSelectedBomId(null);
    setState(null);
  };

  return {
    selectedBomId,
    setSelectedBomId,
    state,
    updateState,
    updateYarnItem,
    result,
    isLoadingBom,
    isBomError,
    reset,
  };
}

export function useCostEstimationHistory(
  referenceType: string,
  referenceId: string | null,
) {
  return useQuery({
    queryKey: ['cost_estimation_history', referenceType, referenceId],
    queryFn: () => {
      if (!referenceId) return [];
      return fetchCostEstimationHistory(referenceType, referenceId);
    },
    enabled: !!referenceId,
  });
}
