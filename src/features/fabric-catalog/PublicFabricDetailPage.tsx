import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';

import {
  usePublicFabricBasic,
  usePublicFabricVariants,
  usePublicFabricImages,
  useRelatedPublicFabrics,
  useAlsoViewedPublicFabrics,
  usePublicPricingTiers,
} from '@/application/settings/useFabricCatalog';
import { Button, Icon, IconName } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import { useWishlist } from '@/shared/wishlist';
import {
  StatusBadge,
  SAMPLE_STATUS_CONFIG,
  STOCK_STATUS_CONFIG,
} from '@/shared/components/status-badge';

import { PublicFabricDetailSkeleton } from './components/PublicFabricDetailSkeleton';
import { B2BPlanner } from './components/B2BPlanner';
import {
  HOTLINE,
  PUBLIC_PAGE_LABELS as LABELS,
  STRETCH_TYPE_MAP,
  THICKNESS_MAP,
  LEAD_TIME_UNIT_MAP,
  IMAGE_TYPE_MAP,
} from './fabric-catalog.constants';
import { WishlistDrawer } from './components/WishlistDrawer';
import {
  PublicCompareModal,
  type CompareItem,
} from './components/PublicCompareModal';
import { PublicSampleModal } from './components/PublicSampleModal';
import { PublicRFQModal } from './components/PublicRFQModal';

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

  // Phase 3 States (Context & Hooks)
  const { wishlist, addToWishlist, removeFromWishlist, addRecentlyViewed } =
    useWishlist();

  const [compareList, setCompareList] = useState<CompareItem[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isBatchRequest, setIsBatchRequest] = useState(false);

  // Phase 4 States
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  // Load compare list on mount
  useEffect(() => {
    const savedCompare = localStorage.getItem('vp_fabric_compare');
    if (savedCompare) {
      try {
        setCompareList(JSON.parse(savedCompare));
      } catch {
        // ignore
      }
    }
  }, []);

  // Track recently viewed
  useEffect(() => {
    if (fabric?.id) {
      addRecentlyViewed(fabric.id);
    }
  }, [fabric?.id, addRecentlyViewed]);

  // Dynamic SEO & OG Metadata update
  useEffect(() => {
    if (fabric) {
      document.title = `${fabric.name} | ${LABELS.brandName}`;

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute(
        'content',
        `${fabric.name} (${fabric.code}) - ${fabric.composition || ''}. Khổ ${fabric.target_width_cm || ''}cm, định lượng ${fabric.target_gsm || ''}gsm.`,
      );

      const ogTags = {
        'og:title': `${fabric.code} | ${fabric.name}`,
        'og:description': `Thành phần: ${fabric.composition || 'N/A'}. Khổ chuẩn: ${fabric.target_width_cm || ''}cm. Xem chi tiết bảng màu và thông tin MOQ/Lead time trực tuyến.`,
        'og:image': fabric.image_url || '',
        'og:url': window.location.href,
        'og:type': 'product',
      };

      Object.entries(ogTags).forEach(([property, content]) => {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('property', property);
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
      });
    }
  }, [fabric]);

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

  // Gallery slider logic
  const galleryImages = images || [];
  const displayImage =
    activeColorImage ||
    (galleryImages.length > 0
      ? galleryImages[currentImageIndex]?.image_url
      : fabric.image_url);

  const displayAltText = activeColorImage
    ? `Màu ${activeColorName} - ${fabric.name}`
    : galleryImages.length > 0
      ? galleryImages[currentImageIndex]?.alt_text ||
        galleryImages[currentImageIndex]?.caption ||
        fabric.name
      : fabric.name;

  // Dynamic overrides parsing
  const activeVariant = variants?.find((v) => v.color_name === activeColorName);
  const override = activeVariant?.commercial_override;

  const displayMOQ = override
    ? override.minimum_stock_order
      ? `${override.minimum_stock_order} ${fabric.commercial?.minimum_order_unit || fabric.unit} (Hàng sẵn)`
      : override.minimum_custom_order
        ? `${override.minimum_custom_order} ${fabric.commercial?.minimum_order_unit || fabric.unit} (Đặt sản xuất)`
        : LABELS.na
    : fabric.commercial?.minimum_order_qty
      ? `${fabric.commercial.minimum_order_qty} ${fabric.commercial.minimum_order_unit || fabric.unit}`
      : LABELS.na;

  const displayLeadTime = override
    ? override.lead_time_stock
      ? `${override.lead_time_stock} ${LEAD_TIME_UNIT_MAP[override.lead_time_unit || 'day'] || override.lead_time_unit} (Hàng sẵn)`
      : override.lead_time_custom
        ? `${override.lead_time_custom} ${LEAD_TIME_UNIT_MAP[override.lead_time_unit || 'day'] || override.lead_time_unit} (Sản xuất)`
        : LABELS.na
    : fabric.commercial?.lead_time_min
      ? `${fabric.commercial.lead_time_min}-${fabric.commercial.lead_time_max} ${LEAD_TIME_UNIT_MAP[fabric.commercial.lead_time_unit || 'day'] || fabric.commercial.lead_time_unit}`
      : LABELS.na;

  // Wishlist handler
  const isSaved = Object.keys(wishlist).includes(fabric?.id || '');
  const handleToggleWishlist = () => {
    if (!fabric) return;

    if (isSaved) {
      removeFromWishlist(fabric.id || '');
      toast.success('Đã bỏ lưu mẫu vải.');
    } else {
      addToWishlist({
        id: fabric.id || '',
        code: fabric.code || '',
        name: fabric.name || '',
        image_url: fabric.image_url || undefined,
        color_name: activeColorName || undefined,
      });
      toast.success('Đã lưu mẫu vải.');
    }
  };

  // Compare handler
  const isCompared = compareList.some((item) => item.id === fabric.id);
  const handleToggleCompare = () => {
    let updated: CompareItem[];
    if (isCompared) {
      updated = compareList.filter((item) => item.id !== fabric.id);
      toast.success('Đã xóa khỏi danh sách so sánh.');
    } else {
      if (compareList.length >= 3) {
        toast.error(LABELS.compareLimit);
        return;
      }
      updated = [
        ...compareList,
        {
          id: fabric.id || '',
          code: fabric.code || '',
          name: fabric.name || '',
          slug: fabric.slug || '',
          composition: fabric.composition || null,
          target_width_cm: fabric.target_width_cm || null,
          target_gsm: fabric.target_gsm || null,
          stretch_type: fabric.stretch_type || null,
          thickness: fabric.thickness || null,
          moq: displayMOQ,
          lead_time: displayLeadTime,
        },
      ];
      toast.success('Đã thêm vào danh sách so sánh.');
    }
    setCompareList(updated);
    localStorage.setItem('vp_fabric_compare', JSON.stringify(updated));
  };

  const handleShare = () => {
    const shareText = `${fabric.code} | ${fabric.name}\n- Thành phần: ${fabric.composition || 'N/A'}\n- Khổ: ${fabric.target_width_cm || ''}cm\n- Định lượng: ${fabric.target_gsm || ''}gsm\nLink: ${window.location.href}`;
    if (navigator.share) {
      navigator
        .share({
          title: `${fabric.code} - ${fabric.name}`,
          text: shareText,
          url: window.location.href,
        })
        .catch(() => {
          navigator.clipboard.writeText(shareText);
          toast.success(LABELS.copiedLink);
        });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success(LABELS.copiedLink);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 font-sans relative">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <h1 className="text-base font-bold text-primary tracking-tight">
          {LABELS.brandName}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCompareOpen(true)}
            className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            title={LABELS.compareTitle}
          >
            <Icon name="Scale" className="w-5 h-5" />
            {compareList.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {compareList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsWishlistOpen(true)}
            className="relative p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            title={LABELS.wishlistTitle}
          >
            <Icon name="Heart" className="w-5 h-5" />
            {Object.keys(wishlist).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {Object.keys(wishlist).length}
              </span>
            )}
          </button>
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
            title={LABELS.shareTitle}
          >
            <Icon name="Share2" className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Hero Image Slider */}
      <div className="w-full bg-white relative">
        <div className="w-full aspect-[4/3] bg-slate-100 relative overflow-hidden">
          {displayImage ? (
            <img
              src={displayImage}
              alt={displayAltText}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <Icon name="Image" className="w-10 h-10 mb-2 opacity-50" />
              <span className="text-sm">{LABELS.noImage}</span>
            </div>
          )}

          {/* View Count Badge */}
          {(fabric.view_count ?? 0) > 0 && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
              <span>🔥</span>
              Lượt xem: {fabric.view_count ?? 0}
            </div>
          )}
        </div>

        {/* Thumbnail Gallery */}
        {galleryImages.length > 0 && (
          <div className="flex overflow-x-auto gap-3 p-3 bg-white scrollbar-none scroll-smooth">
            {galleryImages.map((img, index) => {
              const label = IMAGE_TYPE_MAP[img.type] || img.type;
              const isActive = !activeColorImage && currentImageIndex === index;
              return (
                <button
                  key={img.id}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    setActiveColorImage(null);
                    setActiveColorName(null);
                  }}
                  className={cn(
                    'relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                    isActive
                      ? 'border-primary ring-2 ring-primary/20 ring-offset-1'
                      : 'border-transparent hover:border-slate-300',
                  )}
                  title={img.caption || label}
                >
                  <img
                    src={img.image_url}
                    alt={img.alt_text || label}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-sm py-1 px-0.5">
                    <p className="text-[9px] text-white font-medium text-center truncate leading-tight">
                      {label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <main className="flex-1 p-3 space-y-3">
        {/* Title, Commercial Badges & Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div>
              <h2 className="text-xl font-bold text-gray-900 leading-snug">
                {fabric.name}
              </h2>
              <p className="text-primary font-bold text-lg">{fabric.code}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleToggleCompare}
                className={cn(
                  'p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold',
                  isCompared
                    ? 'bg-slate-100 text-slate-800 border-slate-200'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                )}
              >
                <Icon name="Scale" className="w-4 h-4" />
                {isCompared ? LABELS.addedCompare : LABELS.addToCompare}
              </button>
              <button
                onClick={handleToggleWishlist}
                className={cn(
                  'p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 text-xs font-semibold',
                  isSaved
                    ? 'bg-red-50 text-red-600 border-red-100'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                )}
              >
                <Icon
                  name="Heart"
                  className={cn('w-4 h-4', isSaved && 'fill-current')}
                />
                {isSaved ? LABELS.savedWishlist : LABELS.saveWishlist}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <StatusBadge
              status={fabric.commercial?.sample_status}
              configMap={SAMPLE_STATUS_CONFIG}
            />
            <StatusBadge
              status={fabric.commercial?.stock_status}
              configMap={STOCK_STATUS_CONFIG}
            />
          </div>
        </div>

        {/* Color Section with Standard Codes */}
        {variants && variants.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-col gap-1 mb-3">
              <h3 className="text-base font-bold text-gray-900">
                {LABELS.colorSectionTitle}
              </h3>
              {activeColorName && (
                <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                  <span>{LABELS.colorViewing}</span>
                  <span className="font-semibold text-gray-900">
                    {activeColorName}
                  </span>
                  {activeVariant?.color_code && (
                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {activeVariant.color_standard}: {activeVariant.color_code}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveColorImage(
                      v.public_image_url || fabric.image_url || null,
                    );
                    setActiveColorName(v.color_name);
                  }}
                  className={cn(
                    'w-10 h-10 rounded-full border-2 transition-all shadow-sm flex items-center justify-center relative',
                    activeColorName === v.color_name
                      ? 'border-primary ring-2 ring-primary/20 scale-110'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                  style={{ backgroundColor: v.color_hex || '#ccc' }}
                  title={v.color_name}
                >
                  {!v.color_hex && (
                    <span className="text-[10px] text-gray-500 font-medium">
                      {LABELS.na}
                    </span>
                  )}
                  {/* Indicator if this color has custom pricing/MOQ rules */}
                  {v.commercial_override && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Planner Layer */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="text-base font-bold text-gray-900">
              Công cụ B2B Planner
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

        {/* Technical Specifications */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
            {LABELS.specs}
          </h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            {fabric.fabric_type && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">
                  {LABELS.fabricType}
                </span>
                <span className="font-semibold text-gray-800 text-sm">
                  {fabric.fabric_type === 'knitted'
                    ? LABELS.knitted
                    : LABELS.woven}
                </span>
              </div>
            )}

            {fabric.composition && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">
                  {LABELS.composition}
                </span>
                <span className="font-semibold text-gray-800 text-sm">
                  {fabric.composition}
                </span>
              </div>
            )}

            {fabric.target_width_cm && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">
                  {LABELS.width}
                </span>
                <span className="font-semibold text-gray-800 text-sm">
                  {fabric.target_width_cm} {LABELS.unitCm}
                </span>
              </div>
            )}

            {fabric.target_gsm && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">{LABELS.gsm}</span>
                <span className="font-semibold text-gray-800 text-sm">
                  {fabric.target_gsm} {LABELS.unitGsm}
                </span>
              </div>
            )}

            {fabric.stretch_type && STRETCH_TYPE_MAP[fabric.stretch_type] && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">
                  {LABELS.stretch}
                </span>
                <span className="font-semibold text-gray-800 text-sm">
                  {STRETCH_TYPE_MAP[fabric.stretch_type]}
                </span>
              </div>
            )}

            {fabric.thickness && THICKNESS_MAP[fabric.thickness] && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">
                  {LABELS.thickness}
                </span>
                <span className="font-semibold text-gray-800 text-sm">
                  {THICKNESS_MAP[fabric.thickness]}
                </span>
              </div>
            )}

            {fabric.weave_pattern && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">
                  {LABELS.weavePattern}
                </span>
                <span className="font-semibold text-gray-800 text-sm">
                  {fabric.weave_pattern}
                </span>
              </div>
            )}

            {fabric.technique && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">
                  {LABELS.machineType}
                </span>
                <span className="font-semibold text-gray-800 text-sm">
                  {fabric.technique}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Commercial Specifications (MOQ & Lead times) */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
            {LABELS.specsCommercial}
          </h3>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4">
            <div className="flex flex-col">
              <span className="text-xs text-muted mb-0.5">{LABELS.moq}</span>
              <span className="font-bold text-gray-800 text-sm">
                {displayMOQ}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-xs text-muted mb-0.5">
                {LABELS.leadTime}
              </span>
              <span className="font-bold text-gray-800 text-sm">
                {displayLeadTime}
              </span>
            </div>

            {fabric.commercial?.origin_country && (
              <div className="flex flex-col col-span-2">
                <span className="text-xs text-muted mb-0.5">
                  {LABELS.origin}
                </span>
                <span className="font-semibold text-gray-800 text-sm">
                  {fabric.commercial.origin_country}
                </span>
              </div>
            )}
          </div>

          {/* Volume Pricing */}
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">
              Bảng giá bậc thang
            </h4>
            {pricingTiers &&
            pricingTiers.filter((t) => t.is_public_visible).length > 0 ? (
              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="p-3">{LABELS.pricingTierColQty}</th>
                      <th className="p-3 text-right">
                        {LABELS.pricingTierColPrice}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {[...pricingTiers]
                      .filter((t) => t.is_public_visible)
                      .sort((a, b) => a.min_quantity - b.min_quantity)
                      .map((tier) => {
                        const rangeLabel = tier.max_quantity
                          ? `Từ ${tier.min_quantity} - ${tier.max_quantity}`
                          : `Từ ${tier.min_quantity}`;
                        return (
                          <tr key={tier.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-medium">
                              Mua {rangeLabel} {fabric.unit || 'kg'}
                            </td>
                            <td className="p-3 text-right font-semibold text-primary">
                              {tier.display_label
                                ? tier.display_label
                                : new Intl.NumberFormat('vi-VN', {
                                    style: 'currency',
                                    currency: tier.currency || 'VND',
                                  }).format(tier.unit_price)}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 text-center border border-dashed border-slate-200">
                <p className="text-xs text-muted">
                  {LABELS.noPricingTiersDesc}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Rich Characteristics */}
        {fabric.characteristics && fabric.characteristics.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3">
              {LABELS.characteristics}
            </h3>
            <div className="space-y-3">
              {fabric.characteristics.map((char) => (
                <div key={char.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Icon
                      name={(char.icon as IconName) || 'Check'}
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {char.name}
                    </h4>
                    {char.description && (
                      <p className="text-xs text-muted mt-0.5 leading-relaxed">
                        {char.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rich Applications */}
        {fabric.applications && fabric.applications.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3">
              {LABELS.applications}
            </h3>
            <div className="space-y-3">
              {fabric.applications.map((app) => (
                <div key={app.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon
                      name={(app.icon as IconName) || 'Shirt'}
                      className="w-5 h-5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {app.name}
                    </h4>
                    {app.description && (
                      <p className="text-xs text-muted mt-0.5 leading-relaxed">
                        {app.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collaborative Recommendations ("Khách hàng khác cũng xem") */}
        {alsoViewed && alsoViewed.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
              {LABELS.alsoViewedProducts}
            </h3>
            <div className="grid grid-cols-3 gap-3 pt-1">
              {alsoViewed.map((item) => (
                <Link
                  key={item.id}
                  to={`/p/fabric/${item.slug}`}
                  className="flex flex-col group"
                >
                  <div className="w-full aspect-square rounded-lg bg-gray-100 overflow-hidden mb-1.5 relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        {LABELS.noImageIcon}
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-gray-950 text-xs truncate group-hover:text-primary transition-colors">
                    {item.code}
                  </span>
                  <span className="text-[10px] text-muted truncate">
                    {item.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Related Products Section */}
        {related && related.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
              {LABELS.relatedProducts}
            </h3>
            <div className="space-y-3 pt-1">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/p/fabric/${item.slug}`}
                  className="flex items-center gap-3 group"
                >
                  <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {LABELS.noImageIcon}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-primary transition-colors">
                      {item.code}
                    </p>
                    <p className="text-xs text-muted truncate">{item.name}</p>
                  </div>
                  <Icon
                    name="ChevronRight"
                    className="w-4 h-4 text-gray-400 group-hover:text-primary"
                  />
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.08)] z-40">
        <div className="flex gap-2 max-w-md mx-auto">
          <a
            href={`tel:${HOTLINE}`}
            className="flex-1 flex flex-col items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 px-2 rounded-xl transition-colors"
          >
            <Icon name="Phone" className="w-5 h-5" />
            <span className="text-xs font-semibold">{LABELS.callNow}</span>
          </a>
          <button
            onClick={() => {
              const msg = `Xin chào,\nTôi muốn nhận báo giá:\n- Mã vải: ${fabric.code}\n- Tên: ${fabric.name}\n- Màu: ${activeColorName || 'Tất cả màu'}\n- MOQ: ${displayMOQ}\nVui lòng tư vấn giúp.`;
              window.open(
                `https://zalo.me/${HOTLINE}?text=${encodeURIComponent(msg)}`,
                '_blank',
              );
            }}
            className="flex-[2] flex flex-col items-center justify-center gap-1 bg-[#0068ff]/10 hover:bg-[#0068ff]/20 text-[#0068ff] border border-[#0068ff]/20 py-2.5 px-2 rounded-xl transition-colors"
          >
            <Icon name="MessageCircle" className="w-5 h-5" />
            <span className="text-xs font-semibold">{LABELS.zaloQuote}</span>
          </button>
          <button
            onClick={() => {
              setIsBatchRequest(false);
              setIsSampleModalOpen(true);
            }}
            className="flex-[2] flex flex-col items-center justify-center gap-1 bg-[#0068ff] hover:bg-[#0054cc] text-white py-2.5 px-2 rounded-xl transition-colors shadow-sm shadow-[#0068ff]/30"
          >
            <Icon name="Package" className="w-5 h-5" />
            <span className="text-xs font-semibold">{LABELS.zaloSample}</span>
          </button>
        </div>
      </div>

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

      {/* --- Compare Modal --- */}
      <PublicCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        compareList={compareList}
        setCompareList={setCompareList}
      />

      {/* --- Sample Request Lead Form Modal --- */}
      <PublicSampleModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        fabric={fabric}
        activeColorName={activeColorName}
        isBatchRequest={isBatchRequest}
        wishlist={wishlist}
      />

      {/* --- Request for Quote (RFQ) Modal --- */}
      <PublicRFQModal
        isOpen={isRfqModalOpen}
        onClose={() => setIsRfqModalOpen(false)}
        fabric={fabric}
        variants={variants}
        activeColorName={activeColorName}
        isBatchRequest={isBatchRequest}
        wishlist={wishlist}
      />
    </div>
  );
}
