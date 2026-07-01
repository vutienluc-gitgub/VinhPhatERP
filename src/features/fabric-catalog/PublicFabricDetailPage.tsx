import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  usePublicFabricBasic,
  usePublicFabricVariants,
  usePublicFabricImages,
  useRelatedPublicFabrics,
  useAlsoViewedPublicFabrics,
  usePublicPricingTiers,
} from '@/application/settings/useFabricCatalog';
import { Button, Icon } from '@/shared/components';
import { useWishlist } from '@/shared/wishlist';
import { B2BPlanner } from '@/features/fabric-catalog/components/B2BPlanner';
import { FabricColorSelector } from '@/features/fabric-catalog/components/detail/FabricColorSelector';
import { FabricHeaderActions } from '@/features/fabric-catalog/components/detail/FabricHeaderActions';
import { FabricHeroGallery } from '@/features/fabric-catalog/components/detail/FabricHeroGallery';
import { FabricPricingTable } from '@/features/fabric-catalog/components/detail/FabricPricingTable';
import { FabricRecommendations } from '@/features/fabric-catalog/components/detail/FabricRecommendations';
import { FabricRichContent } from '@/features/fabric-catalog/components/detail/FabricRichContent';
import { FabricSpecsList } from '@/features/fabric-catalog/components/detail/FabricSpecsList';
import { FabricStickyCTA } from '@/features/fabric-catalog/components/detail/FabricStickyCTA';
import { FabricTitleAndBadges } from '@/features/fabric-catalog/components/detail/FabricTitleAndBadges';
import {
  PublicCompareModal,
  type CompareItem,
} from '@/features/fabric-catalog/components/PublicCompareModal';
import { PublicFabricDetailSkeleton } from '@/features/fabric-catalog/components/PublicFabricDetailSkeleton';
import { PublicLoginModal } from '@/features/fabric-catalog/components/PublicLoginModal';
import { PublicRFQModal } from '@/features/fabric-catalog/components/PublicRFQModal';
import { PublicSampleModal } from '@/features/fabric-catalog/components/PublicSampleModal';
import { WishlistDrawer } from '@/features/fabric-catalog/components/WishlistDrawer';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';
import { useFabricCompare } from '@/features/fabric-catalog/hooks/useFabricCompare';
import { useFabricDisplayLogic } from '@/features/fabric-catalog/hooks/useFabricDisplayLogic';
import { useFabricSeo } from '@/features/fabric-catalog/hooks/useFabricSeo';
import { usePublicViewer } from '@/features/fabric-catalog/hooks/usePublicViewer';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = localStorage.getItem('fabric_session_id');
  if (!sid) {
    sid =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('fabric_session_id', sid);
  }
  return sid;
}

export function PublicFabricDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const sessionId = getOrCreateSessionId();

  // BFF Parallel Queries
  const {
    data: fabric,
    isLoading: basicLoading,
    isError,
  } = usePublicFabricBasic(slug, sessionId);
  const { data: variants } = usePublicFabricVariants(fabric?.id);
  const { data: images } = usePublicFabricImages(fabric?.id);
  const { data: related } = useRelatedPublicFabrics(fabric?.id);
  const { data: alsoViewed } = useAlsoViewedPublicFabrics(fabric?.id);
  const { data: pricingTiers } = usePublicPricingTiers(fabric?.id);

  const [activeColorImage, setActiveColorImage] = useState<string | null>(null);
  const [activeColorName, setActiveColorName] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Wishlist Context & Hook
  const { wishlist, addToWishlist, removeFromWishlist, addRecentlyViewed } =
    useWishlist();

  // Modals Visibility States
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isBatchRequest, setIsBatchRequest] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);

  const viewer = usePublicViewer();

  // Extract presentation and display logic calculations
  const {
    activeVariant,
    displayMOQ,
    displayLeadTime,
    handleShare,
    getZaloQuoteUrl,
  } = useFabricDisplayLogic(fabric, variants, activeColorName);

  // Extract dynamically synced compare list
  const { compareList, setCompareList, isCompared, handleToggleCompare } =
    useFabricCompare(fabric, displayMOQ, displayLeadTime);

  // Extract dynamic page title and OG metadata updating
  useFabricSeo(fabric);

  // Track recently viewed history side-effect
  useEffect(() => {
    if (fabric?.id) {
      addRecentlyViewed(fabric.id);
    }
  }, [fabric?.id, addRecentlyViewed]);

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
        <p className="text-muted mb-6">{LABELS.notFoundDesc}</p>
        <Button variant="primary" onClick={() => (window.location.href = '/')}>
          {LABELS.backHome}
        </Button>
      </div>
    );
  }

  // Wishlist handler
  const isSaved = Object.keys(wishlist).includes(fabric.id || '');
  const handleToggleWishlist = () => {
    if (!fabric) return;

    if (isSaved) {
      removeFromWishlist(fabric.id || '');
      toast.success(LABELS.unwishlistSuccess);
    } else {
      addToWishlist({
        id: fabric.id || '',
        code: fabric.code || '',
        name: fabric.name || '',
        image_url: fabric.image_url || undefined,
        color_name: activeColorName || undefined,
      });
      toast.success(LABELS.wishlistSuccess);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 font-sans relative">
      {/* Header Actions */}
      <FabricHeaderActions
        canViewWholesale={viewer.permissions.canViewWholesale}
        isAuthenticated={viewer.isAuthenticated}
        compareCount={compareList.length}
        wishlistCount={Object.keys(wishlist).length}
        onOpenCompare={() => setIsCompareOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onShare={handleShare}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onSignOut={() => viewer.signOut()}
      />

      {/* Hero Image Slider */}
      <FabricHeroGallery
        fabric={fabric}
        galleryImages={images || []}
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
          handleToggleWishlist={handleToggleWishlist}
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
            onClick={() => setIsRfqModalOpen(true)}
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

        {/* Cross Recommendations & Related Slider */}
        <FabricRecommendations alsoViewed={alsoViewed} related={related} />
      </main>

      {/* Fixed Sticky CTA Bottom Bar */}
      <FabricStickyCTA
        fabric={fabric}
        canOpenERP={viewer.permissions.canOpenERP}
        canOrder={viewer.permissions.canOrder}
        zaloQuoteUrl={getZaloQuoteUrl()}
        onRequestSample={() => {
          setIsBatchRequest(false);
          setIsSampleModalOpen(true);
        }}
      />

      {/* Wishlist Drawer */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlist}
        onRemoveItem={removeFromWishlist}
        onRequestSample={() => {
          setIsBatchRequest(true);
          setIsSampleModalOpen(true);
          setIsWishlistOpen(false);
        }}
        onRequestRFQ={() => {
          setIsBatchRequest(true);
          setIsRfqModalOpen(true);
          setIsWishlistOpen(false);
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
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        fabric={fabric}
        activeColorName={activeColorName}
        isBatchRequest={isBatchRequest}
        wishlist={wishlist}
      />

      {/* Request for Quote (RFQ) Modal */}
      <PublicRFQModal
        isOpen={isRfqModalOpen}
        onClose={() => setIsRfqModalOpen(false)}
        fabric={fabric}
        variants={variants}
        activeColorName={activeColorName}
        isBatchRequest={isBatchRequest}
        wishlist={wishlist}
      />

      {/* B2B Login Modal */}
      <PublicLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
