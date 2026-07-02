import React from 'react';
import { useFormContext } from 'react-hook-form';

import type { FabricCatalogFormValues } from '@/schema/fabric-catalog.schema';

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
};
export function FabricPublicTab({
  publicUrl,
  isSlugEditing,
  handleSlugEditStart,
  handleSlugEditCancel,
  handleCopyLink,
  handleDownloadQR,
  handlePrintQR,
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

      {watchIsPublic && <FabricPublicPreview />}
    </div>
  );
}
