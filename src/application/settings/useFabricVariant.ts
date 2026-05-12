import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchFabricVariants,
  createFabricVariant,
  updateFabricVariant,
  deleteFabricVariant,
} from '@/api/fabric-variant.api';
import type { FabricVariantFormValues } from '@/schema/fabric-variant.schema';
import type { FabricVariantFilter } from '@/domain/settings/fabric-catalog.types';

const QUERY_KEY = ['fabric-variants'] as const;

function variantQueryKey(
  fabricCatalogId: string,
  filters?: FabricVariantFilter,
) {
  return [...QUERY_KEY, fabricCatalogId, filters] as const;
}

export function useFabricVariants(
  fabricCatalogId: string | undefined,
  filters: FabricVariantFilter = {},
) {
  return useQuery({
    queryKey: variantQueryKey(fabricCatalogId ?? '', filters),
    queryFn: () => fetchFabricVariants(fabricCatalogId!, filters),
    enabled: !!fabricCatalogId,
  });
}

export function useCreateFabricVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      fabricCatalogId,
      parentCode,
      values,
    }: {
      fabricCatalogId: string;
      parentCode: string;
      values: FabricVariantFormValues;
    }) => createFabricVariant(fabricCatalogId, parentCode, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateFabricVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      parentCode,
      values,
    }: {
      id: string;
      parentCode: string;
      values: FabricVariantFormValues;
    }) => updateFabricVariant(id, parentCode, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteFabricVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFabricVariant,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
