import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';

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
import { useFormAutoSave } from '@/shared/hooks';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import { LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

type FormTab = 'info' | 'public' | 'gallery' | 'admin';

function catalogToFormValues(catalog: FabricCatalog): FabricCatalogFormValues {
  const base = {
    category_id: catalog.category_id ?? null,
    code: catalog.code,
    name: catalog.name,
    composition: catalog.composition ?? '',
    composition_parts: catalog.composition_parts ?? [],
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
    faq_data: (catalog.faq_data ?? []).map((item) => ({
      question: item.question ?? '',
      answer: item.answer ?? '',
    })),
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

  const { handleSubmit, reset, setValue, watch } = methods;

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
          priority: t.priority ?? 0,
          customer_group_ids: t.customer_group_ids ?? [],
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
      clearDraft();
      toast.success(isEditing ? 'Cập nhật thành công' : 'Thêm mới thành công');
      onClose();
    } catch (err) {
      // Error shown via mutationError below
      console.error('[FabricCatalogSubmitError]', err);
    }
  }

  const handleDownloadQR = async () => {
    try {
      const formValues = watch();
      const mockCatalog = {
        ...catalog,
        ...formValues,
        id: catalog?.id || 'preview',
      } as FabricCatalog;

      // Lazy import mapper and registry to avoid cycle issues if any, or just import them at top
      const { mapCatalogToFabricLabel } =
        await import('@/features/fabric-catalog/label/mapper');
      const { LabelEngine, LabelRegistry, exportSvgToPng } =
        await import('@/shared/lib/label-engine');

      const labelData = mapCatalogToFabricLabel(mockCatalog);
      const template = LabelRegistry.get('fabric-80x40');

      const svgString = await LabelEngine.exportSVG('fabric-80x40', labelData);
      const dataUrl = await exportSvgToPng(
        svgString,
        template.widthPx,
        template.heightPx,
      );
      const link = document.createElement('a');
      link.download = `fabric-${watchCode || 'qr'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      toast.error('Lỗi tải ảnh QR');
      console.error('[DownloadQRError]', err);
    }
  };

  const handlePrintQR = async () => {
    try {
      const formValues = watch();
      const mockCatalog = {
        ...catalog,
        ...formValues,
        id: catalog?.id || 'preview',
      } as FabricCatalog;

      // Lazy import to avoid cycle issues if any, or just import them at top
      const { mapCatalogToFabricLabel } =
        await import('@/features/fabric-catalog/label/mapper');
      const { LabelEngine, LabelRegistry } =
        await import('@/shared/lib/label-engine');

      const printLabelData = mapCatalogToFabricLabel(mockCatalog);
      const template = LabelRegistry.get('fabric-80x40');

      const svgString = await LabelEngine.exportSVG(
        'fabric-80x40',
        printLabelData,
      );
      const tempDiv = document.createElement('div');
      tempDiv.className = 'ast-label-wrapper';
      tempDiv.innerHTML = svgString;

      openPrintWindow(tempDiv, {
        title: LABELS.ACTION_PRINT_QR,
        css: `
          @page { size: ${template.widthMm}mm ${template.heightMm}mm; margin: 0; }
          html, body { 
            margin: 0; padding: 0; overflow: hidden; background: #ffffff; 
            display: flex; justify-content: center; align-items: center; 
            width: ${template.widthMm}mm; height: ${template.heightMm}mm;
          }
          .ast-label-wrapper { width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; }
          .ast-label-wrapper svg { width: 100% !important; height: 100% !important; object-fit: contain; }
        `,
      });
    } catch (err) {
      toast.error('Lỗi khi mở giao diện in');
      console.error('[PrintQRError]', err);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success('Đã sao chép liên kết');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      toast.error('Lỗi sao chép: ' + message);
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
    } else if (errs.b2b_planner || errs.pricing_tiers || errs.faq_data) {
      setActiveTab('public');
    } else if (errs.images) {
      setActiveTab('gallery');
    } else if (errs.slug || errs.status || errs.notes) {
      setActiveTab('admin');
    }
  };

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending = createMutation.isPending || updateMutation.isPending;
  const publicUrl = `${window.location.origin}/p/fabric/${watchSlug}`;

  // 1. Prepare Model for preview
  const formValues = watch();
  const labelData = {
    code: watchCode || 'N/A',
    name: watchName || 'N/A',
    specs: [
      formValues.composition,
      [
        formValues.target_width_cm ? `${formValues.target_width_cm}cm` : null,
        formValues.target_gsm ? `${formValues.target_gsm} GSM` : null,
      ]
        .filter(Boolean)
        .join(' • '),
    ].filter(Boolean) as string[],
    footer: 'Scan for Details',
    qrValue: publicUrl,
  };

  const {
    status: autoSaveStatus,
    lastSavedTimeText,
    clearDraft,
  } = useFormAutoSave({
    formId:
      isEditing && catalog
        ? `fabric-catalog-edit-${catalog.id}`
        : 'fabric-catalog-new',
    methods,
  });

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
    labelData,
    autoSaveStatus,
    lastSavedTimeText,
  };
}
