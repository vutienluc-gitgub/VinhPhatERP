import { FabricPublicPreview } from './public-tab-sections/FabricPublicPreview';
import { FabricPublicCustomerSection } from './public-tab-sections/FabricPublicCustomerSection';
import { FabricPublicPlannerSection } from './public-tab-sections/FabricPublicPlannerSection';
import { FabricPublicPricingSection } from './public-tab-sections/FabricPublicPricingSection';
import { FabricPublicStatusSection } from './public-tab-sections/FabricPublicStatusSection';
import { FabricPublicFAQSection } from './public-tab-sections/FabricPublicFAQSection';

type FabricPublicTabProps = {
  publicUrl: string;
  updatedAt?: string | null;
};

export function FabricPublicTab({
  publicUrl,
  updatedAt,
}: FabricPublicTabProps) {
  return (
    <div className="space-y-6">
      {/* Command Center (Publish -> Preview) */}
      <div className="bg-surface rounded-2xl border border-default shadow-sm p-6 space-y-10">
        <FabricPublicStatusSection
          publicUrl={publicUrl}
          updatedAt={updatedAt}
        />
        <FabricPublicPreview />
      </div>

      {/* Workflow (Planner -> Pricing -> Customer Exp) */}
      <div className="bg-surface rounded-2xl border border-default shadow-sm p-6 sm:p-8 space-y-12">
        <FabricPublicPlannerSection />

        <div className="h-px bg-surface-secondary w-full" />

        <FabricPublicPricingSection />

        <div className="h-px bg-surface-secondary w-full" />

        <FabricPublicCustomerSection />

        <div className="h-px bg-surface-secondary w-full" />

        <FabricPublicFAQSection />
      </div>
    </div>
  );
}
