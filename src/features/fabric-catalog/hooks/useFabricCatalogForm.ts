import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
  useCreateFabricCatalog,
  useNextFabricCatalogCode,
  useUpdateFabricCatalog,
  usePublicPricingTiers,
  usePublicFabricImages,
} from '@/application/settings';
import {
  fabricCatalogDefaultValues,
  fabricCatalogSchema,
} from '@/schema/fabric-catalog.schema';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import type { FabricCatalog } from '@/features/fabric-catalog/types';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import { FABRIC_SAMPLE_HORIZONTAL_CSS } from '@/shared/lib/print-template.css';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

type FormTab = 'info' | 'public' | 'gallery' | 'admin';

function catalogToFormValues(catalog: FabricCatalog): FabricCatalogFormValues {
  const base = {
    category_id: catalog.category_id ?? null,
    code: catalog.code,
    name: catalog.name,
    composition: catalog.composition ?? '',
    composition_tags: catalog.composition_tags ?? [],
    target_width_cm: catalog.target_width_cm,
    target_gsm: catalog.target_gsm,
    unit: catalog.unit,
    notes: catalog.notes ?? '',
    status: catalog.status,
    image_url: catalog.image_url ?? null,
    is_public: catalog.is_public ?? false,
    slug: catalog.slug ?? '',
    color: catalog.color ?? null,
    color_tags: catalog.color_tags ?? [],
    technique: catalog.technique ?? null,
    b2b_planner: {
      minimum_order_qty_kg: catalog.commercial?.minimum_order_qty_kg ?? 100,
      lead_time_days: catalog.commercial?.lead_time_days ?? 7,
      production_capacity_monthly_tons:
        catalog.commercial?.production_capacity_monthly_tons ?? 20,
      yield_factor: catalog.commercial?.yield_factor ?? 1.0,
      public_stock_display:
        catalog.commercial?.public_stock_display ?? 'status',
      trust_has_sample: catalog.commercial?.trust_has_sample ?? false,
      trust_fast_delivery: catalog.commercial?.trust_fast_delivery ?? false,
      trust_tech_support: catalog.commercial?.trust_tech_support ?? false,
      standard_consumption_kg:
        catalog.commercial?.standard_consumption_kg ?? 0.25,
      origin_country: catalog.commercial?.origin_country ?? null,
    },
    pricing_tiers: [],
    images: [],
  };

  if (catalog.fabric_type === 'woven') {
    return {
      ...base,
      fabric_type: 'woven' as const,
      warp_count: catalog.warp_count ?? null,
      weft_count: catalog.weft_count ?? null,
      epi: catalog.epi ?? null,
      ppi: catalog.ppi ?? null,
      weave_pattern: catalog.weave_pattern ?? null,
    } as FabricCatalogFormValues;
  }

  return {
    ...base,
    fabric_type: 'knitted' as const,
    gauge: catalog.gauge ?? null,
    diameter: catalog.diameter ?? null,
    machine_type: catalog.machine_type ?? null,
    needle_count: catalog.needle_count ?? null,
  } as FabricCatalogFormValues;
}

export function useFabricCatalogForm(
  catalog: FabricCatalog | null,
  onClose: () => void,
) {
  const isEditing = catalog !== null;
  const createMutation = useCreateFabricCatalog();
  const updateMutation = useUpdateFabricCatalog();

  const { data: nextCode } = useNextFabricCatalogCode();
  const { data: existingPricingTiers } = usePublicPricingTiers(catalog?.id);
  const { data: existingImages } = usePublicFabricImages(catalog?.id);

  const [activeTab, setActiveTab] = useState<FormTab>('info');
  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const isCustomSlug = useRef(isEditing && Boolean(catalog?.slug));
  const printAreaRef = useRef<HTMLDivElement>(null);

  const methods = useForm<FabricCatalogFormValues>({
    resolver: zodResolver(fabricCatalogSchema),
    defaultValues: isEditing
      ? catalogToFormValues(catalog)
      : fabricCatalogDefaultValues,
  });

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    reset(
      isEditing ? catalogToFormValues(catalog) : fabricCatalogDefaultValues,
    );
    isCustomSlug.current = isEditing && Boolean(catalog?.slug);
    setIsSlugEditing(false);
  }, [catalog, isEditing, reset]);

  useEffect(() => {
    if (existingPricingTiers && existingPricingTiers.length > 0) {
      setValue(
        'pricing_tiers',
        existingPricingTiers.map((t) => ({
          ...t,
          max_quantity: t.max_quantity ?? null,
          currency: t.currency ?? 'VND',
          display_label: t.display_label ?? null,
          is_public_visible: t.is_public_visible ?? true,
        })),
      );
    }
  }, [existingPricingTiers, setValue]);

  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      setValue('images', existingImages);
    }
  }, [existingImages, setValue]);

  const watchCode = watch('code');
  const watchSlug = watch('slug');
  const watchName = watch('name');

  useEffect(() => {
    if (!isEditing && nextCode && !watchCode) {
      setValue('code', nextCode);
    }
  }, [isEditing, nextCode, setValue, watchCode]);

  useEffect(() => {
    if (!isCustomSlug.current && watchCode) {
      const autoSlug = watchCode.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
      setValue('slug', autoSlug, { shouldValidate: true });
    }
  }, [watchCode, setValue]);

  // MOQ watch listener: auto-align first public pricing tier when MOQ increases
  const prevMoqRef = useRef<number | null>(null);
  const watchMoq = watch('b2b_planner.minimum_order_qty_kg');

  const alignFirstTierToMoq = useCallback(
    (newMoq: number) => {
      const tiers = watch('pricing_tiers') ?? [];
      if (tiers.length === 0 || newMoq <= 0) return;

      const firstPublicIndex = tiers.findIndex((t) => t.is_public_visible);
      if (firstPublicIndex === -1) return;

      const firstPublicTier = tiers[firstPublicIndex];
      if (
        firstPublicTier !== undefined &&
        firstPublicTier.min_quantity < newMoq
      ) {
        setValue(`pricing_tiers.${firstPublicIndex}.min_quantity`, newMoq, {
          shouldValidate: true,
        });
      }
    },
    [watch, setValue],
  );

  useEffect(() => {
    const currentMoq = watchMoq ?? 0;
    const prevMoq = prevMoqRef.current;

    if (prevMoq !== null && currentMoq > prevMoq) {
      alignFirstTierToMoq(currentMoq);
    }
    prevMoqRef.current = currentMoq;
  }, [watchMoq, alignFirstTierToMoq]);

  async function onSubmit(values: FabricCatalogFormValues) {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: catalog.id,
          values,
        });
      } else {
        await createMutation.mutateAsync(values);
      }
      onClose();
    } catch (err) {
      // Error shown via mutationError below
      console.error('[FabricCatalogSubmitError]', err);
    }
  }

  const handleDownloadQR = () => {
    const canvas = document.querySelector(
      '#qr-container canvas',
    ) as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = `fabric-${watchCode || 'qr'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  const handlePrintQR = () => {
    openPrintWindow(printAreaRef.current, {
      title: LABELS.ACTION_PRINT_QR,
      css: FABRIC_SAMPLE_HORIZONTAL_CSS,
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('[CopyLinkError]', message);
    }
  };

  const handleSlugEditStart = () => {
    isCustomSlug.current = true;
    setIsSlugEditing(true);
  };

  const handleSlugEditCancel = () => {
    setIsSlugEditing(false);
    // Reset to auto-generated slug
    if (watchCode) {
      isCustomSlug.current = false;
      const autoSlug = watchCode.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
      setValue('slug', autoSlug, { shouldValidate: true });
    }
  };

  const onInvalid = (
    errors: import('react-hook-form').FieldErrors<FabricCatalogFormValues>,
  ) => {
    console.error('[Form Validation Errors]', errors);
    const errs = errors as Record<string, unknown>;
    if (
      errs.code ||
      errs.name ||
      errs.composition ||
      errs.unit ||
      errs.gauge ||
      errs.diameter ||
      errs.warp_count ||
      errs.weft_count
    ) {
      setActiveTab('info');
    } else if (errs.b2b_planner || errs.pricing_tiers) {
      setActiveTab('public');
    } else if (errs.images) {
      setActiveTab('gallery');
    } else if (errs.slug || errs.status || errs.notes) {
      setActiveTab('admin');
    }
  };

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;
  const publicUrl = `${window.location.origin}/p/fabric/${watchSlug}`;

  return {
    methods,
    activeTab,
    setActiveTab,
    isEditing,
    isPending,
    mutationError,
    publicUrl,
    watchCode,
    watchName,
    isSlugEditing,
    printAreaRef,
    handleDownloadQR,
    handlePrintQR,
    handleCopyLink,
    handleSlugEditStart,
    handleSlugEditCancel,
    onSubmit: handleSubmit(onSubmit, onInvalid),
  };
}
