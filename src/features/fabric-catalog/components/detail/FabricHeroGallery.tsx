import { useState, useEffect } from 'react';

import { Icon } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import type {
  FabricCatalog,
  FabricImage,
} from '@/domain/settings/fabric-catalog.types';
import {
  LABELS as GLOBAL_LABELS,
  PUBLIC_COMPONENT_LABELS as COMP_LABELS,
  IMAGE_TYPE_MAP,
} from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricHeroGalleryProps {
  fabric: Partial<FabricCatalog>;
  galleryImages: FabricImage[];
  activeColorImage: string | null;
  activeColorName: string | null;
  setActiveColorImage: (val: string | null) => void;
  setActiveColorName: (val: string | null) => void;
  currentImageIndex: number;
  setCurrentImageIndex: (val: number) => void;
}

export function FabricHeroGallery({
  fabric,
  galleryImages,
  activeColorImage,
  activeColorName,
  setActiveColorImage,
  setActiveColorName,
  currentImageIndex,
  setCurrentImageIndex,
}: FabricHeroGalleryProps) {
  const [imageError, setImageError] = useState(false);

  const displayImage =
    activeColorImage ||
    (galleryImages.length > 0
      ? galleryImages[currentImageIndex]?.image_url
      : fabric.image_url);

  const displayAltText = activeColorImage
    ? COMP_LABELS.HERO_COLOR_NAME.replace(
        '{color}',
        activeColorName || '',
      ).replace('{name}', fabric.name || '')
    : galleryImages.length > 0
      ? galleryImages[currentImageIndex]?.alt_text ||
        galleryImages[currentImageIndex]?.caption ||
        fabric.name
      : fabric.name;

  useEffect(() => {
    setImageError(false);
  }, [displayImage]);

  return (
    <div className="w-full bg-surface relative">
      <div className="w-full aspect-[4/3] bg-surface-secondary relative overflow-hidden border border-black/5">
        {displayImage && !imageError ? (
          <img
            src={displayImage}
            alt={displayAltText}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
            <Icon name="ImageOff" className="w-10 h-10 mb-2 opacity-30" />
            <span className="text-sm font-medium">
              {GLOBAL_LABELS.PREVIEW_NO_IMAGE}
            </span>
          </div>
        )}

        {(fabric.view_count ?? 0) > 0 && (
          <div className="absolute top-3 right-3 bg-foreground/60 backdrop-blur-md text-inverse-foreground px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
            <Icon name="Flame" className="w-3.5 h-3.5 text-orange-400" />
            {COMP_LABELS.HERO_VIEWS.replace(
              '{count}',
              (fabric.view_count ?? 0).toString(),
            )}
          </div>
        )}
      </div>

      {galleryImages.length > 0 && (
        <div className="flex overflow-x-auto gap-3 p-3 bg-surface scrollbar-none scroll-smooth">
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
                    : 'border-transparent hover:border-muted',
                )}
                title={img.caption || label}
              >
                <img
                  src={img.image_url}
                  alt={img.alt_text || label}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 inset-x-0 bg-foreground/60 backdrop-blur-sm py-1 px-0.5">
                  <p className="text-[9px] text-inverse-foreground font-medium text-center truncate leading-tight">
                    {label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
