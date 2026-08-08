import { cn } from '@/shared/utils/cn';
import type {
  FabricCatalog,
  FabricVariant,
} from '@/domain/settings/fabric-catalog.types';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricColorSelectorProps {
  fabric: Partial<FabricCatalog>;
  variants: FabricVariant[];
  activeColorName: string | null;
  onSelectColor: (colorName: string | null, imageUrl: string | null) => void;
}

export function FabricColorSelector({
  fabric,
  variants,
  activeColorName,
  onSelectColor,
}: FabricColorSelectorProps) {
  const activeVariant = variants.find((v) => v.color_name === activeColorName);

  return (
    <div className="bg-surface rounded-xl shadow-sm p-4">
      <div className="flex flex-col gap-1 mb-3">
        <h3 className="text-base font-bold text-foreground">
          {LABELS.colorSectionTitle}
        </h3>
        {activeColorName && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span>{LABELS.colorViewing}</span>
            <span className="font-semibold text-foreground">
              {activeColorName}
            </span>
            {activeVariant?.color_code && (
              <span className="bg-surface-secondary text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-mono">
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
              onSelectColor(
                v.color_name,
                v.public_image_url || fabric.image_url || null,
              );
            }}
            className={cn(
              'w-10 h-10 rounded-full border-2 transition-all shadow-sm flex items-center justify-center relative',
              activeColorName === v.color_name
                ? 'border-primary ring-2 ring-primary/20 scale-110'
                : 'border-default hover:border-muted',
            )}
            style={{ backgroundColor: v.color_hex || '#ccc' }}
            title={v.color_name}
          >
            {!v.color_hex && (
              <span className="text-[10px] text-muted-foreground font-medium">
                {LABELS.na}
              </span>
            )}
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
  );
}
