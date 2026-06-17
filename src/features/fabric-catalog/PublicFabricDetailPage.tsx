import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

import {
  usePublicFabricBySlug,
  useRelatedPublicFabrics,
} from '@/application/settings/useFabricCatalog';
import { Button, Icon } from '@/shared/components';
import { cn } from '@/shared/utils/cn';

import { PublicFabricDetailSkeleton } from './components/PublicFabricDetailSkeleton';
import { PublicStickyCTA } from './components/PublicStickyCTA';
import {
  PUBLIC_PAGE_LABELS as LABELS,
  STRETCH_TYPE_MAP,
  THICKNESS_MAP,
  STOCK_STATUS_MAP,
  LEAD_TIME_UNIT_MAP,
} from './fabric-catalog.constants';

export function PublicFabricDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: fabric, isLoading, isError } = usePublicFabricBySlug(slug);
  const { data: related } = useRelatedPublicFabrics(fabric?.id);

  const [activeColorImage, setActiveColorImage] = useState<string | null>(null);
  const [activeColorName, setActiveColorName] = useState<string | null>(null);

  useEffect(() => {
    if (fabric?.name) {
      document.title = `${fabric.name} | ${LABELS.brandName}`;
    }
    // Set initial active image
    if (fabric) {
      setActiveColorImage(fabric.image_url ?? null);
      setActiveColorName(null);
    }
  }, [fabric]);

  if (isLoading) {
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

  const images = [
    fabric.image_url,
    ...(fabric.public_images ?? []),
    ...(fabric.variants?.map((v) => v.public_image_url) ?? []),
  ].filter(Boolean);

  const displayImage = activeColorImage || images[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30 px-4 py-3 text-center">
        <h1 className="text-lg font-bold text-primary tracking-tight">
          {LABELS.brandName}
        </h1>
      </header>

      {/* Hero Image */}
      <div className="w-full aspect-[4/3] bg-gray-200 relative overflow-hidden">
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

      <main className="flex-1 p-3 space-y-3">
        {/* Basic Info & Stock Status */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-2xl font-bold text-gray-900 leading-tight mb-1">
            {fabric.name}
          </h2>
          <p className="text-primary font-semibold text-lg mb-3">
            {fabric.code}
          </p>

          {(() => {
            const statusInfo = fabric.stock_status
              ? STOCK_STATUS_MAP[fabric.stock_status]
              : null;
            if (!statusInfo) return null;
            return (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                <span className="text-sm">{statusInfo.dot}</span>
                <span className="text-sm font-medium text-gray-800">
                  {statusInfo.label}
                </span>
              </div>
            );
          })()}
        </div>

        {/* Color Chips */}
        {fabric.variants && fabric.variants.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-end mb-3">
              <h3 className="text-base font-bold text-gray-900">
                {LABELS.colorSectionTitle}
              </h3>
              {activeColorName && (
                <span className="text-sm text-muted">
                  {LABELS.colorViewing}{' '}
                  <span className="font-medium text-gray-900">
                    {activeColorName}
                  </span>
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              {(fabric.variants ?? []).map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setActiveColorImage(
                      v.public_image_url || fabric.image_url || null,
                    );
                    setActiveColorName(v.color_name);
                  }}
                  className={cn(
                    'w-10 h-10 rounded-full border-2 transition-all shadow-sm flex items-center justify-center',
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
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Specifications */}
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
                <span className="font-medium text-gray-800 text-sm">
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
                <span className="font-medium text-gray-800 text-sm">
                  {fabric.composition}
                </span>
              </div>
            )}

            {fabric.target_width_cm && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">
                  {LABELS.width}
                </span>
                <span className="font-medium text-gray-800 text-sm">
                  {fabric.target_width_cm} {LABELS.unitCm}
                </span>
              </div>
            )}

            {fabric.target_gsm && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">{LABELS.gsm}</span>
                <span className="font-medium text-gray-800 text-sm">
                  {fabric.target_gsm} {LABELS.unitGsm}
                </span>
              </div>
            )}

            {fabric.stretch_type && STRETCH_TYPE_MAP[fabric.stretch_type] && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">
                  {LABELS.stretch}
                </span>
                <span className="font-medium text-gray-800 text-sm">
                  {STRETCH_TYPE_MAP[fabric.stretch_type]}
                </span>
              </div>
            )}

            {fabric.thickness && THICKNESS_MAP[fabric.thickness] && (
              <div className="flex flex-col">
                <span className="text-xs text-muted mb-0.5">
                  {LABELS.thickness}
                </span>
                <span className="font-medium text-gray-800 text-sm">
                  {THICKNESS_MAP[fabric.thickness]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* MOQ & Lead Time */}
        {(fabric.minimum_order_qty || fabric.lead_time_min) && (
          <div className="bg-white rounded-xl shadow-sm p-4 flex gap-6">
            {fabric.minimum_order_qty && (
              <div className="flex-1">
                <span className="text-xs text-muted block mb-1">
                  {LABELS.moq}
                </span>
                <span className="font-bold text-gray-900">
                  {fabric.minimum_order_qty}{' '}
                  {fabric.minimum_order_unit || fabric.unit}
                </span>
              </div>
            )}
            {fabric.lead_time_min && (
              <div className="flex-1 border-l border-gray-100 pl-6">
                <span className="text-xs text-muted block mb-1">
                  {LABELS.leadTime}
                </span>
                <span className="font-bold text-gray-900">
                  {fabric.lead_time_min}-{fabric.lead_time_max}{' '}
                  {fabric.lead_time_unit &&
                  LEAD_TIME_UNIT_MAP[fabric.lead_time_unit]
                    ? LEAD_TIME_UNIT_MAP[fabric.lead_time_unit]
                    : fabric.lead_time_unit}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Characteristics */}
        {fabric.characteristics && fabric.characteristics.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3">
              {LABELS.characteristics}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {fabric.characteristics.map((char, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <Icon
                    name="Check"
                    className="w-4 h-4 text-emerald-500 shrink-0"
                  />
                  <span className="text-sm text-gray-700">{char.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Applications */}
        {fabric.applications && fabric.applications.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3">
              {LABELS.applications}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {fabric.applications.map((app, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <Icon
                    name="Check"
                    className="w-4 h-4 text-primary shrink-0"
                  />
                  <span className="text-sm text-gray-700">{app.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Products */}
        {related && related.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="text-base font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
              {LABELS.relatedProducts}
            </h3>
            <div className="space-y-3 pt-1">
              {related.map((item) => (
                <Link
                  key={item.id}
                  to={`/qr/fabric/${item.slug}`}
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
      <PublicStickyCTA
        fabricCode={fabric.code ?? ''}
        fabricName={fabric.name ?? ''}
      />
    </div>
  );
}
