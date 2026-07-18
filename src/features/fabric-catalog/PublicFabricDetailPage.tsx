import { useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  usePublicFabricBasic,
  usePublicFabricVariants,
  usePublicFabricImages,
  useRelatedPublicFabrics,
  useAlsoViewedPublicFabrics,
  usePublicPricingTiers,
} from '@/application/settings/useFabricCatalog';
import { Button, Icon } from '@/shared/components';
import {
  trackLeadEvent,
  getOrCreateSessionId,
} from '@/shared/services/analytics';
import { B2BPlanner } from '@/features/fabric-catalog/components/B2BPlanner';
import { FabricColorSelector } from '@/features/fabric-catalog/components/detail/FabricColorSelector';
import { FabricHeaderActions } from '@/features/fabric-catalog/components/detail/FabricHeaderActions';
import { FabricHeroGallery } from '@/features/fabric-catalog/components/detail/FabricHeroGallery';
import { FabricPricingTable } from '@/features/fabric-catalog/components/detail/FabricPricingTable';
import { FabricRecommendations } from '@/features/fabric-catalog/components/detail/FabricRecommendations';
import { FabricRichContent } from '@/features/fabric-catalog/components/detail/FabricRichContent';
import { FabricFAQ } from '@/features/fabric-catalog/components/detail/FabricFAQ';
import { FabricSpecsList } from '@/features/fabric-catalog/components/detail/FabricSpecsList';
import { FabricStickyCTA } from '@/features/fabric-catalog/components/detail/FabricStickyCTA';
import { FabricTitleAndBadges } from '@/features/fabric-catalog/components/detail/FabricTitleAndBadges';
import {
  PublicCompareModal,
  type CompareItem,
} from '@/features/fabric-catalog/components/PublicCompareModal';
import { PublicFabricDetailSkeleton } from '@/features/fabric-catalog/components/PublicFabricDetailSkeleton';
import { PublicLoginModal } from '@/features/fabric-catalog/components/PublicLoginModal';
import { PublicInquiryModal } from '@/features/fabric-catalog/components/PublicInquiryModal';
import { PublicSampleModal } from '@/features/fabric-catalog/components/PublicSampleModal';
import { InquiryCartDrawer } from '@/features/fabric-catalog/components/InquiryCartDrawer';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import { useFabricCompare } from '@/features/fabric-catalog/hooks/useFabricCompare';
import {
  useFabricDisplayLogic,
  getLowestPriceLabel,
} from '@/features/fabric-catalog/hooks/useFabricDisplayLogic';
import { useFabricInteractions } from '@/features/fabric-catalog/hooks/useFabricInteractions';
import { useFabricSeo } from '@/features/fabric-catalog/hooks/useFabricSeo';
import { usePublicViewer } from '@/features/fabric-catalog/hooks/usePublicViewer';
import { useCTAEngine } from '@/features/fabric-catalog/hooks/useCTAEngine';
import { InquiryProvider } from '@/features/fabric-catalog/context/InquiryProvider';

function PublicFabricDetailPageInner() {
  const { slug } = useParams<{ slug: string }>();
  const sessionId = getOrCreateSessionId();

  // BFF Parallel Queries
  const {
    data: fabric,
    isLoading: basicLoading,
    isError,
    error,
  } = usePublicFabricBasic(slug, sessionId);
  const { data: variants } = usePublicFabricVariants(fabric?.id);
  const { data: images } = usePublicFabricImages(fabric?.id);
  const { data: related } = useRelatedPublicFabrics(fabric?.id);
  const { data: alsoViewed } = useAlsoViewedPublicFabrics(fabric?.id);
  const { data: pricingTiers } = usePublicPricingTiers(fabric?.id);

  const [activeColorImage, setActiveColorImage] = useState<string | null>(null);
  const [activeColorName, setActiveColorName] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Modals — only non-RFQ modals remain as local state
  const [isInquiryCartOpen, setIsInquiryCartOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Interaction handlers (InquiryCart, RFQ, Sample)
  const {
    inquiryCart,
    isSaved,
    handleToggleInquiryCart,
    removeFromInquiryCart,
    handleCTAAction,
    openInquiry,
    openSample,
  } = useFabricInteractions(fabric, activeColorName);

  const viewer = usePublicViewer();

  // Extract presentation and display logic calculations
  const {
    activeVariant,
    displayMOQ,
    displayLeadTime,
    displayYieldMetersPerKg,
    handleShare,
  } = useFabricDisplayLogic(fabric, variants, activeColorName);

  // Dynamic CTA engine
  const ctaButtons = useCTAEngine({
    permissions: viewer.permissions,
    fabric,
    hasPricingTiers: (pricingTiers?.length ?? 0) > 0,
    slug: fabric?.slug,
    code: fabric?.code,
  });

  const lowestPrice = getLowestPriceLabel(pricingTiers);

  // Extract dynamically synced compare list
  const { compareList, setCompareList, isCompared, handleToggleCompare } =
    useFabricCompare(fabric, displayMOQ, displayLeadTime);

  // Extract dynamic page title and OG metadata updating
  useFabricSeo(fabric);

  if (basicLoading) {
    return <PublicFabricDetailSkeleton />;
  }

  if (isError || !fabric) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
        <Icon
          name="MessageCircleWarning"
          className="w-16 h-16 text-warning mb-4 opacity-50"
        />
        <h1 className="text-xl font-bold text-gray-800 mb-2">
          {LABELS.notFound}
        </h1>
        <p className="text-muted mb-2">{LABELS.notFoundDesc}</p>
        {isError && error instanceof Error && (
          <p className="text-xs text-red-500 mb-6 font-mono break-all">
            {error.message}
          </p>
        )}
        <Button variant="primary" onClick={() => (window.location.href = '/')}>
          {LABELS.backHome}
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen min-h-[100dvh] max-h-[100dvh] overflow-y-auto overflow-x-hidden bg-slate-50 flex flex-col pb-28 font-sans relative">
      {/* Header Actions */}
      <FabricHeaderActions
        canViewWholesale={viewer.permissions.canViewWholesale}
        isAuthenticated={viewer.isAuthenticated}
        compareCount={compareList.length}
        inquiryCartCount={Object.keys(inquiryCart).length}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenInquiryCart={() => setIsInquiryCartOpen(true)}
        onShare={handleShare}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onSignOut={() => viewer.signOut()}
      />

      {/* Hero Image Slider */}
      <FabricHeroGallery
        fabric={fabric}
        galleryImages={images ?? []}
        activeColorImage={activeColorImage}
        activeColorName={activeColorName}
        setActiveColorImage={setActiveColorImage}
        setActiveColorName={setActiveColorName}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
      />

      {/* Main Details */}
      <main className="flex-1 p-3 space-y-3">
        {/* Title, Badges & Actions */}
        <FabricTitleAndBadges
          fabric={fabric}
          isCompared={isCompared}
          isSaved={isSaved}
          handleToggleCompare={handleToggleCompare}
          handleToggleInquiryCart={handleToggleInquiryCart}
        />

        {/* Color Variant Selector */}
        {variants && variants.length > 0 && (
          <FabricColorSelector
            fabric={fabric}
            variants={variants}
            activeColorName={activeColorName}
            onSelectColor={(colorName, imageUrl) => {
              setActiveColorImage(imageUrl);
              setActiveColorName(colorName);
            }}
          />
        )}

        {/* B2B Planner Tool */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="text-base font-bold text-gray-900">
              {LABELS.b2bPlannerTool}
            </h3>
          </div>

          <B2BPlanner fabric={fabric} />

          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              openInquiry({ leadSource: 'planner', leadChannel: 'website' });
              trackLeadEvent('sticky_cta_click_rfq', {
                fabricCode: fabric.code,
                leadSource: 'planner',
              });
            }}
            className="mt-4 text-xs font-semibold"
          >
            <Icon name="FileText" className="w-4 h-4 mr-1.5" />
            {LABELS.rfqBtn}
          </Button>
        </div>

        {/* Specs List */}
        <FabricSpecsList
          fabric={fabric}
          displayMOQ={displayMOQ}
          displayLeadTime={displayLeadTime}
          displayYieldMetersPerKg={displayYieldMetersPerKg}
          canViewInventory={viewer.permissions.canViewInventory}
          activeVariant={activeVariant}
        />

        {/* volume pricing tiers */}
        <FabricPricingTable
          fabric={fabric}
          pricingTiers={pricingTiers}
          canViewWholesale={viewer.permissions.canViewWholesale}
          onOpenLogin={() => setIsLoginModalOpen(true)}
        />

        {/* Rich Characteristics & Applications */}
        <FabricRichContent fabric={fabric} />

        {/* FAQ Section */}
        <FabricFAQ faqItems={fabric.faq_data} />

        {/* Cross Recommendations & Related Slider */}
        <FabricRecommendations alsoViewed={alsoViewed} related={related} />
      </main>

      {/* Fixed Sticky CTA Bottom Bar — Dynamic */}
      <FabricStickyCTA
        fabric={fabric}
        ctaButtons={ctaButtons}
        displayMOQ={displayMOQ}
        displayLeadTime={displayLeadTime}
        lowestPrice={lowestPrice}
        onAction={handleCTAAction}
      />

      {/* Inquiry Cart Drawer */}
      <InquiryCartDrawer
        isOpen={isInquiryCartOpen}
        onClose={() => setIsInquiryCartOpen(false)}
        items={inquiryCart}
        onRemoveItem={removeFromInquiryCart}
        onRequestSample={() => {
          openSample({
            leadSource: 'inquiry_cart',
            leadChannel: 'website',
            isBatch: true,
          });
          setIsInquiryCartOpen(false);
        }}
        onRequestRFQ={() => {
          openInquiry({
            leadSource: 'inquiry_cart',
            leadChannel: 'website',
            isBatchRequest: true,
          });
          setIsInquiryCartOpen(false);
        }}
      />

      {/* Compare Modal */}
      <PublicCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        compareList={compareList as CompareItem[]}
        setCompareList={setCompareList}
      />

      {/* Sample Request Lead Form Modal */}
      <PublicSampleModal
        isOpen={false}
        onClose={() => {
          /* handled by RFQ context */
        }}
        fabric={fabric}
        activeColorName={activeColorName}
        isBatchRequest={false}
        inquiryCart={inquiryCart}
      />

      <PublicInquiryModal
        fabric={fabric}
        variants={variants}
        activeColorName={activeColorName}
        inquiryCart={inquiryCart}
      />

      {/* B2B Login Modal */}
      <PublicLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}

/**
 * Wraps the page in InquiryProvider so all children
 * can access openInquiry() / openSample() via context.
 */
export function PublicFabricDetailPage() {
  return (
    <InquiryProvider>
      <PublicFabricDetailPageInner />
    </InquiryProvider>
  );
}
