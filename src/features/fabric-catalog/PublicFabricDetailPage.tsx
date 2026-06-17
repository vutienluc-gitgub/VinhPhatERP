import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { z } from 'zod';

import {
  usePublicFabricBasic,
  usePublicFabricVariants,
  usePublicFabricImages,
  useRelatedPublicFabrics,
  useAlsoViewedPublicFabrics,
  useCreatePublicSampleRequest,
  usePublicPricingTiers,
  useCreatePublicRFQRequest,
} from '@/application/settings/useFabricCatalog';
import { Button, Icon, IconName } from '@/shared/components';
import { cn } from '@/shared/utils/cn';

import { PublicFabricDetailSkeleton } from './components/PublicFabricDetailSkeleton';
import {
  HOTLINE,
  PUBLIC_PAGE_LABELS as LABELS,
  STRETCH_TYPE_MAP,
  THICKNESS_MAP,
  SAMPLE_STATUS_MAP,
  STOCK_STATUS_MAP,
  LEAD_TIME_UNIT_MAP,
  IMAGE_TYPE_MAP,
} from './fabric-catalog.constants';

type WishlistItem = {
  id: string;
  code: string;
  name: string;
  slug: string;
  image_url: string | null;
  color_name: string | null;
};

type CompareItem = {
  id: string;
  code: string;
  name: string;
  slug: string;
  composition: string | null;
  target_width_cm: number | null;
  target_gsm: number | null;
  stretch_type: string | null;
  thickness: string | null;
  moq: string;
  lead_time: string;
};

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

  const requestMutation = useCreatePublicSampleRequest();
  const rfqMutation = useCreatePublicRFQRequest();

  const [activeColorImage, setActiveColorImage] = useState<string | null>(null);
  const [activeColorName, setActiveColorName] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Phase 3 States
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [compareList, setCompareList] = useState<CompareItem[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isBatchRequest, setIsBatchRequest] = useState(false);

  // Form states
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Phase 4 States
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [calcQty, setCalcQty] = useState<string>('100');
  const [rfqTargetPrice, setRfqTargetPrice] = useState('');
  const [rfqDeliveryDate, setRfqDeliveryDate] = useState('');
  const [rfqEmail, setRfqEmail] = useState('');
  const [rfqContactName, setRfqContactName] = useState('');
  const [rfqContactPhone, setRfqContactPhone] = useState('');
  const [rfqCompanyName, setRfqCompanyName] = useState('');
  // Load wishlist and compare list on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem('vp_fabric_wishlist');
    if (savedWishlist) {
      try {
        setWishlist(JSON.parse(savedWishlist));
      } catch {
        // ignore
      }
    }
    const savedCompare = localStorage.getItem('vp_fabric_compare');
    if (savedCompare) {
      try {
        setCompareList(JSON.parse(savedCompare));
      } catch {
        // ignore
      }
    }
  }, []);

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
  const isSaved = wishlist.some((item) => item.id === fabric.id);
  const handleToggleWishlist = () => {
    let updated: WishlistItem[];
    if (isSaved) {
      updated = wishlist.filter((item) => item.id !== fabric.id);
      toast.success('Đã bỏ lưu mẫu vải.');
    } else {
      updated = [
        ...wishlist,
        {
          id: fabric.id || '',
          code: fabric.code || '',
          name: fabric.name || '',
          slug: fabric.slug || '',
          image_url: fabric.image_url || null,
          color_name: activeColorName,
        },
      ];
      toast.success('Đã lưu mẫu vải.');
    }
    setWishlist(updated);
    localStorage.setItem('vp_fabric_wishlist', JSON.stringify(updated));
  };

  const clearWishlist = () => {
    setWishlist([]);
    localStorage.removeItem('vp_fabric_wishlist');
    toast.success('Đã xóa toàn bộ danh sách lưu.');
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

  const clearCompare = () => {
    setCompareList([]);
    localStorage.removeItem('vp_fabric_compare');
    toast.success('Đã xóa danh sách so sánh.');
  };

  // Submit sample request
  const handleSubmitSampleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim() || !contactAddress.trim()) {
      toast.error('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }
    const selectedVariants = isBatchRequest
      ? wishlist.map((item) => ({
          variant_code: item.code,
          color_name: item.color_name || 'Tất cả màu',
        }))
      : [
          {
            variant_code: fabric.code || '',
            color_name: activeColorName || 'Tất cả màu',
          },
        ];

    try {
      await requestMutation.mutateAsync({
        fabricCatalogId: fabric.id || '',
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        contactAddress: contactAddress.trim(),
        companyName: companyName.trim() || undefined,
        selectedVariants,
      });

      toast.success(LABELS.requestSuccess);
      setIsSampleModalOpen(false);

      // Clear forms
      setContactName('');
      setContactPhone('');
      setContactAddress('');
      setCompanyName('');

      if (isBatchRequest) {
        clearWishlist();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Gửi yêu cầu thất bại: ${msg}`);
    }
  };

  const handleSubmitRFQ = async (e: React.FormEvent) => {
    e.preventDefault();

    // Zod Validation Schema
    const rfqSchema = z.object({
      quantity: z
        .number({ invalid_type_error: LABELS.validationQtyInvalid })
        .positive(LABELS.validationQtyPositive),
      contactName: z.string().trim().min(1, LABELS.validationNameRequired),
      contactPhone: z.string().trim().min(1, LABELS.validationPhoneRequired),
      contactEmail: z
        .string()
        .trim()
        .email(LABELS.validationEmailInvalid)
        .optional()
        .or(z.literal('')),
      companyName: z.string().trim().optional(),
      targetPrice: z
        .number()
        .positive(LABELS.validationTargetPricePositive)
        .optional()
        .nullable(),
      targetDeliveryDate: z.string().optional().nullable(),
    });

    const parsedQty = Number(calcQty);
    const parsedTargetPrice = rfqTargetPrice ? Number(rfqTargetPrice) : null;

    const validationResult = rfqSchema.safeParse({
      quantity: parsedQty,
      contactName: rfqContactName,
      contactPhone: rfqContactPhone,
      contactEmail: rfqEmail,
      companyName: rfqCompanyName,
      targetPrice: parsedTargetPrice,
      targetDeliveryDate: rfqDeliveryDate || null,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message;
      toast.error(firstError || LABELS.validationNameRequired);
      return;
    }

    try {
      const activeVariant = variants?.find(
        (v) => v.color_name === activeColorName,
      );
      const variantId = activeVariant?.id || null;
      const unit = fabric.commercial?.minimum_order_unit || fabric.unit || 'kg';

      await rfqMutation.mutateAsync({
        fabricCatalogId: fabric.id || '',
        variantId,
        quantity: parsedQty,
        unit,
        targetPrice: parsedTargetPrice,
        targetDeliveryDate: rfqDeliveryDate || null,
        contactName: rfqContactName.trim(),
        contactPhone: rfqContactPhone.trim(),
        contactEmail: rfqEmail.trim() || null,
        companyName: rfqCompanyName.trim() || null,
      });

      toast.success(LABELS.rfqSuccess);
      setIsRfqModalOpen(false);

      // Reset form states
      setRfqTargetPrice('');
      setRfqDeliveryDate('');
      setRfqEmail('');
      setRfqContactName('');
      setRfqContactPhone('');
      setRfqCompanyName('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Gửi yêu cầu báo giá thất bại: ${msg}`);
    }
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
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {wishlist.length}
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
              alt={fabric.name}
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <span className="text-4xl block mb-2">{LABELS.noImageIcon}</span>
              <span className="text-sm">{LABELS.noImage}</span>
            </div>
          )}

          {/* View Count Badge */}
          {(fabric.view_count ?? 0) > 0 && (
            <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
              <span>🔥</span>
              {LABELS.viewCountPrefix} {fabric.view_count ?? 0}{' '}
              {LABELS.viewCountSuffix}
            </div>
          )}
        </div>

        {/* Labeled Visual Image Tabs */}
        {galleryImages.length > 0 && (
          <div className="flex border-t border-gray-100 overflow-x-auto scrollbar-none scroll-smooth">
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
                    'flex-1 min-w-[70px] text-center py-2 text-xs font-medium transition-all border-b-2 shrink-0 whitespace-nowrap px-2',
                    isActive
                      ? 'text-primary border-primary bg-primary/5'
                      : 'text-muted border-transparent hover:text-gray-900',
                  )}
                >
                  {label}
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
            {fabric.commercial?.sample_status && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                  SAMPLE_STATUS_MAP[fabric.commercial.sample_status]
                    ?.colorClass,
                )}
              >
                <span>
                  {SAMPLE_STATUS_MAP[fabric.commercial.sample_status]?.dot}
                </span>
                {SAMPLE_STATUS_MAP[fabric.commercial.sample_status]?.label}
              </span>
            )}
            {fabric.commercial?.stock_status && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                  STOCK_STATUS_MAP[fabric.commercial.stock_status]?.colorClass,
                )}
              >
                <span>
                  {STOCK_STATUS_MAP[fabric.commercial.stock_status]?.dot}
                </span>
                {STOCK_STATUS_MAP[fabric.commercial.stock_status]?.label}
              </span>
            )}
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

        {/* B2B Commercial & Volume Pricing Layer */}
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <h3 className="text-base font-bold text-gray-900">
              {LABELS.volumePricing}
            </h3>
          </div>

          {/* Pricing Tiers Table */}
          {pricingTiers && pricingTiers.length > 0 ? (
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
                    .sort((a, b) => a.min_quantity - b.min_quantity)
                    .map((tier) => {
                      const rangeLabel = tier.max_quantity
                        ? `${tier.min_quantity} - ${tier.max_quantity}`
                        : `>= ${tier.min_quantity}`;
                      return (
                        <tr key={tier.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-medium">{rangeLabel}</td>
                          <td className="p-3 text-right font-semibold text-primary">
                            {new Intl.NumberFormat('vi-VN', {
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
              <p className="text-xs text-muted">{LABELS.noPricingTiersDesc}</p>
            </div>
          )}

          {/* Interactive Cost Estimator */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              {LABELS.calculatorTitle}
            </h4>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 block">
                {LABELS.calculatorQtyLabel}
              </label>
              <div className="relative rounded-xl shadow-sm">
                <input
                  type="number"
                  min="1"
                  value={calcQty}
                  onChange={(e) => setCalcQty(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl pl-3 pr-12 py-2 focus:outline-none focus:border-primary bg-white font-semibold"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-xs font-bold text-slate-500">
                    {fabric.commercial?.minimum_order_unit ||
                      fabric.unit ||
                      'kg'}
                  </span>
                </div>
              </div>
            </div>

            {/* Price Estimations */}
            {(Number(calcQty) || 0) > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">
                    {LABELS.calculatorEstPrice}
                  </span>
                  <span className="font-bold text-slate-800">
                    {(() => {
                      const qtyNum = Number(calcQty) || 0;
                      const sorted = pricingTiers
                        ? [...pricingTiers].sort(
                            (a, b) => a.min_quantity - b.min_quantity,
                          )
                        : [];
                      const matching = sorted.find((t) => {
                        const minOk = qtyNum >= t.min_quantity;
                        const maxOk =
                          t.max_quantity === null ||
                          t.max_quantity === undefined ||
                          qtyNum <= t.max_quantity;
                        return minOk && maxOk;
                      });
                      return matching
                        ? new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: matching.currency || 'VND',
                          }).format(matching.unit_price)
                        : LABELS.contactQuote;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2">
                  <span className="text-slate-500 font-medium">
                    {LABELS.calculatorEstTotal}
                  </span>
                  <span className="font-bold text-primary text-sm">
                    {(() => {
                      const qtyNum = Number(calcQty) || 0;
                      const sorted = pricingTiers
                        ? [...pricingTiers].sort(
                            (a, b) => a.min_quantity - b.min_quantity,
                          )
                        : [];
                      const matching = sorted.find((t) => {
                        const minOk = qtyNum >= t.min_quantity;
                        const maxOk =
                          t.max_quantity === null ||
                          t.max_quantity === undefined ||
                          qtyNum <= t.max_quantity;
                        return minOk && maxOk;
                      });
                      return matching && qtyNum > 0
                        ? new Intl.NumberFormat('vi-VN', {
                            style: 'currency',
                            currency: matching.currency || 'VND',
                          }).format(qtyNum * matching.unit_price)
                        : LABELS.contactQuote;
                    })()}
                  </span>
                </div>
              </div>
            )}

            {/* MOQ Warning */}
            {(() => {
              const qtyNum = Number(calcQty) || 0;
              const moqThreshold = override
                ? override.minimum_stock_order ||
                  override.minimum_custom_order ||
                  fabric.commercial?.minimum_order_qty ||
                  0
                : activeVariant?.moq ||
                  fabric.commercial?.minimum_order_qty ||
                  0;
              const isBelowMoq = qtyNum > 0 && qtyNum < moqThreshold;
              if (!isBelowMoq) return null;
              return (
                <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-100 text-[11px] leading-relaxed font-medium">
                  {LABELS.calculatorMoqWarning.replace(
                    '{moq}',
                    String(moqThreshold),
                  )}
                </div>
              );
            })()}

            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                setRfqContactName(contactName);
                setRfqContactPhone(contactPhone);
                setRfqCompanyName(companyName);
                setIsRfqModalOpen(true);
              }}
              className="mt-2 text-xs font-semibold"
            >
              <Icon name="FileText" className="w-4 h-4 mr-1.5" />
              {LABELS.rfqBtn}
            </Button>
          </div>
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

      {/* --- Wishlist Slide-Over Modal --- */}
      {isWishlistOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in relative">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon
                  name="Heart"
                  className="w-5 h-5 text-red-500 fill-current"
                />
                {LABELS.wishlistTitle} ({wishlist.length})
              </h3>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <Icon name="X" className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {wishlist.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">
                  {LABELS.wishlistEmpty}
                </div>
              ) : (
                wishlist.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 p-3 bg-slate-50 rounded-xl relative border border-slate-100"
                  >
                    <div className="w-14 h-14 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                          {LABELS.noImageIcon}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/p/fabric/${item.slug}`}
                        onClick={() => setIsWishlistOpen(false)}
                        className="font-bold text-gray-900 text-sm hover:text-primary block truncate"
                      >
                        {item.code}
                      </Link>
                      <p className="text-xs text-muted truncate">{item.name}</p>
                      {item.color_name && (
                        <span className="inline-block mt-1 text-[10px] bg-white border border-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-medium">
                          Màu: {item.color_name}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const updated = wishlist.filter(
                          (x) => x.id !== item.id,
                        );
                        setWishlist(updated);
                        localStorage.setItem(
                          'vp_fabric_wishlist',
                          JSON.stringify(updated),
                        );
                        toast.success('Đã bỏ lưu mẫu.');
                      }}
                      className="p-1 text-slate-400 hover:text-red-500 shrink-0 self-start"
                    >
                      <Icon name="Trash2" className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {wishlist.length > 0 && (
              <div className="p-4 border-t border-gray-100 flex flex-col gap-2 bg-slate-50">
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    setIsBatchRequest(true);
                    setIsWishlistOpen(false);
                    setIsSampleModalOpen(true);
                  }}
                >
                  <Icon name="PackageCheck" className="w-5 h-5 mr-2" />
                  {LABELS.wishlistBatchRequest}
                </Button>
                <Button variant="outline" fullWidth onClick={clearWishlist}>
                  {LABELS.clearAll}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Compare Modal --- */}
      {isCompareOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon name="Scale" className="w-5 h-5 text-primary" />
                {LABELS.compareTitle} ({compareList.length}/3)
              </h3>
              <button
                onClick={() => setIsCompareOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <Icon name="X" className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-x-auto p-4">
              {compareList.length < 2 ? (
                <div className="text-center py-16 text-slate-400 text-sm">
                  {LABELS.compareEmpty}
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-xs text-slate-700 min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="p-3 font-semibold text-slate-900 w-1/4">
                        Thông số
                      </th>
                      {compareList.map((item) => (
                        <th
                          key={item.id}
                          className="p-3 font-bold text-primary w-1/4"
                        >
                          <Link
                            to={`/p/fabric/${item.slug}`}
                            onClick={() => setIsCompareOpen(false)}
                            className="hover:underline"
                          >
                            {item.code}
                          </Link>
                          <span className="block text-[10px] text-muted font-normal mt-0.5 truncate">
                            {item.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-medium text-slate-900">
                        Thành phần
                      </td>
                      {compareList.map((item) => (
                        <td key={item.id} className="p-3">
                          {item.composition || LABELS.na}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-900">
                        Khổ rộng
                      </td>
                      {compareList.map((item) => (
                        <td key={item.id} className="p-3">
                          {item.target_width_cm
                            ? `${item.target_width_cm} cm`
                            : LABELS.na}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-900">
                        Định lượng
                      </td>
                      {compareList.map((item) => (
                        <td key={item.id} className="p-3">
                          {item.target_gsm
                            ? `${item.target_gsm} gsm`
                            : LABELS.na}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-900">
                        Co giãn
                      </td>
                      {compareList.map((item) => (
                        <td key={item.id} className="p-3">
                          {item.stretch_type
                            ? STRETCH_TYPE_MAP[item.stretch_type] ||
                              item.stretch_type
                            : LABELS.na}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-900">Độ dày</td>
                      {compareList.map((item) => (
                        <td key={item.id} className="p-3">
                          {item.thickness
                            ? THICKNESS_MAP[item.thickness] || item.thickness
                            : LABELS.na}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-900">MOQ</td>
                      {compareList.map((item) => (
                        <td
                          key={item.id}
                          className="p-3 font-semibold text-slate-900"
                        >
                          {item.moq}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-slate-900">
                        Thời gian giao
                      </td>
                      {compareList.map((item) => (
                        <td
                          key={item.id}
                          className="p-3 font-semibold text-slate-900"
                        >
                          {item.lead_time}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-slate-200">
                      <td className="p-3"></td>
                      {compareList.map((item) => (
                        <td key={item.id} className="p-3">
                          <button
                            onClick={() => {
                              const updated = compareList.filter(
                                (x) => x.id !== item.id,
                              );
                              setCompareList(updated);
                              localStorage.setItem(
                                'vp_fabric_compare',
                                JSON.stringify(updated),
                              );
                              toast.success('Đã bỏ so sánh.');
                            }}
                            className="text-red-500 hover:text-red-700 font-semibold"
                          >
                            Xóa
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              )}
            </div>

            {compareList.length > 0 && (
              <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-slate-50">
                <Button variant="outline" onClick={clearCompare}>
                  {LABELS.clearAll}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setIsCompareOpen(false)}
                >
                  {LABELS.close}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Sample Request Lead Form Modal --- */}
      {isSampleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon name="Package" className="w-5 h-5 text-primary" />
                {LABELS.requestSampleTitle}
              </h3>
              <button
                onClick={() => setIsSampleModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <Icon name="X" className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitSampleRequest}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              <p className="text-xs text-muted leading-relaxed">
                {LABELS.requestSampleDesc}
              </p>

              {/* Mẫu vải đang chọn */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-[10px] text-muted font-bold block mb-1">
                  MẪU VẢI ĐĂNG KÝ:
                </span>
                {isBatchRequest ? (
                  <div className="space-y-1">
                    {wishlist.map((item) => (
                      <div
                        key={item.id}
                        className="text-xs font-semibold text-slate-800"
                      >
                        • {item.code} - {item.name}{' '}
                        {item.color_name && `(${item.color_name})`}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs font-bold text-primary">
                    {fabric.code} - {fabric.name}{' '}
                    {activeColorName && `(Màu: ${activeColorName})`}
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {LABELS.contactNameLabel}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {LABELS.contactPhoneLabel}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="VD: 0989xxxxxx"
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {LABELS.contactAddressLabel}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={contactAddress}
                  onChange={(e) => setContactAddress(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary resize-none"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
              </div>

              {/* Company */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {LABELS.companyNameLabel}
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="VD: Thời trang Tấn Phát"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={requestMutation.isPending}
                >
                  {requestMutation.isPending
                    ? LABELS.requestPending
                    : LABELS.submitRequest}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Request for Quote (RFQ) Modal --- */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Icon name="FileText" className="w-5 h-5 text-primary" />
                {LABELS.rfqModalTitle}
              </h3>
              <button
                onClick={() => setIsRfqModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-200 text-slate-500"
              >
                <Icon name="X" className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitRFQ}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              <p className="text-xs text-muted leading-relaxed">
                {LABELS.rfqModalDesc}
              </p>

              {/* Mẫu vải và màu đang chọn */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-muted font-bold block mb-1">
                  {LABELS.fabricDetailHeader}
                </span>
                <div className="text-xs font-bold text-primary">
                  {fabric.code} - {fabric.name}{' '}
                  {activeColorName && `(Màu: ${activeColorName})`}
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  {LABELS.requestedQty}{' '}
                  <span className="font-bold text-slate-800">
                    {calcQty}{' '}
                    {fabric.commercial?.minimum_order_unit ||
                      fabric.unit ||
                      'kg'}
                  </span>
                </div>
              </div>

              {/* Contact Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {LABELS.contactNameLabel}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rfqContactName}
                  onChange={(e) => setRfqContactName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="VD: Nguyễn Văn A"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {LABELS.contactPhoneLabel}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={rfqContactPhone}
                  onChange={(e) => setRfqContactPhone(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="VD: 0989xxxxxx"
                />
              </div>

              {/* Contact Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {LABELS.rfqEmailLabel}
                </label>
                <input
                  type="email"
                  value={rfqEmail}
                  onChange={(e) => setRfqEmail(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="VD: khachhang@gmail.com"
                />
              </div>

              {/* Company Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {LABELS.companyNameLabel}
                </label>
                <input
                  type="text"
                  value={rfqCompanyName}
                  onChange={(e) => setRfqCompanyName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="VD: Thời trang Tấn Phát"
                />
              </div>

              {/* Target Price */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {LABELS.rfqTargetPriceLabel}
                </label>
                <input
                  type="number"
                  value={rfqTargetPrice}
                  onChange={(e) => setRfqTargetPrice(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                  placeholder="VD: 80000"
                />
              </div>

              {/* Target Delivery Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  {LABELS.rfqDeliveryDateLabel}
                </label>
                <input
                  type="date"
                  value={rfqDeliveryDate}
                  onChange={(e) => setRfqDeliveryDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={rfqMutation.isPending}
                >
                  {rfqMutation.isPending
                    ? LABELS.requestPending
                    : LABELS.rfqBtn}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
