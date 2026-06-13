import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { usePublicFabricBySlug } from '@/application/settings/useFabricCatalog';
import { Button, Icon } from '@/shared/components';

import {
  HOTLINE,
  PUBLIC_PAGE_LABELS as LABELS,
} from './fabric-catalog.constants';

export function PublicFabricDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: fabric, isLoading, isError } = usePublicFabricBySlug(slug);

  useEffect(() => {
    if (fabric?.name) {
      document.title = `${fabric.name} | Vĩnh Phát Textile`;
    }
  }, [fabric?.name]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p className="text-muted">{LABELS.loading}</p>
      </div>
    );
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

  const specsStr = [
    fabric.target_width_cm
      ? `${LABELS.width}: ${fabric.target_width_cm}cm`
      : null,
    fabric.target_gsm ? `${LABELS.gsm}: ${fabric.target_gsm}gsm` : null,
  ]
    .filter(Boolean)
    .join(' - ');

  const handleZaloClick = () => {
    const msg = `${LABELS.zaloMsgPrefix} ${fabric.code} - ${fabric.name}`;
    window.open(
      `https://zalo.me/${HOTLINE}?text=${encodeURIComponent(msg)}`,
      '_blank',
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 text-center">
        <h1 className="text-lg font-bold text-primary tracking-tight">
          Vĩnh Phát Textile
        </h1>
      </header>

      {/* Media */}
      <div className="w-full aspect-[4/3] bg-gray-200 relative">
        {fabric.image_url ? (
          <img
            src={fabric.image_url}
            alt={fabric.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            <span className="text-4xl block mb-2">📸</span>
            <span className="text-sm">{LABELS.noImage}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <main className="flex-1 p-4">
        <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-bold text-gray-900 leading-tight">
              {fabric.name}
            </h2>
          </div>
          <p className="text-primary font-semibold text-lg mb-4">
            {fabric.code}
          </p>

          <div className="space-y-3">
            {fabric.fabric_type && (
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-muted">{LABELS.fabricType}</span>
                <span className="font-medium text-gray-800">
                  {fabric.fabric_type === 'knitted'
                    ? LABELS.knitted
                    : LABELS.woven}
                </span>
              </div>
            )}

            {(fabric.composition_tags?.length
              ? fabric.composition_tags.join(', ')
              : fabric.composition) && (
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-muted">{LABELS.composition}</span>
                <span className="font-medium text-gray-800">
                  {fabric.composition_tags?.length
                    ? fabric.composition_tags.join(', ')
                    : fabric.composition}
                </span>
              </div>
            )}

            {specsStr && (
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-muted">{LABELS.specs}</span>
                <span className="font-medium text-gray-800">{specsStr}</span>
              </div>
            )}

            {fabric.weave_pattern && (
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-muted">{LABELS.weavePattern}</span>
                <span className="font-medium text-gray-800">
                  {fabric.weave_pattern}
                </span>
              </div>
            )}

            {fabric.machine_type && (
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-muted">{LABELS.machineType}</span>
                <span className="font-medium text-gray-800">
                  {fabric.machine_type}
                </span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <div className="flex gap-3 max-w-md mx-auto">
          <a
            href={`tel:${HOTLINE}`}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            <Icon name="Phone" className="w-5 h-5" />
            <span>{LABELS.callNow}</span>
          </a>
          <button
            onClick={handleZaloClick}
            className="flex-[2] flex items-center justify-center gap-2 bg-[#0068ff] hover:bg-[#0054cc] text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {/* Zalo Icon (Custom path or just text) */}
            <span className="font-bold text-lg">Zalo</span>
            <span>{LABELS.zaloQuote}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
