import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Icon } from '@/shared/components';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricRecommendationsProps {
  alsoViewed: Partial<FabricCatalog>[] | undefined;
  related: Partial<FabricCatalog>[] | undefined;
}

function SafeImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 border border-gray-100">
        <Icon name="ImageOff" className="w-6 h-6 mb-1 opacity-30" />
        <span className="text-[10px] font-medium">{LABELS.noImage}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={className}
    />
  );
}

export function FabricRecommendations({
  alsoViewed,
  related,
}: FabricRecommendationsProps) {
  const hasAlsoViewed = alsoViewed && alsoViewed.length > 0;
  const hasRelated = related && related.length > 0;

  if (!hasAlsoViewed && !hasRelated) return null;

  return (
    <>
      {/* Collaborative Recommendations ("Khách hàng khác cũng xem") */}
      {hasAlsoViewed && (
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
                <div className="w-full aspect-square rounded-lg bg-gray-50 overflow-hidden mb-1.5 relative border border-black/5 shadow-sm">
                  {item.image_url ? (
                    <SafeImage
                      src={item.image_url}
                      alt={item.name || ''}
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
      {hasRelated && (
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
                <div className="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden shrink-0 border border-black/5 shadow-sm">
                  {item.image_url ? (
                    <SafeImage
                      src={item.image_url}
                      alt={item.name || ''}
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
    </>
  );
}
