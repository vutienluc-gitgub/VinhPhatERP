import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

import {
  AdaptiveSheet,
  Button,
  //   Combobox,
  //   Icon,
  //   ImagePicker,
  //   Switch,
  TabSwitcher,
  //   TagInput,
} from '@/shared/components';
// import { QRCodeDisplay } from '@/shared/components/QRCodeDisplay';
import {
  useCreateFabricCatalog,
  useNextFabricCatalogCode,
  useUpdateFabricCatalog,
  useFabricCategories,
  usePublicPricingTiers,
  usePublicFabricImages,
} from '@/application/settings';
import {
  useUploadFabricImage,
  useDeleteFabricImage,
} from '@/application/inventory/useFabricImage';
import {
  fabricCatalogDefaultValues,
  fabricCatalogSchema,
} from '@/schema/fabric-catalog.schema';
import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { getErrorMessage } from '@/shared/utils/error';
import { openPrintWindow } from '@/shared/lib/print-template.engine';
import { FABRIC_SAMPLE_HORIZONTAL_CSS } from '@/shared/lib/print-template.css';

import { FabricAdminTab } from './components/FabricAdminTab';
import { FabricPublicTab } from './components/FabricPublicTab';
import { FabricInfoTab } from './components/FabricInfoTab';
import type { FabricCatalog } from './types';
import { LABELS } from './fabric-catalog.constants';
// import { FabricPublicPreview } from './components/FabricPublicPreview';
import { QRFabricLabel } from './components/QRFabricLabel';
import { FabricImageGalleryEditor } from './components/FabricImageGalleryEditor';

type FormTab = 'info' | 'public' | 'gallery' | 'admin';

const FORM_TABS: { key: FormTab; label: string }[] = [
  { key: 'info', label: LABELS.TAB_INFO },
  { key: 'public', label: LABELS.TAB_PUBLIC },
  { key: 'gallery', label: LABELS.TAB_GALLERY },
  { key: 'admin', label: LABELS.TAB_ADMIN },
];

type FabricCatalogFormProps = {
  catalog: FabricCatalog | null;
  onClose: () => void;
};

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

export function FabricCatalogForm({
  catalog,
  onClose,
}: FabricCatalogFormProps) {
  const isEditing = catalog !== null;
  const createMutation = useCreateFabricCatalog();
  const updateMutation = useUpdateFabricCatalog();
  const uploadImageMutation = useUploadFabricImage();
  const deleteImageMutation = useDeleteFabricImage();
  const { data: nextCode } = useNextFabricCatalogCode();
  const { data: categories } = useFabricCategories();
  const { data: existingPricingTiers } = usePublicPricingTiers(catalog?.id);
  const { data: existingImages } = usePublicFabricImages(catalog?.id);

  const [activeTab, setActiveTab] = useState<FormTab>('info');

  const [isSlugEditing, setIsSlugEditing] = useState(false);
  const isCustomSlug = useRef(isEditing && Boolean(catalog?.slug));
  const printAreaRef = useRef<HTMLDivElement>(null);

  const categoryOptions =
    categories?.map((c) => ({
      value: c.id,
      label: c.name,
    })) ?? [];

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
  const watchCategoryId = watch('category_id');

  const selectedCategory = categories?.find((c) => c.id === watchCategoryId);

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
    } catch {
      // Error shown via mutationError below
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

  const mutationError = isEditing ? updateMutation.error : createMutation.error;
  const isPending =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const publicUrl = `${window.location.origin}/p/fabric/${watchSlug}`;

  return (
    <AdaptiveSheet
      open={true}
      onClose={onClose}
      title={
        isEditing ? `${LABELS.EDIT_TITLE}: ${catalog.name}` : LABELS.ADD_NEW
      }
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            {LABELS.CANCEL}
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="fabric-catalog-form"
            isLoading={isPending}
          >
            {isEditing ? LABELS.UPDATE : LABELS.ADD_NEW}
          </Button>
        </>
      }
    >
      <FormProvider {...methods}>
        {mutationError && (
          <p className="error-inline mb-4">
            {LABELS.ERROR_PREFIX} {getErrorMessage(mutationError)}
          </p>
        )}

        {/* Tab Switcher */}
        <div className="mb-4">
          <TabSwitcher
            tabs={FORM_TABS}
            active={activeTab}
            onChange={setActiveTab}
            variant="pill"
          />
        </div>

        <form
          id="fabric-catalog-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="space-y-6 pb-4"
        >
          {activeTab === 'info' && (
            <FabricInfoTab
              catalog={catalog}
              isEditing={isEditing}
              categoryOptions={categoryOptions}
              uploadImageMutation={uploadImageMutation}
              deleteImageMutation={deleteImageMutation}
            />
          )}

          {activeTab === 'public' && (
            <FabricPublicTab
              publicUrl={publicUrl}
              isSlugEditing={isSlugEditing}
              handleSlugEditStart={handleSlugEditStart}
              handleSlugEditCancel={handleSlugEditCancel}
              handleCopyLink={handleCopyLink}
              handleDownloadQR={handleDownloadQR}
              handlePrintQR={handlePrintQR}
              selectedCategoryName={selectedCategory?.name}
            />
          )}

          {activeTab === 'gallery' && <FabricImageGalleryEditor />}

          {activeTab === 'admin' && <FabricAdminTab />}
        </form>
        <div style={{ display: 'none' }}>
          <div ref={printAreaRef}>
            <QRFabricLabel
              code={watchCode}
              name={watchName}
              qrValue={publicUrl}
            />
          </div>
        </div>
      </FormProvider>
    </AdaptiveSheet>
  );
}
