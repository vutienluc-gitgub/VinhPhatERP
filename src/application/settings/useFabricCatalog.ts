import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  fetchFabricCatalogPaginated,
  fetchFabricCatalogOptions,
  fetchNextFabricCatalogCode,
  createFabricCatalog,
  updateFabricCatalog,
  deleteFabricCatalog,
  fetchFabricCategories,
  fetchFabricCatalogByIdOrCode,
  fetchPublicFabricBasic,
  fetchPublicFabricVariants,
  fetchPublicFabricImages,
  fetchRelatedPublicFabrics,
  fetchAlsoViewedPublicFabrics,
  createPublicSampleRequest,
  fetchPublicPricingTiers,
  createPublicRFQRequest,
  fetchGarmentConversionRules,
  updateFabricCommercial,
  updateFabricPricingTiers,
  syncFabricImages,
} from '@/api/fabric-catalog.api';
import type { FabricCatalogFormValues } from '@/features/fabric-catalog/fabric-catalog.module';
import type {
  FabricCatalog,
  FabricCatalogFilter,
} from '@/domain/settings/fabric-catalog.types';

const QUERY_KEY = ['fabric-catalog'] as const;

function toDbRow(
  values: FabricCatalogFormValues,
): Omit<FabricCatalog, 'id' | 'created_at' | 'updated_at'> {
  const base = {
    category_id: values.category_id || null,
    code: values.code.trim(),
    name: values.name.trim(),
    composition: values.composition?.trim() || null,
    composition_parts: values.composition_parts ?? [],
    target_width_cm: values.target_width_cm ?? null,
    target_gsm: values.target_gsm ?? null,
    unit: values.unit.trim(),
    notes: values.notes?.trim() || null,
    status: values.status,
    image_url: values.image_url ?? null,
    specifications: values.specifications ?? null,
    is_public: values.is_public,
    slug:
      values.slug || values.code.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase(),
    color: values.color ?? null,
    color_tags: values.color_tags ?? [],
    technique: values.technique ?? null,
    stretch_type: values.stretch_type ?? null,
    thickness: values.thickness ?? null,
    faq_data: (values.faq_data ?? [])
      .filter((item) => item.question.trim() && item.answer.trim())
      .map((item) => ({
        question: item.question.trim(),
        answer: item.answer.trim(),
      })),
  };

  if (values.fabric_type === 'woven') {
    return {
      ...base,
      fabric_type: 'woven',
      warp_count: values.warp_count?.trim() || null,
      weft_count: values.weft_count?.trim() || null,
      epi: values.epi ?? null,
      ppi: values.ppi ?? null,
      weave_pattern: values.weave_pattern?.trim() || null,
      gauge: null,
      diameter: null,
      machine_type: null,
      needle_count: null,
    };
  }

  return {
    ...base,
    fabric_type: 'knitted',
    gauge: values.gauge ?? null,
    diameter: values.diameter ?? null,
    machine_type: values.machine_type?.trim() || null,
    needle_count: values.needle_count ?? null,
    warp_count: null,
    weft_count: null,
    epi: null,
    ppi: null,
    weave_pattern: null,
  };
}

export function useFabricCatalogList(
  filters: FabricCatalogFilter = {},
  page = 1,
) {
  return useQuery({
    queryKey: [...QUERY_KEY, filters, page],
    queryFn: () => fetchFabricCatalogPaginated(filters, page),
  });
}

export function useFabricCatalogOptions() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'options'],
    queryFn: fetchFabricCatalogOptions,
  });
}

export function useNextFabricCatalogCode() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'next-code'],
    queryFn: fetchNextFabricCatalogCode,
  });
}

export function useCreateFabricCatalog() {
  const [clientId, setClientId] = useState(() => crypto.randomUUID());
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: FabricCatalogFormValues) => {
      const reqPayload = { id: clientId, ...toDbRow(values) };
      const created = await createFabricCatalog(reqPayload);
      if (values.b2b_planner) {
        await updateFabricCommercial(created.id, values.b2b_planner);
      }
      if (values.pricing_tiers) {
        await updateFabricPricingTiers(created.id, values.pricing_tiers);
      }
      if (values.images) {
        await syncFabricImages(created.id, values.images);
      }
      return created;
    },
    onSuccess: () => {
      setClientId(crypto.randomUUID());
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUpdateFabricCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: FabricCatalogFormValues;
    }) => {
      const updated = await updateFabricCatalog(id, toDbRow(values));
      if (values.b2b_planner) {
        await updateFabricCommercial(id, values.b2b_planner);
      }
      if (values.pricing_tiers) {
        await updateFabricPricingTiers(id, values.pricing_tiers);
      }
      if (values.images) {
        await syncFabricImages(id, values.images);
      }
      return updated;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteFabricCatalog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFabricCatalog,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useFabricCategories() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'categories'],
    queryFn: fetchFabricCategories,
  });
}

export function useFabricCatalogDetail(identifier: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'detail', identifier],
    queryFn: () => {
      if (!identifier) return Promise.reject(new Error('Missing identifier'));
      return fetchFabricCatalogByIdOrCode(identifier);
    },
    enabled: !!identifier,
  });
}

export function useGarmentConversionRules() {
  return useQuery({
    queryKey: [...QUERY_KEY, 'garment-conversion-rules'],
    queryFn: fetchGarmentConversionRules,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

export function usePublicFabricBasic(
  slug: string | undefined,
  sessionId?: string,
) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'public-basic', slug, sessionId],
    queryFn: () => {
      if (!slug) return Promise.reject(new Error('Missing slug'));
      return fetchPublicFabricBasic(slug, sessionId);
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicFabricVariants(fabricId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'public-variants', fabricId],
    queryFn: () => {
      if (!fabricId) return Promise.reject(new Error('Missing fabricId'));
      return fetchPublicFabricVariants(fabricId);
    },
    enabled: !!fabricId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicFabricImages(fabricId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'public-images', fabricId],
    queryFn: () => {
      if (!fabricId) return Promise.reject(new Error('Missing fabricId'));
      return fetchPublicFabricImages(fabricId);
    },
    enabled: !!fabricId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useRelatedPublicFabrics(
  fabricId: string | undefined,
  limit = 3,
) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'related-public', fabricId, limit],
    queryFn: () => {
      if (!fabricId) return Promise.reject(new Error('Missing fabricId'));
      return fetchRelatedPublicFabrics(fabricId, limit);
    },
    enabled: !!fabricId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAlsoViewedPublicFabrics(
  fabricId: string | undefined,
  limit = 4,
) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'also-viewed', fabricId, limit],
    queryFn: () => {
      if (!fabricId) return Promise.reject(new Error('Missing fabricId'));
      return fetchAlsoViewedPublicFabrics(fabricId, limit);
    },
    enabled: !!fabricId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSyncFabricImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (args: {
      fabricId: string;
      images: import('@/domain/settings/fabric-catalog.types').FabricImage[];
    }) => syncFabricImages(args.fabricId, args.images),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'public-images', variables.fabricId],
      });
    },
  });
}

export function useCreatePublicSampleRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPublicSampleRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'sample-requests'],
      });
    },
  });
}

export function usePublicPricingTiers(fabricId: string | undefined) {
  return useQuery({
    queryKey: [...QUERY_KEY, 'public-pricing-tiers', fabricId],
    queryFn: () => {
      if (!fabricId) return Promise.reject(new Error('Missing fabricId'));
      return fetchPublicPricingTiers(fabricId);
    },
    enabled: !!fabricId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePublicInquiryRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPublicRFQRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [...QUERY_KEY, 'rfq-requests'],
      });
    },
  });
}
