import { Icon } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import type {
  FabricCatalog,
  FabricImage,
} from '@/domain/settings/fabric-catalog.types';
import {
  PUBLIC_PAGE_LABELS as LABELS,
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

  return (
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

        {(fabric.view_count ?? 0) > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
            <span>🔥</span>
            Lượt xem: {fabric.view_count ?? 0}
          </div>
        )}
      </div>

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
  );
}
