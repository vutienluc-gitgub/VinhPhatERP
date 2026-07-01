import React from 'react';
import { useFormContext } from 'react-hook-form';

import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';
import { getLowestPrice } from '@/features/fabric-catalog/fabric-catalog.utils';

import { FabricPublicPreview } from './FabricPublicPreview';
import { FabricPublicCustomerSection } from './FabricPublicCustomerSection';
import { FabricPublicPlannerSection } from './FabricPublicPlannerSection';
import { FabricPublicPricingSection } from './FabricPublicPricingSection';
import { FabricPublicSeoSection } from './FabricPublicSeoSection';

type FabricPublicTabProps = {
  publicUrl: string;
  isSlugEditing: boolean;
  handleSlugEditStart: () => void;
  handleSlugEditCancel: () => void;
  handleCopyLink: () => void;
  handleDownloadQR: () => void;
  handlePrintQR: () => void;
  selectedCategoryName?: string;
};

export function FabricPublicTab({
  publicUrl,
  isSlugEditing,
  handleSlugEditStart,
  handleSlugEditCancel,
  handleCopyLink,
  handleDownloadQR,
  handlePrintQR,
  selectedCategoryName,
}: FabricPublicTabProps) {
  const { watch } = useFormContext<FabricCatalogFormValues>();

  const [expandedSections, setExpandedSections] = React.useState<string[]>([
    'pricing',
    'planner',
    'trust',
    'inventory',
    'public_page',
    'customer',
    'seo',
  ]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const isExpanded = (id: string) => expandedSections.includes(id);

  const watchIsPublic = watch('is_public');
  const watchCode = watch('code');
  const watchName = watch('name');
  const watchComposition = watch('composition_tags');
  const watchWidthCm = watch('target_width_cm');
  const watchGsm = watch('target_gsm');
  const watchTechnique = watch('technique');
  const currentImageUrl = watch('image_url');

  // Note: For preview we still need to calculate lowestPrice or pass pricing tiers
  const pricingTiers = watch('pricing_tiers') || [];
  const lowestPrice = getLowestPrice(pricingTiers);

  return (
    <div className="space-y-4">
      <FabricPublicCustomerSection
        isExpanded={isExpanded('customer')}
        onToggle={() => toggleSection('customer')}
        publicUrl={publicUrl}
      />

      <FabricPublicPlannerSection
        isExpanded={isExpanded('planner')}
        onToggle={() => toggleSection('planner')}
      />

      <FabricPublicPricingSection
        isExpanded={isExpanded('pricing')}
        onToggle={() => toggleSection('pricing')}
      />

      <FabricPublicSeoSection
        isExpanded={isExpanded('seo')}
        onToggle={() => toggleSection('seo')}
        publicUrl={publicUrl}
        isSlugEditing={isSlugEditing}
        handleSlugEditStart={handleSlugEditStart}
        handleSlugEditCancel={handleSlugEditCancel}
        handleCopyLink={handleCopyLink}
        handleDownloadQR={handleDownloadQR}
        handlePrintQR={handlePrintQR}
      />

      {watchIsPublic && (
        <FabricPublicPreview
          imageUrl={currentImageUrl}
          code={watchCode}
          name={watchName}
          composition={watchComposition}
          targetWidthCm={watchWidthCm}
          targetGsm={watchGsm}
          technique={watchTechnique}
          category={selectedCategoryName}
          moq={watch('b2b_planner.minimum_order_qty_kg')}
          leadTimeDays={watch('b2b_planner.lead_time_days')}
          capacityMonthlyTons={watch(
            'b2b_planner.production_capacity_monthly_tons',
          )}
          trustHasSample={watch('b2b_planner.trust_has_sample')}
          trustFastDelivery={watch('b2b_planner.trust_fast_delivery')}
          trustTechSupport={watch('b2b_planner.trust_tech_support')}
          publicStockDisplay={watch('b2b_planner.public_stock_display')}
          lowestPrice={lowestPrice}
          standardConsumptionKg={watch('b2b_planner.standard_consumption_kg')}
        />
      )}
    </div>
  );
}
