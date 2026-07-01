import { Icon } from '@/shared/components';
import { cn } from '@/shared/utils/cn';
import {
  StatusBadge,
  SAMPLE_STATUS_CONFIG,
  STOCK_STATUS_CONFIG,
} from '@/shared/components/status-badge';
import type { FabricCatalog } from '@/domain/settings/fabric-catalog.types';
import { PUBLIC_PAGE_LABELS as LABELS } from '@/features/fabric-catalog/fabric-catalog.constants';

interface FabricTitleAndBadgesProps {
  fabric: Partial<FabricCatalog>;
  isCompared: boolean;
  isSaved: boolean;
  handleToggleCompare: () => void;
  handleToggleWishlist: () => void;
}

export function FabricTitleAndBadges({
  fabric,
  isCompared,
  isSaved,
  handleToggleCompare,
  handleToggleWishlist,
}: FabricTitleAndBadgesProps) {
  return (
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
  );
}
